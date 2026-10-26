## Stage 1: Dependencies
FROM node:22-slim AS deps

WORKDIR /app
COPY .npmrc ./
RUN npm install -g pnpm@10.33.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

## Stage 2: Build
FROM deps AS build

COPY . .
RUN pnpm build

## Stage 3: Production
FROM caddy:alpine AS production

LABEL org.opencontainers.image.title="loome"
LABEL org.opencontainers.image.description="A programmable practice band for improvising and comping"

RUN addgroup -g 1000 app && adduser -u 1000 -G app -D app

COPY --from=build --chown=app:app /app/dist /srv
COPY --chown=app:app Caddyfile /etc/caddy/Caddyfile

USER app

ENV XDG_CONFIG_HOME=/tmp/caddy/config XDG_DATA_HOME=/tmp/caddy/data

EXPOSE 8080
