# ============================================================
# Stage 1: Instalar TODAS las dependencias (incluyendo devDep para el build)
# ============================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# Se instalan TODAS las deps (dev incluidas) porque next build las necesita:
# typescript, tailwindcss, @tailwindcss/postcss, etc.
RUN npm ci

# ============================================================
# Stage 2: Build de la aplicación Next.js
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 3: Imagen final mínima (solo el standalone output)
# No necesita node_modules — Next.js standalone incluye todo
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7000
ENV HOSTNAME=0.0.0.0

# Usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 7000

CMD ["node", "server.js"]