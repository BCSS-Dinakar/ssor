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

# MinIO (document storage) — local Docker Compose service.
MINIO_ENDPOINT="${MINIO_ENDPOINT:-127.0.0.1}"
MINIO_PORT="${MINIO_PORT:-9000}"
MINIO_USE_SSL="${MINIO_USE_SSL:-false}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-ssor-documents}"
# Browser-reachable host for presigned URLs (required in production).
MINIO_PUBLIC_ENDPOINT="${MINIO_PUBLIC_ENDPOINT:-${APP_HOST}}"
MINIO_PUBLIC_PORT="${MINIO_PUBLIC_PORT:-${MINIO_PORT}}"
MINIO_PUBLIC_USE_SSL="${MINIO_PUBLIC_USE_SSL:-false}"
MINIO_COMPOSE_FILE="${MINIO_COMPOSE_FILE:-$ROOT_DIR/docker-compose.minio.yml}"
ENSURE_REDIS="${ENSURE_REDIS:-1}"
ENSURE_MINIO="${ENSURE_MINIO:-1}"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

warn() {
  printf '\n[%s] WARNING: %s\n' "$(date '+%H:%M:%S')" "$*" >&2
}

set_env() {
  local file="$1"
  local key="$2"
  local value="$3"

  if [[ ! -f "$file" ]]; then
    touch "$file"
  fi

  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
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
  redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null | grep -qx PONG
}

ensure_redis() {
  log "Ensuring Redis is reachable at ${REDIS_HOST}:${REDIS_PORT}"

  if ! command -v redis-cli >/dev/null 2>&1; then
    warn "redis-cli not found. Install redis-server (OTP/cache will use file fallback)."
    return 0
  fi

  if redis_ping; then
    log "Redis OK"
    return 0
  fi

  if command -v systemctl >/dev/null 2>&1; then
    if systemctl list-unit-files redis-server.service >/dev/null 2>&1; then
      log "Starting redis-server via systemctl"
      sudo systemctl start redis-server || true
    elif systemctl list-unit-files redis.service >/dev/null 2>&1; then
      log "Starting redis via systemctl"
      sudo systemctl start redis || true
    fi
  fi

  # Brief wait for bind.
  local i
  for i in 1 2 3 4 5; do
    if redis_ping; then
      log "Redis OK"
      return 0
    fi
    sleep 1
  done

  warn "Redis not reachable at ${REDIS_HOST}:${REDIS_PORT} — OTP/cache features will degrade (non-fatal)."
}

minio_ready() {
  curl -sf --connect-timeout 2 "http://${MINIO_ENDPOINT}:${MINIO_PORT}/minio/health/live" >/dev/null 2>&1
}

ensure_minio() {
  log "Ensuring MinIO is reachable at ${MINIO_ENDPOINT}:${MINIO_PORT} (bucket: ${MINIO_BUCKET})"

  if minio_ready; then
    log "MinIO OK"
    return 0
  fi

  if ! command -v docker >/dev/null 2>&1; then
    warn "docker not found. Cannot start MinIO — uploads will use disk fallback."
    return 0
  fi

  if ! docker info >/dev/null 2>&1; then
    warn "Docker daemon not running. Start Docker, then re-run deploy (or: docker compose -f docker-compose.minio.yml up -d)."
    return 0
  fi

  if [[ ! -f "$MINIO_COMPOSE_FILE" ]]; then
    warn "Missing ${MINIO_COMPOSE_FILE} — cannot start MinIO."
    return 0
  fi

  log "Starting MinIO via docker compose (${MINIO_COMPOSE_FILE})"
  # Prefer credentials already in backend/.env so the API and container match.
  local access secret
  access="$(get_env "$ROOT_DIR/backend/.env" "MINIO_ACCESS_KEY" "$MINIO_ACCESS_KEY")"
  secret="$(get_env "$ROOT_DIR/backend/.env" "MINIO_SECRET_KEY" "$MINIO_SECRET_KEY")"

  if ! MINIO_ROOT_USER="$access" MINIO_ROOT_PASSWORD="$secret" \
    docker compose -f "$MINIO_COMPOSE_FILE" up -d; then
    warn "docker compose failed to start MinIO — disk fallback will be active."
    return 0
  fi

  local i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if minio_ready; then
      log "MinIO OK"
      return 0
    fi
    sleep 1
  done

  warn "MinIO did not become healthy on :${MINIO_PORT} — disk fallback will be active until it is."
}

