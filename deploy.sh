#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Optional server-specific overrides (not committed to git).
if [[ -f "$ROOT_DIR/.deploy.local" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.deploy.local"
fi

APP_HOST="${APP_HOST:-$(hostname -I | awk '{print $1}')}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
GIT_BRANCH="${GIT_BRANCH:-main}"
FRONTEND_URL="${FRONTEND_URL:-http://${APP_HOST}:${FRONTEND_PORT}}"
API_BASE_URL="${API_BASE_URL:-http://${APP_HOST}:${BACKEND_PORT}/api}"

# Redis (OTP / cache) — local server expected on this host.
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PORT="${REDIS_PORT:-6379}"
ENSURE_REDIS="${ENSURE_REDIS:-1}"
INSTALL_REDIS="${INSTALL_REDIS:-1}"

# MinIO (document storage) — local Docker Compose service.
# Access/secret MUST already be set in backend/.env (non-default). Deploy will not
# invent minioadmin credentials (production validateEnv rejects them).
MINIO_ENDPOINT="${MINIO_ENDPOINT:-127.0.0.1}"
MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_USE_SSL="${MINIO_USE_SSL:-false}"
MINIO_BUCKET="${MINIO_BUCKET:-ssor-documents}"
# Browser-reachable host for presigned URLs (required in production).
MINIO_PUBLIC_ENDPOINT="${MINIO_PUBLIC_ENDPOINT:-${APP_HOST}}"
MINIO_PUBLIC_PORT="${MINIO_PUBLIC_PORT:-${MINIO_PORT}}"
MINIO_PUBLIC_USE_SSL="${MINIO_PUBLIC_USE_SSL:-false}"
MINIO_COMPOSE_FILE="${MINIO_COMPOSE_FILE:-$ROOT_DIR/docker-compose.minio.yml}"
MINIO_VOLUME_NAME="${MINIO_VOLUME_NAME:-ssor_minio_data}"
ENSURE_MINIO="${ENSURE_MINIO:-1}"
# If MinIO is up but .env keys don't match the volume root user, recreate volume.
# DANGEROUS: deletes all MinIO objects. Default off; set 1 only when safe to wipe.
MINIO_RESET_ON_AUTH_FAIL="${MINIO_RESET_ON_AUTH_FAIL:-0}"
REQUIRE_REDIS="${REQUIRE_REDIS:-0}"
REQUIRE_MINIO="${REQUIRE_MINIO:-1}"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

warn() {
  printf '\n[%s] WARNING: %s\n' "$(date '+%H:%M:%S')" "$*" >&2
}

die() {
  printf '\n[%s] ERROR: %s\n' "$(date '+%H:%M:%S')" "$*" >&2
  exit 1
}

set_env() {
  local file="$1"
  local key="$2"
  local value="$3"

  if [[ ! -f "$file" ]]; then
    touch "$file"
  fi

  if grep -q "^${key}=" "$file"; then
    # Use | as sed delimiter; escape | \ & in value for safe replacement.
    local escaped
    escaped="$(printf '%s' "$value" | sed -e 's/[\\|&]/\\&/g')"
    sed -i "s|^${key}=.*|${key}=${escaped}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

get_env() {
  local file="$1"
  local key="$2"
  local default="${3:-}"

  if [[ -f "$file" ]] && grep -q "^${key}=" "$file"; then
    sed -n "s|^${key}=||p" "$file" | head -n1 | sed 's/^["'\'']//;s/["'\'']$//'
  else
    printf '%s' "$default"
  fi
}

redis_ping() {
  command -v redis-cli >/dev/null 2>&1 || return 1
  redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null | grep -qx PONG
}

install_redis_if_needed() {
  if command -v redis-cli >/dev/null 2>&1 && command -v redis-server >/dev/null 2>&1; then
    return 0
  fi
  if [[ "$INSTALL_REDIS" != "1" ]]; then
    return 1
  fi
  if ! command -v apt-get >/dev/null 2>&1; then
    warn "Cannot auto-install Redis (apt-get not available)."
    return 1
  fi
  log "Installing redis-server via apt"
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y redis-server
}

ensure_redis() {
  log "Ensuring Redis is reachable at ${REDIS_HOST}:${REDIS_PORT}"

  install_redis_if_needed || true

  if ! command -v redis-cli >/dev/null 2>&1; then
    if [[ "$REQUIRE_REDIS" == "1" ]]; then
      die "redis-cli not found. Install redis-server or set REQUIRE_REDIS=0."
    fi
    warn "redis-cli not found — OTP/cache will use file fallback."
    return 0
  fi

  if redis_ping; then
    log "Redis OK"
    return 0
  fi

  if command -v systemctl >/dev/null 2>&1; then
    if systemctl list-unit-files redis-server.service >/dev/null 2>&1; then
      log "Enabling + starting redis-server"
      sudo systemctl enable --now redis-server || sudo systemctl start redis-server || true
    elif systemctl list-unit-files redis.service >/dev/null 2>&1; then
      log "Enabling + starting redis"
      sudo systemctl enable --now redis || sudo systemctl start redis || true
    fi
  elif command -v service >/dev/null 2>&1; then
    sudo service redis-server start || sudo service redis start || true
  fi

  local i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if redis_ping; then
      log "Redis OK"
      return 0
    fi
    sleep 1
  done

  if [[ "$REQUIRE_REDIS" == "1" ]]; then
    die "Redis not reachable at ${REDIS_HOST}:${REDIS_PORT}."
  fi
  warn "Redis not reachable at ${REDIS_HOST}:${REDIS_PORT} — OTP/cache will use file fallback."
}

minio_ready() {
  curl -sf --connect-timeout 2 "http://${MINIO_ENDPOINT}:${MINIO_PORT}/minio/health/live" >/dev/null 2>&1
}

# Health live does not prove .env credentials match the volume root user.
minio_credentials_ok() {
  local access="$1"
  local secret="$2"
  command -v docker >/dev/null 2>&1 || return 1
  docker info >/dev/null 2>&1 || return 1

  # Use a one-shot mc client on host network against the S3 API.
  docker run --rm --network host --entrypoint /bin/sh minio/mc -c \
    "mc alias set local http://${MINIO_ENDPOINT}:${MINIO_PORT} '${access}' '${secret}' >/dev/null && mc ls local >/dev/null" \
    >/dev/null 2>&1
}

start_minio_compose() {
  local access="$1"
  local secret="$2"

  if ! MINIO_ROOT_USER="$access" MINIO_ROOT_PASSWORD="$secret" \
    docker compose -f "$MINIO_COMPOSE_FILE" up -d; then
    return 1
  fi

  local i
  for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    if minio_ready; then
      return 0
    fi
    sleep 1
  done
  return 1
}

reset_minio_volume() {
  local access="$1"
  local secret="$2"

  log "Recreating MinIO volume ${MINIO_VOLUME_NAME} with credentials from backend/.env"
  docker compose -f "$MINIO_COMPOSE_FILE" down || true
  docker volume rm "$MINIO_VOLUME_NAME" 2>/dev/null || true
  start_minio_compose "$access" "$secret"
}

ensure_minio() {
  local access secret
  access="$(get_env "$ROOT_DIR/backend/.env" "MINIO_ACCESS_KEY" "")"
  secret="$(get_env "$ROOT_DIR/backend/.env" "MINIO_SECRET_KEY" "")"

  log "Ensuring MinIO at ${MINIO_ENDPOINT}:${MINIO_PORT} (bucket: ${MINIO_BUCKET})"

  if [[ -z "$access" || -z "$secret" ]]; then
    die "MINIO_ACCESS_KEY / MINIO_SECRET_KEY missing in backend/.env. Set non-default credentials before deploy."
  fi
  if [[ "$access" == "minioadmin" || "$secret" == "minioadmin" ]]; then
    die "MINIO_ACCESS_KEY / MINIO_SECRET_KEY must not be minioadmin (production reject). Update backend/.env."
  fi

  if ! command -v docker >/dev/null 2>&1; then
    if [[ "$REQUIRE_MINIO" == "1" ]]; then
      die "docker not found. Cannot start MinIO."
    fi
    warn "docker not found — uploads will use disk fallback."
    return 0
  fi

  if ! docker info >/dev/null 2>&1; then
    if [[ "$REQUIRE_MINIO" == "1" ]]; then
      die "Docker daemon not running. Start Docker and re-run deploy."
    fi
    warn "Docker daemon not running — uploads will use disk fallback."
    return 0
  fi

  if [[ ! -f "$MINIO_COMPOSE_FILE" ]]; then
    die "Missing ${MINIO_COMPOSE_FILE}."
  fi

  # Always reconcile compose so container env/restart policy stay applied.
  # Note: changing ROOT user on an existing volume does NOT rotate credentials;
  # auth check + optional reset handles that case.
  if ! start_minio_compose "$access" "$secret"; then
    if [[ "$REQUIRE_MINIO" == "1" ]]; then
      die "MinIO did not become healthy on :${MINIO_PORT}."
    fi
    warn "MinIO did not become healthy — disk fallback will be active."
    return 0
  fi

  if minio_credentials_ok "$access" "$secret"; then
    log "MinIO OK (reachable + credentials match backend/.env)"
    return 0
  fi

  warn "MinIO is up but backend/.env credentials do not authenticate (volume likely initialized with different root keys)."

  if [[ "$MINIO_RESET_ON_AUTH_FAIL" == "1" ]]; then
    if ! reset_minio_volume "$access" "$secret"; then
      die "MinIO volume reset failed."
    fi
    if minio_credentials_ok "$access" "$secret"; then
      log "MinIO OK after volume recreate"
      return 0
    fi
    die "MinIO still rejecting credentials after volume recreate."
  fi

  if [[ "$REQUIRE_MINIO" == "1" ]]; then
    die "Fix MinIO credentials or re-run with MINIO_RESET_ON_AUTH_FAIL=1 (wipes MinIO data)."
  fi
  warn "Continuing with mismatched MinIO credentials — uploads will fall back to disk."
}

ensure_backend_service_env() {
  local env_file="$ROOT_DIR/backend/.env"

  # Redis/MinIO API talk to local daemons — always pin loopback unless explicitly overridden
  # via REDIS_HOST / MINIO_ENDPOINT in the environment or .deploy.local.
  # (Binding Redis to 127.0.0.1 means APP_HOST/public IP cannot be used as REDIS_HOST.)
  set_env "$env_file" "REDIS_HOST" "$REDIS_HOST"
  set_env "$env_file" "REDIS_PORT" "$REDIS_PORT"
  set_env "$env_file" "MINIO_ENDPOINT" "$MINIO_ENDPOINT"
  set_env "$env_file" "MINIO_PORT" "$MINIO_PORT"
  if [[ -z "$(get_env "$env_file" "MINIO_USE_SSL")" ]]; then
    set_env "$env_file" "MINIO_USE_SSL" "$MINIO_USE_SSL"
  fi
  if [[ -z "$(get_env "$env_file" "MINIO_BUCKET")" ]]; then
    set_env "$env_file" "MINIO_BUCKET" "$MINIO_BUCKET"
  fi

  # Do NOT auto-write access/secret — must be set manually to non-default values.
  if [[ -z "$(get_env "$env_file" "MINIO_ACCESS_KEY")" || -z "$(get_env "$env_file" "MINIO_SECRET_KEY")" ]]; then
    die "Set MINIO_ACCESS_KEY and MINIO_SECRET_KEY in backend/.env before deploying (non-default)."
  fi

  # Public signing endpoint = host browsers can reach (APP_HOST by default).
  set_env "$env_file" "MINIO_PUBLIC_ENDPOINT" "$MINIO_PUBLIC_ENDPOINT"
  set_env "$env_file" "MINIO_PUBLIC_PORT" "$MINIO_PUBLIC_PORT"
  set_env "$env_file" "MINIO_PUBLIC_USE_SSL" "$MINIO_PUBLIC_USE_SSL"
}

validate_production_backend_env() {
  local env_file="$ROOT_DIR/backend/.env"
  local access secret pub
  access="$(get_env "$env_file" "MINIO_ACCESS_KEY" "")"
  secret="$(get_env "$env_file" "MINIO_SECRET_KEY" "")"
  pub="$(get_env "$env_file" "MINIO_PUBLIC_ENDPOINT" "")"

  log "Validating production backend/.env (Redis / MinIO requirements)"

  if [[ -z "$access" || -z "$secret" ]]; then
    die "MINIO_ACCESS_KEY / MINIO_SECRET_KEY required in backend/.env."
  fi
  if [[ "$access" == "minioadmin" || "$secret" == "minioadmin" ]]; then
    die "Refuse to deploy with default minioadmin credentials."
  fi
  if [[ -z "$pub" ]]; then
    die "MINIO_PUBLIC_ENDPOINT required in production (e.g. ${APP_HOST})."
  fi
}

wait_for_backend() {
  local url="http://127.0.0.1:${BACKEND_PORT}/api/health"
  local i code
  # AUTO_DB_PUSH / materialized-view builds can take several minutes on first boot.
  local max_wait="${BACKEND_HEALTH_WAIT_SECS:-180}"
  log "Waiting for backend health at ${url} (up to ${max_wait}s)"
  for ((i = 1; i <= max_wait; i++)); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 "$url" || true)"
    if [[ "$code" == "200" ]]; then
      log "Backend health OK (${i}s)"
      return 0
    fi
    if (( i % 30 == 0 )); then
      log "Still waiting for backend... ${i}s (last HTTP ${code:-000})"
    fi
    sleep 1
  done
  warn "Backend health not OK yet (last HTTP ${code:-000}). Check: pm2 logs ssor-backend --lines 50"
}

wait_for_frontend() {
  local url="http://127.0.0.1:${FRONTEND_PORT}"
  local i code
  log "Waiting for frontend at ${url}"
  for i in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 "$url" || true)"
    if [[ "$code" == "200" ]]; then
      log "Frontend OK (${i}s)"
      return 0
    fi
    sleep 1
  done
  warn "Frontend not serving on :${FRONTEND_PORT} (last HTTP ${code:-000}). Try: pm2 restart ssor-frontend"
}

