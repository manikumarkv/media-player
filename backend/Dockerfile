# Build stage
FROM node:20-alpine AS base
RUN apk add --no-cache openssl ffmpeg python3 py3-pip
# Install yt-dlp
RUN pip3 install --break-system-packages yt-dlp
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Development stage
FROM base AS development
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

COPY shared/ ./shared/
COPY backend/ ./backend/

WORKDIR /app/backend
RUN pnpm db:generate

EXPOSE 3000
CMD ["pnpm", "dev"]

# Production build stage
FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

COPY shared/ ./shared/
COPY backend/ ./backend/

WORKDIR /app/shared
RUN pnpm build

WORKDIR /app/backend
RUN pnpm db:generate && pnpm build

# Production stage
FROM node:20-alpine AS production
RUN apk add --no-cache openssl ffmpeg python3 py3-pip
RUN pip3 install --break-system-packages yt-dlp
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
