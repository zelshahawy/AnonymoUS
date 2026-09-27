# Kubernetes deployment

This directory deploys only the application into namespace `anonymous`. It uses your existing Traefik ingress controller and external load balancer. MongoDB remains external. Both application Services are ClusterIP; market-data-service is internal only.

## Cluster settings

Before deploying, check `ingress.yaml`: the ingress class is `traefik`, hostname is `anon-backend.ziad-unit-64e.com`, entrypoint is `websecure`, and the existing ACME resolver is assumed to be `myresolver` (carried over from Compose). No certificate resolver or HTTP redirect is installed here. Configure HTTPS redirects on your existing ingress infrastructure if needed.

If you use a Kubernetes TLS Secret instead, remove the certresolver annotation and add `spec.tls` with `hosts` and `secretName`; the TLS Secret must exist in the `anonymous` namespace. If the external load balancer terminates TLS and forwards HTTP, remove the TLS and certresolver annotations and change the entrypoint to `web`. Set trusted forwarded headers on your existing Traefik appropriately.

## Secrets and deployment

Run from the repository root, targeting your intended cluster:

```sh
kubectl config current-context
kubectl apply -f k8s/namespace.yaml
kubectl -n anonymous create secret generic backend-env \
  --from-env-file=anonymous-server-backend/.env \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --dry-run=server -k k8s
kubectl apply -k k8s
kubectl -n anonymous rollout status deployment/market-data-service
kubectl -n anonymous rollout status deployment/backend
kubectl -n anonymous get pods,services,ingress
```

The backend environment file must contain Kubernetes-compatible `KEY=value` lines with unquoted values, no shell `export`, and no variable interpolation. Required keys include `ANONYMOUS_BACKEND_MONGO_URI`, `ANONYMOUS_BACKEND_SECRET_KEY`, `ANONYMOUS_BACKEND_GOOGLE_CLIENT_ID`, and `ANONYMOUS_BACKEND_GOOGLE_CLIENT_SECRET`. Preserve your existing frontend URL, OAuth, and reCAPTCHA configuration. MongoDB must be reachable from the pods; localhost refers to the pod itself. The Deployment explicitly sets `ANONYMOUS_BACKEND_STOCK_API=http://market-data-service:5005`, overriding any old value in the Secret.

Keep real secrets out of Git. Updating backend-env requires `kubectl -n anonymous rollout restart deployment/backend` to reload environment variables. If Docker Hub images are private, configure an image pull Secret in this namespace and reference it with `imagePullSecrets` in both Deployments.

## Operational limits

The backend intentionally has one replica and uses Recreate because WebSocket clients and presence are stored in process memory. Updates briefly interrupt service and disconnect WebSockets. Do not scale it horizontally until chat delivery and presence use shared coordination. Sticky sessions alone do not solve cross-pod messaging.

The backend TCP probes verify that its HTTP listener is open (it opens after the initial MongoDB connection); they do not continuously check database health. Market-data probes use local `/openapi.json` and do not call Yahoo Finance. Resource values are starting points; tune them from measured usage.

Images are pinned by digest. To deploy a new release, publish both architectures, update each Deployment's image digest, and apply again. To roll back, restore the previous manifest digests and apply. The market data service uses an ephemeral local cache; no persistent volume is required.

References: [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) and [Traefik Ingress configuration](https://doc.traefik.io/traefik/reference/routing-configuration/kubernetes/ingress/).
