# syntax=docker/dockerfile:1
# Multi-Stage-Build: ein Image "campusmarkt" mit REST-API, WebSocket, React-SPA und Job-Worker (ADR-0002, ADR-0010).

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable
WORKDIR /repo

# ---------------------------------------------------------------- Build
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY packages packages
COPY apps apps
RUN pnpm --filter @campusmarkt/contracts build \
 && pnpm --filter @campusmarkt/server build \
 && pnpm --filter @campusmarkt/web build
# Nur Produktionsabhängigkeiten des Servers, Workspace-Pakete werden hineinkopiert
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @campusmarkt/server deploy --prod --legacy /out \
 && rm -rf /out/src /out/test /out/*.config.ts /out/tsconfig*.json /out/.dependency-cruiser.cjs

# ---------------------------------------------------------------- Runtime
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=8080 \
    UPLOADS_DIR=/data/uploads \
    JOURNAL_DIR=/data/journal \
    WEB_DIST_DIR=/app/web/dist
WORKDIR /app
COPY --from=build --chown=root:root /out ./server
COPY --from=build --chown=root:root /repo/apps/web/dist ./web/dist
RUN mkdir -p /data/uploads /data/journal && chown node:node /data/uploads /data/journal
# Non-root, Code gehört root und ist damit für den Prozess schreibgeschützt (REQ-SEC-010)
USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
STOPSIGNAL SIGTERM
CMD ["node", "server/dist/main.js"]
