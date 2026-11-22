FROM node:24-alpine AS builder

ENV PUBLIC_URL="./"

COPY . /ui

WORKDIR /ui

RUN corepack enable && \
	pnpm install --frozen-lockfile && \
	pnpm lint && \
	pnpm run types && \
	pnpm build

FROM caddy:2.11.9-alpine

COPY --from=builder /ui/dist /ui/dist
COPY --from=builder /ui/Caddyfile /ui/Caddyfile

WORKDIR /ui

EXPOSE 3000

CMD [ "caddy", "run", "--config", "/ui/Caddyfile" ]
