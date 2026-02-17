# Build stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Development stage
FROM base AS development
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY shared/ ./shared/
COPY frontend/ ./frontend/

WORKDIR /app/frontend
EXPOSE 5173
CMD ["pnpm", "dev"]

# Production build stage
FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY shared/ ./shared/
COPY frontend/ ./frontend/

WORKDIR /app/shared
RUN pnpm build

WORKDIR /app/frontend
RUN pnpm build

# Production stage with nginx
FROM nginx:alpine AS production
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
