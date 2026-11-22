ARG CADDY_IMAGE=caddy:2.8.4-alpine
FROM $CADDY_IMAGE

COPY dist /ui/dist
COPY Caddyfile /ui/Caddyfile

ENV PUBLIC_URL="./"

WORKDIR /ui

EXPOSE 3000

CMD [ "caddy", "run", "--config", "/ui/Caddyfile" ]