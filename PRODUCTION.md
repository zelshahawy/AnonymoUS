# Production deployment

For Kubernetes, use [k8s/README.md](k8s/README.md). The manifests use your existing Traefik and load balancer.

## Docker Compose alternative


The root `docker-compose.yml` builds local source for development. Use `docker-compose.production.yml` on the server to pull published images instead.

`production-images.env` records the published Docker Hub image digests for release `release-20260927-k8s` (linux/amd64 and linux/arm64). Keep it next to the production Compose file:

```dotenv
BACKEND_IMAGE=docker.io/zelshahawy/anonymous-backend@sha256:bf023c0b5472fca70440c99599fbc7fe1ef2b65dd49eebebf0125be4f13c9329
MARKET_DATA_IMAGE=docker.io/zelshahawy/market-data-service@sha256:e90f959e4bae28025fd51c4b43657da71d469c3cd013c5176326f38423cc9bdd
```

Keep backend secrets in `anonymous-server-backend/.env`, relative to the Compose file. Configuration keys use the `ANONYMOUS_BACKEND_` prefix. MongoDB must be reachable from the container; `localhost` refers to the container itself. The default stock API address is `http://market-data-service:5005`.

The server needs an existing `traefik-net` network and Traefik attached to it, with `web` and `websecure` entrypoints and the `myresolver` certificate resolver. The configured hostname must resolve to that server. Sign in to the registry on the server if the images are private.

```sh
docker compose --env-file production-images.env -f docker-compose.production.yml config --quiet
docker compose --env-file production-images.env -f docker-compose.production.yml pull
docker compose --env-file production-images.env -f docker-compose.production.yml up -d --no-build
docker compose --env-file production-images.env -f docker-compose.production.yml ps
```

To roll back, restore the previous pair of image digests in `production-images.env` and repeat pull and up. Keep each release's digest file.