ensure_backend_service_env() {
  local env_file="$ROOT_DIR/backend/.env"

  # Keep deploy defaults, but do not clobber custom credentials already in .env.
  if [[ -z "$(get_env "$env_file" "REDIS_HOST")" ]]; then
    set_env "$env_file" "REDIS_HOST" "$REDIS_HOST"
  fi
  if [[ -z "$(get_env "$env_file" "REDIS_PORT")" ]]; then
    set_env "$env_file" "REDIS_PORT" "$REDIS_PORT"
  fi

  if [[ -z "$(get_env "$env_file" "MINIO_ENDPOINT")" ]]; then
    set_env "$env_file" "MINIO_ENDPOINT" "$MINIO_ENDPOINT"
  fi
  if [[ -z "$(get_env "$env_file" "MINIO_PORT")" ]]; then
    set_env "$env_file" "MINIO_PORT" "$MINIO_PORT"
  fi
  if [[ -z "$(get_env "$env_file" "MINIO_USE_SSL")" ]]; then
    set_env "$env_file" "MINIO_USE_SSL" "$MINIO_USE_SSL"
  fi
  if [[ -z "$(get_env "$env_file" "MINIO_ACCESS_KEY")" ]]; then
    set_env "$env_file" "MINIO_ACCESS_KEY" "$MINIO_ACCESS_KEY"
  fi
  if [[ -z "$(get_env "$env_file" "MINIO_SECRET_KEY")" ]]; then
    set_env "$env_file" "MINIO_SECRET_KEY" "$MINIO_SECRET_KEY"
  fi
  if [[ -z "$(get_env "$env_file" "MINIO_BUCKET")" ]]; then
    set_env "$env_file" "MINIO_BUCKET" "$MINIO_BUCKET"
  fi

  # Always refresh public signing endpoint for this host (production requirement).
  set_env "$env_file" "MINIO_PUBLIC_ENDPOINT" "$MINIO_PUBLIC_ENDPOINT"
  set_env "$env_file" "MINIO_PUBLIC_PORT" "$MINIO_PUBLIC_PORT"
  set_env "$env_file" "MINIO_PUBLIC_USE_SSL" "$MINIO_PUBLIC_USE_SSL"
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

# Refresh locals from .env so compose / health checks use the same credentials.
REDIS_HOST="$(get_env "$ROOT_DIR/backend/.env" "REDIS_HOST" "$REDIS_HOST")"
REDIS_PORT="$(get_env "$ROOT_DIR/backend/.env" "REDIS_PORT" "$REDIS_PORT")"
MINIO_ENDPOINT="$(get_env "$ROOT_DIR/backend/.env" "MINIO_ENDPOINT" "$MINIO_ENDPOINT")"
MINIO_PORT="$(get_env "$ROOT_DIR/backend/.env" "MINIO_PORT" "$MINIO_PORT")"
MINIO_ACCESS_KEY="$(get_env "$ROOT_DIR/backend/.env" "MINIO_ACCESS_KEY" "$MINIO_ACCESS_KEY")"
MINIO_SECRET_KEY="$(get_env "$ROOT_DIR/backend/.env" "MINIO_SECRET_KEY" "$MINIO_SECRET_KEY")"
MINIO_BUCKET="$(get_env "$ROOT_DIR/backend/.env" "MINIO_BUCKET" "$MINIO_BUCKET")"

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
if pm2 describe ssor-backend >/dev/null 2>&1; then
  pm2 reload "$ROOT_DIR/ecosystem.config.cjs" --update-env
else
  pm2 start "$ROOT_DIR/ecosystem.config.cjs"
fi

pm2 save

log "Deployment complete"
pm2 status
echo
echo "Frontend : ${FRONTEND_URL}"
echo "Backend  : http://${APP_HOST}:${BACKEND_PORT}"
echo "Health   : http://${APP_HOST}:${BACKEND_PORT}/api/health"
echo "Redis    : ${REDIS_HOST}:${REDIS_PORT}$(redis_ping && echo ' (up)' || echo ' (down — file fallback)')"
echo "MinIO    : ${MINIO_ENDPOINT}:${MINIO_PORT}$(minio_ready && echo ' (up)' || echo ' (down — disk fallback)')"
echo "MinIO UI : http://${APP_HOST}:9001"
