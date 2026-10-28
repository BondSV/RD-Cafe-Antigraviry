# VPS production hosting

Public domain: `https://rd-cafe.sbond.uk/`.

The production service lives at `/home/ubuntu/apps/rd-cafe` on `ovh-vps`. It serves an independent release copy, not the mutable port-8088 preview. Container `rd-cafe-web` joins the existing `ffbsg_default` network and exposes no host port. The shared `ffbsg-caddy` service terminates HTTPS and routes the domain using `edge.caddy`.

Cloudflare DNS must contain an A record named `rd-cafe` pointing to `51.38.236.156`, DNS only, TTL Auto. It replaces the former CNAME to `046f64c65aeed96f.vercel-dns-017.com`. Do not retain a conflicting AAAA record pointing elsewhere.

## Research release

Production runs `research-2026-10-28-v4`, including required classroom gameplay recording and the once-per-playing-session optional questionnaire. The researcher page is `/research`. Follow `docs/RESEARCH_SETUP.md` for session configuration and private key handling.

The research container has a read-only root filesystem. Before starting it, create `research-data/sqlite-tmp` owned by UID/GID 1000 with mode 0700. Compose sets `SQLITE_TMPDIR=/data/sqlite-tmp`, so SQLite can spill large operations and compact backups in the private writable data mount. This directory is outside the public web root. Do not remove databases, backups, secrets or another application's files during image cleanup.

## Release procedure

1. For the research build, use `node scripts/build-research-release.mjs` and verify its isolated output against the intended research commit. This excludes pre-existing local experiments. Publish only the resulting static files and research server bundle, without macOS `.DS_Store` files or the private researcher access file.
2. Copy the build into `releases/<commit>` and verify every file against a SHA-256 release manifest. Keep `release-manifest.json` with the deployed files.
3. Point `current` at that release, then run `docker compose -f /home/ubuntu/apps/rd-cafe/compose.yml up -d --force-recreate web`. Recreating this service is necessary because Docker resolves the bind-mounted symlink when the container is created. Do not restart the shared edge proxy for an ordinary content release.
4. Verify the public domain with normal TLS validation, deployed asset hashes, desktop and phone screenshots, simulation startup and customer rear views.

After production verification, keep only the research image used by the running production container. Remove superseded application tags/images and only positively attributed obsolete build cache. Recheck production health and disk space. Recover an earlier version by rebuilding the relevant GitHub commit; do not retain deployment images for rollback. Never prune images or data belonging to other applications.

For edge-route changes, back up `/home/ubuntu/services/ffbsg/Caddyfile`, preserve its bind-mounted file identity when editing, validate inside `ffbsg-caddy`, then reload Caddy. Preserve all unrelated host routes and imports.
