FROM caddy:2.11.9-alpine

COPY dist /ui/dist
COPY Caddyfile /ui/Caddyfile

ENV PUBLIC_URL="./"

WORKDIR /ui

EXPOSE 3000

CMD [ "caddy", "run", "--config", "/ui/Caddyfile" ]