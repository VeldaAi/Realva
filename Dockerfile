############################################
# Realva — Next.js app image (standalone)
# Includes Chromium for Puppeteer (PDF gen).
############################################
FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=false
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium fonts-liberation libnss3 libfreetype6 libharfbuzz0b \
  libx11-6 libxcomposite1 libxdamage1 libxrandr2 libxi6 libxtst6 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2 libatk1.0-0 \
  libatk-bridge2.0-0 libcups2 libdrm2 libgtk-3-0 libglib2.0-0 \
  ca-certificates openssl wget \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium fonts-liberation libnss3 libfreetype6 libharfbuzz0b \
  libx11-6 libxcomposite1 libxdamage1 libxrandr2 libxi6 libxtst6 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2 libatk1.0-0 \
  libatk-bridge2.0-0 libcups2 libdrm2 libgtk-3-0 libglib2.0-0 \
  ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/templates ./templates
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Install the Prisma CLI globally at the exact version we build against
# (otherwise `npx prisma` pulls latest — v7+ — which rejects our v5
# schema). Also install tsx so `prisma/seed.ts` can run from the
# production image without devDependencies.
RUN npm install -g prisma@5.22.0 tsx@4.19.1

EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