load_nvm() {
  export NVM_DIR="$HOME/.nvm"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    source "$NVM_DIR/nvm.sh"
  fi
}

sync_repo() {
  log "Fetching and hard-resetting to origin/${GIT_BRANCH} (replaces git pull)"
  git fetch origin "$GIT_BRANCH"
  git checkout "$GIT_BRANCH"
  git reset --hard "origin/${GIT_BRANCH}"
  # Remove untracked files; keep server-only env and local deploy config.
  git clean -fd --exclude=backend/.env --exclude=frontend/.env --exclude=.deploy.local
}

if [[ "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  sync_repo
else
  log "Skipping git sync (SKIP_GIT_PULL=1)"
fi

load_nvm

log "Updating production environment URLs"
set_env "$ROOT_DIR/backend/.env" "NODE_ENV" "production"
set_env "$ROOT_DIR/backend/.env" "PORT" "$BACKEND_PORT"
set_env "$ROOT_DIR/backend/.env" "FRONTEND_URL" "$FRONTEND_URL"
if [[ "$FRONTEND_URL" == https://* ]]; then
  set_env "$ROOT_DIR/backend/.env" "COOKIE_SECURE" "true"
else
  set_env "$ROOT_DIR/backend/.env" "COOKIE_SECURE" "false"
fi
set_env "$ROOT_DIR/frontend/.env" "REACT_APP_API_BASE_URL" "$API_BASE_URL"

log "Ensuring Redis / MinIO backend env defaults"
ensure_backend_service_env
validate_production_backend_env

# Refresh locals from .env so compose / health checks use the same values.
REDIS_HOST="$(get_env "$ROOT_DIR/backend/.env" "REDIS_HOST" "$REDIS_HOST")"
REDIS_PORT="$(get_env "$ROOT_DIR/backend/.env" "REDIS_PORT" "$REDIS_PORT")"
MINIO_ENDPOINT="$(get_env "$ROOT_DIR/backend/.env" "MINIO_ENDPOINT" "$MINIO_ENDPOINT")"
MINIO_PORT="$(get_env "$ROOT_DIR/backend/.env" "MINIO_PORT" "$MINIO_PORT")"
MINIO_BUCKET="$(get_env "$ROOT_DIR/backend/.env" "MINIO_BUCKET" "$MINIO_BUCKET")"
MINIO_PUBLIC_ENDPOINT="$(get_env "$ROOT_DIR/backend/.env" "MINIO_PUBLIC_ENDPOINT" "$MINIO_PUBLIC_ENDPOINT")"

if [[ "$ENSURE_REDIS" == "1" ]]; then
  ensure_redis
else
  log "Skipping Redis check (ENSURE_REDIS=0)"
fi

if [[ "$ENSURE_MINIO" == "1" ]]; then
  ensure_minio
else
  log "Skipping MinIO check (ENSURE_MINIO=0)"
fi

log "Installing backend dependencies"
(
  cd "$ROOT_DIR/backend"
  npm install
  npx prisma generate
)

log "Installing frontend dependencies and building"
(
  cd "$ROOT_DIR/frontend"
  npm install
  npm run build
)

log "Starting or reloading PM2 processes"
# Single start/restart only — a follow-up restart aborts long AUTO_DB_PUSH / MV builds.
# ssor-frontend runs `npm run serve:prod`; a cluster-mode reload leaves the npm wrapper
# alive while the child `serve` dies, so restart (not reload) is required there.
if pm2 describe ssor-backend >/dev/null 2>&1; then
  pm2 restart "$ROOT_DIR/ecosystem.config.cjs" --update-env
else
  pm2 start "$ROOT_DIR/ecosystem.config.cjs"
fi

pm2 save

wait_for_backend
wait_for_frontend

log "Deployment complete"
pm2 status
echo
echo "Frontend : ${FRONTEND_URL}"
echo "Backend  : http://${APP_HOST}:${BACKEND_PORT}"
echo "Health   : http://${APP_HOST}:${BACKEND_PORT}/api/health"
echo "Redis    : ${REDIS_HOST}:${REDIS_PORT}$(redis_ping && echo ' (up)' || echo ' (down — file fallback)')"
echo "MinIO    : ${MINIO_ENDPOINT}:${MINIO_PORT}$(minio_ready && echo ' (up)' || echo ' (down — disk fallback)')"
echo "MinIO UI : http://${MINIO_PUBLIC_ENDPOINT}:9001"
echo
echo "Tip: if MinIO auth fails next time after rotating keys, redeploy with:"
echo "  MINIO_RESET_ON_AUTH_FAIL=1 ./deploy.sh"
