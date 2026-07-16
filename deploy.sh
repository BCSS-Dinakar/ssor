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

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
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

load_nvm() {
  export NVM_DIR="$HOME/.nvm"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    source "$NVM_DIR/nvm.sh"
  fi
}

log "Syncing to origin/${GIT_BRANCH}"
if [[ "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  git fetch origin "$GIT_BRANCH"
  git checkout "$GIT_BRANCH"
  # Deployment server: always match remote. Preserves gitignored .env files.
  git clean -fd --exclude=backend/.env --exclude=frontend/.env --exclude=.deploy.local
  git reset --hard "origin/${GIT_BRANCH}"
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
