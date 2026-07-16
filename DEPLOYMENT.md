# SSOR Deployment Guide

This document covers the current IP-based deployment and the steps to migrate to a custom domain with HTTPS.

---

## Current setup (no domain)

The app runs on the server `sodb-177` using PM2 with separate processes for the frontend and backend.

| Service  | URL |
|----------|-----|
| Frontend | http://10.121.9.177:3000 |
| Backend  | http://10.121.9.177:5000 |
| Health   | http://10.121.9.177:5000/api/health |

### Architecture

```
Browser
  ├── :3000  →  PM2 ssor-frontend  (serve -s build)
  └── :5000  →  PM2 ssor-backend   (Express API + auth cookies)
```

The frontend calls the backend API directly. Auth uses an HTTP-only cookie (`token`) set by the backend.

### Server files

| File | Purpose |
|------|---------|
| `ecosystem.config.cjs` | PM2 process definitions |
| `deploy.sh` | Pull, build, and reload in one command |
| `.deploy.local` | Server-specific host/ports (not in git; copy from `.deploy.local.example`) |

### One-command deploy

After pushing to GitHub:

```bash
ssh sodb-177
cd ~/ssor && ./deploy.sh
```

Or from your local machine:

```bash
ssh sodb-177 'cd ~/ssor && ./deploy.sh'
```

`deploy.sh` automatically:

1. Pulls latest code from `main`
2. Sets production env vars (`FRONTEND_URL`, `COOKIE_SECURE`, etc.)
3. Installs dependencies and runs `prisma generate`
4. Builds the React frontend
5. Reloads both PM2 processes

### HTTP cookie settings (current)

Because there is no HTTPS yet, the backend uses:

```env
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
```

This allows session cookies to work over plain HTTP. **Do not use this in a public production environment long-term** — move to HTTPS as soon as you have a domain.

### PM2 commands

```bash
pm2 status                  # process status
pm2 logs ssor-backend       # backend logs
pm2 logs ssor-frontend      # frontend logs
pm2 restart all             # restart both apps
pm2 save                    # persist process list
```

### Persist PM2 across reboots (run once)

```bash
sudo env PATH=$PATH:/home/sodb/.nvm/versions/node/v22.23.1/bin \
  /home/sodb/.nvm/versions/node/v22.23.1/lib/node_modules/pm2/bin/pm2 startup systemd -u sodb --hp /home/sodb
pm2 save
```

### After deploy — if dashboard shows 401

Log out and log back in. Old sessions from before a cookie-config change will not carry over.

---

## Future setup: custom domain + HTTPS

When you have a domain (e.g. `ssor.example.gov.in`), use nginx as a reverse proxy with TLS. This gives you a single origin, secure cookies, and no exposed backend port.

### Target architecture

```
Browser → https://ssor.example.gov.in
              │
              ▼
         nginx (:443)
              ├── /        →  frontend static (or PM2 :3000)
              └── /api/*   →  backend (:5000)
```

Single domain means cookies work naturally with `COOKIE_SECURE=true` and no cross-port CORS issues.

---

### Step 1 — DNS

Point your domain to the server IP:

```
ssor.example.gov.in   A   10.121.9.177
```

Allow time for DNS propagation (minutes to hours depending on TTL).

---

### Step 2 — Install nginx and Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### Step 3 — nginx site config

Create `/etc/nginx/sites-available/ssor`:

```nginx
server {
    listen 80;
    server_name ssor.example.gov.in;

    # Certbot will add HTTPS redirect here after certificate issuance

    location /api/ {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ssor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 4 — TLS certificate

```bash
sudo certbot --nginx -d ssor.example.gov.in
```

Certbot will:

- Obtain a Let's Encrypt certificate
- Update the nginx config for HTTPS on port 443
- Set up automatic renewal

Verify renewal timer:

```bash
sudo certbot renew --dry-run
```

> **Government / internal CA:** If Let's Encrypt is not allowed, replace this step with your organisation's CA certificate and configure nginx `ssl_certificate` / `ssl_certificate_key` manually.

---

### Step 5 — Update server environment

Edit `~/ssor/.deploy.local` on the server:

```bash
APP_HOST=ssor.example.gov.in
BACKEND_PORT=5000
FRONTEND_PORT=3000
GIT_BRANCH=main

FRONTEND_URL=https://ssor.example.gov.in
API_BASE_URL=https://ssor.example.gov.in/api
```

Then redeploy:

```bash
cd ~/ssor && ./deploy.sh
```

`deploy.sh` will automatically set `COOKIE_SECURE=true` when `FRONTEND_URL` starts with `https://`.

Confirm in `backend/.env`:

```env
NODE_ENV=production
FRONTEND_URL=https://ssor.example.gov.in
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
PORT=5000
```

And in `frontend/.env` (used at build time):

```env
REACT_APP_API_BASE_URL=https://ssor.example.gov.in/api
```

---

### Step 6 — Lock down direct port access (recommended)

Once nginx is serving traffic on 443, block public access to ports 3000 and 5000:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
sudo ufw deny 5000/tcp
sudo ufw enable
```

PM2 processes still listen on localhost; nginx proxies to them internally.

---

### Step 7 — Verify

```bash
curl -s https://ssor.example.gov.in/api/health
```

In the browser:

1. Open `https://ssor.example.gov.in`
2. Log in
3. Confirm the dashboard loads (no 401 errors)
4. In DevTools → Application → Cookies, verify `token` has `Secure` and `HttpOnly` flags

---

## Environment variable reference

### Backend (`backend/.env`)

| Variable | HTTP (current) | HTTPS (domain) |
|----------|----------------|----------------|
| `NODE_ENV` | `production` | `production` |
| `PORT` | `5000` | `5000` |
| `FRONTEND_URL` | `http://10.121.9.177:3000` | `https://ssor.example.gov.in` |
| `COOKIE_SECURE` | `false` | `true` (auto-set by deploy.sh) |
| `COOKIE_SAME_SITE` | `lax` | `lax` |
| `JWT_SECRET` | long random string | long random string |
| `DATABASE_URL` | PostgreSQL connection string | same |

### Frontend (`frontend/.env`)

| Variable | HTTP (current) | HTTPS (domain) |
|----------|----------------|----------------|
| `REACT_APP_API_BASE_URL` | `http://10.121.9.177:5000/api` | `https://ssor.example.gov.in/api` |

> Frontend env vars are baked in at build time. Always run `./deploy.sh` (which rebuilds the frontend) after changing them.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Dashboard 401 after login | Cookie not stored (Secure flag on HTTP) | Ensure `COOKIE_SECURE=false` for HTTP; log out and back in |
| CORS errors | `FRONTEND_URL` mismatch | Match `FRONTEND_URL` in backend `.env` to the URL in the browser |
| Blank page after domain switch | Stale frontend build | Run `./deploy.sh` to rebuild with new `REACT_APP_API_BASE_URL` |
| PM2 not running after reboot | Startup script not configured | Run the PM2 startup command in the section above |
| 502 from nginx | PM2 process down | `pm2 status` and `pm2 restart all` |

---

## Checklist: IP → domain migration

- [ ] DNS A record points to server IP
- [ ] nginx installed and site config enabled
- [ ] TLS certificate issued and auto-renewal verified
- [ ] `.deploy.local` updated with domain URLs
- [ ] `./deploy.sh` run successfully
- [ ] Login and dashboard work over HTTPS
- [ ] Direct ports 3000/5000 blocked from public internet
- [ ] PM2 startup configured for reboot persistence
