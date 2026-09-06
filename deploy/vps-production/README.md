# VPS production hosting

Public domain: `https://rd-cafe.sbond.uk/`.

The production service lives at `/home/ubuntu/apps/rd-cafe` on `ovh-vps`. It serves an independent release copy, not the mutable port-8088 preview. Container `rd-cafe-web` joins the existing `ffbsg_default` network and exposes no host port. The shared `ffbsg-caddy` service terminates HTTPS and routes the domain using `edge.caddy`.

Cloudflare DNS must contain an A record named `rd-cafe` pointing to `51.38.236.156`, DNS only, TTL Auto. It replaces the former CNAME to `046f64c65aeed96f.vercel-dns-017.com`. Do not retain a conflicting AAAA record pointing elsewhere.

## Release procedure

1. Build the intended committed source with `npm run build`, excluding local experiments. Publish only the resulting static files, without macOS `.DS_Store` files.
2. Copy the build into `releases/<commit>` and verify every file against a SHA-256 release manifest. Keep `release-manifest.json` with the deployed files.
3. Point `current` at that release, then run `docker compose -f /home/ubuntu/apps/rd-cafe/compose.yml up -d --force-recreate web`. Recreating this service is necessary because Docker resolves the bind-mounted symlink when the container is created. Do not restart the shared edge proxy for an ordinary content release.
4. Verify the public domain with normal TLS validation, deployed asset hashes, desktop and phone screenshots, simulation startup and customer rear views.

For rollback, point `current` at the previous release and recreate only `web` again. Domain migration can be rolled back by restoring the former CNAME. Keep the Vercel project until the VPS domain has been accepted.

For edge-route changes, back up `/home/ubuntu/services/ffbsg/Caddyfile`, preserve its bind-mounted file identity when editing, validate inside `ffbsg-caddy`, then reload Caddy. Preserve all unrelated host routes and imports.
