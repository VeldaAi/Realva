# Realva

Operating system for Florida real estate agents. 15 tools — comps, listing copy, contracts, flyers, CMAs, nurture sequences — running on your own VPS.

Live at: **https://realva.velda.ai**

## Stack

Next.js 14 · Prisma + Postgres 16 · Redis 7 + BullMQ · Ollama (Mistral 7B) · Better-Auth · Stripe · Resend · MinIO · Puppeteer · Playwright · Docker Compose.

---

## 1. Deploy to Hostinger VPS (first time)

> Run every command in **this exact order**. One-sentence summary above each block tells you what it does.

### 1a. SSH into your VPS

Opens a remote shell on your Hostinger server.

```bash
ssh root@<YOUR-VPS-IP>
```

### 1b. Install Docker

Installs Docker + Compose so the app can run.

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
```

### 1c. Install Ollama on the host (not in Docker)

The app calls Ollama via `host.docker.internal`. Mistral 7B needs ~4 GB RAM.

```bash
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable --now ollama
ollama pull mistral
```

### 1d. Clone the repo

Pulls the Realva source onto the VPS.

```bash
git clone https://github.com/veldaai/Realva.git realva
cd realva
```

### 1e. Configure secrets

Copies the template then opens it in `nano` so you can paste real keys. `Ctrl+O Enter Ctrl+X` to save and exit.

```bash
cp .env.example .env
openssl rand -base64 32    # copy output → paste into BETTER_AUTH_SECRET=
nano .env
```

Required keys to fill in (the rest can stay as defaults for now):

| Variable | Where to get it |
| --- | --- |
| `POSTGRES_PASSWORD` | Invent a strong random string |
| `MINIO_ROOT_PASSWORD` | Invent a strong random string |
| `BETTER_AUTH_SECRET` | Output of `openssl rand -base64 32` above |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Set after step 3 (webhook config) |
| `STRIPE_PRICE_BASIC/PRO/TEAM` | Stripe dashboard → Products → create 3 prices |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | e.g. `notifications@velda.ai` — domain must be verified in Resend |
| `RENTCAST_API_KEY` | rentcast.io → free tier signup |

### 1f. Start every service

Builds images and starts Postgres, Redis, MinIO, the Next.js app, and the BullMQ worker. First run pulls ~2 GB of base images + installs npm deps — give it 5-10 minutes.

```bash
docker compose up -d --build
docker compose logs -f app     # Ctrl+C when you see "ready on port 3001"
```

### 1g. Run database migrations + seed

Creates the schema and inserts a test user.

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npm run prisma:seed
```

### 1h. Sanity-check from the VPS itself

Confirms the app is listening.

```bash
curl http://localhost:3001/api/health
```

---

## 2. Point `realva.velda.ai` at the VPS

### 2a. Cloudflare DNS

Tells the internet that `realva.velda.ai` lives at your server.

In Cloudflare dashboard → DNS → **Add record**:
- Type: `A`
- Name: `realva`
- IPv4: `<YOUR-VPS-IP>`
- Proxy status: **Proxied (orange cloud)**
- Save.

### 2b. Install nginx + certbot on the VPS

Serves HTTPS on port 443 and terminates it before forwarding to the app on 3001.

```bash
apt-get update && apt-get install -y nginx certbot python3-certbot-nginx
```

### 2c. Create the nginx site

Drops in the reverse-proxy config.

```bash
cat >/etc/nginx/sites-available/realva <<'EOF'
server {
    listen 80;
    server_name realva.velda.ai;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/realva /etc/nginx/sites-enabled/realva
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 2d. Get a free HTTPS cert

Let's Encrypt issues a cert and wires it into nginx automatically. Pick "redirect" when prompted.

```bash
certbot --nginx -d realva.velda.ai --non-interactive --agree-tos -m you@velda.ai --redirect
```

Open **https://realva.velda.ai** in a browser. You should see the landing page.

---

## 3. Configure Stripe webhook

Stripe pings the app when someone subscribes, upgrades, or churns.

1. Stripe dashboard → Developers → Webhooks → **Add endpoint**
2. Endpoint URL: `https://realva.velda.ai/api/webhooks/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_...`) and paste into `.env` as `STRIPE_WEBHOOK_SECRET`
5. Restart the app to pick it up:

```bash
docker compose restart app
```

---

## 4. Adding the FAR/BAR AS-IS contract template

The Contract Filler expects a blank Florida FAR/BAR AS-IS PDF with fillable form fields.

```bash
# on your laptop, after buying/downloading the blank from FAR or BAR
scp blank-far-bar-as-is.pdf root@<YOUR-VPS-IP>:/root/realva/templates/contracts/
ssh root@<YOUR-VPS-IP> "cd /root/realva && docker compose restart app"
```

Field mappings are defined in `templates/contracts/far-bar-mapping.json` (edit to match your exact PDF field names).

---

## 5. Updating Realva

Pulls the latest code and rebuilds.

```bash
ssh root@<YOUR-VPS-IP>
cd /root/realva
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

---

## 6. Scaling up

| When you hit | Do this |
| --- | --- |
| PDF jobs queue up | `docker compose up -d --scale worker=2` |
| Ollama is CPU-bound | Move Ollama to a second VPS with a GPU, set `OLLAMA_URL=http://other-vps-ip:11434`, open port 11434 on that box only to your app VPS |
| Postgres is slow | Move Postgres to a managed provider, update `DATABASE_URL` |
| MinIO disk fills up | Mount a larger volume at `/var/lib/docker/volumes/realva_minio_data` or swap to S3 |

---

## 7. Local development (Mac/Linux laptop)

```bash
git clone https://github.com/veldaai/Realva.git realva && cd realva
cp .env.example .env
docker compose up -d postgres redis minio
npm install
npm run prisma:migrate:dev
npm run prisma:seed
npm run dev              # http://localhost:3001
# In another terminal, for the worker:
npm run worker
```

Ollama must be running on your laptop: `ollama pull mistral && ollama serve`.

---

## 8. Architecture at a glance

```
Browser
   │ HTTPS (realva.velda.ai)
   ▼
nginx (VPS:443) ──► Next.js app (VPS:3001)
                        │
                        ├── Postgres 16 (docker volume)
                        ├── Redis 7  ─── BullMQ ─── worker container
                        ├── MinIO  (S3-compatible, docker volume)
                        ├── Resend (outbound email)
                        ├── Stripe (subscriptions + webhooks)
                        └── Ollama (host process, port 11434)
```

Puppeteer & Playwright are bundled inside the app and worker images with `--no-sandbox` flags so they run in containers.

---

## 9. Env-var reference

Full list is in `.env.example` with inline comments. The ones you **must** set before first run:

- `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD` — random strings
- `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`
- `STRIPE_WEBHOOK_SECRET` (after step 3)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `RENTCAST_API_KEY`
- `OLLAMA_URL` (leave default if you followed step 1c)
- `APP_URL`, `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL` — all set to `https://realva.velda.ai`

Optional:
- `CENSUS_API_KEY`, `GREATSCHOOLS_API_KEY` — only needed for Neighborhood Reports
- `RATE_LIMIT_PER_HOUR` — defaults to 100

---

## 10. Uninstall

```bash
cd /root/realva
docker compose down -v        # -v wipes volumes (DB, MinIO)
rm -rf /root/realva
```
