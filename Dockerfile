ARG NODE_IMAGE=node:24-alpine
ARG CADDY_IMAGE=caddy:2.8.4-alpine

FROM $NODE_IMAGE AS builder

ENV PUBLIC_URL="./"

COPY . /ui

WORKDIR /ui

RUN corepack enable && \
	pnpm install --frozen-lockfile && \
	pnpm lint && \
	pnpm run types && \
	pnpm build

FROM $CADDY_IMAGE

COPY --from=builder /ui/build /ui/build
COPY --from=builder /ui/Caddyfile /ui/Caddyfile

WORKDIR /ui

EXPOSE 3000

CMD [ "caddy", "run", "--config", "/ui/Caddyfile" ]
