# API do Passe: imagem pública do Node.js 22; aplica as migrations e sobe a API compilada
FROM node:22-alpine

# O Prisma precisa do OpenSSL no Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# O postinstall (prisma generate) precisa do schema antes do npm ci
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run start:prod"]
