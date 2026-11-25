FROM node:24-slim

RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# prisma.config.ts membutuhkan DATABASE_URL saat generate; nilai ini hanya placeholder build.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# DATABASE_URL, JWT_SECRET, AUTH_SECRET diisi lewat Environment di Dokploy (runtime).
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
