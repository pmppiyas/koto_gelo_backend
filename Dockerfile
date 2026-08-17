# ---------- Base ----------
FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable

# ---------- Build ----------
FROM base AS build

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm prisma generate

RUN pnpm build

# Remove devDependencies to keep image small and prevent memory exhaustion
RUN pnpm prune --prod

# ---------- Production ----------
FROM base AS production

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]
