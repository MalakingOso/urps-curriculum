# Deploying urps-curriculum to education.xenoj.com

This directory has everything needed to put the URPS fellowship curriculum
browser live at `https://education.xenoj.com`, on the same Netcup VPS that
already runs urogyn-analyzer. It assumes that setup exists: the VPS (user
`berkley`, apps in `/opt/apps/`), the Cloudflare zone for xenoj.com in
Full (strict) mode, the origin cert at `/etc/ssl/cloudflare/{cert,key}.pem`,
ufw restricted to Cloudflare ranges, and Caddy. None of that is repeated
here; see `urogyn-analyzer/deploy/README.md` if any of it needs rebuilding.

The app is Fresh 2 + Vite. There is no database, no env vars and no data
pipeline: all content lives in the committed `data/curriculum.json` and is
baked into the server bundle at build time. The Vite build output
(`_fresh/`) and `node_modules/` are both gitignored, so a
`deno task build` is required after every clone/pull before the app will
run. `node_modules/` must stay in place after building (`nodeModulesDir:
auto`); the server needs it at runtime.

| | urogyn-analyzer | urps-curriculum |
|---|---|---|
| Subdomain | `urogyn.xenoj.com` | `education.xenoj.com` |
| Port | 8000 | 8001 |
| Checkout | `/opt/apps/urogyn-analyzer` | `/opt/apps/urps-curriculum` |
| systemd unit | `urogyn-analyzer` | `urps-curriculum` |

Run the numbered sections in order. Sections marked **[local]** run in WSL
on the dev machine; **[dashboard]** are manual clicks in a browser;
**[VPS]** are commands you run over SSH as `berkley`.

## 0. Create the GitHub repo and push **[local]**

From WSL (not Windows), in `~/Programming/urps-curriculum`, after the
initial commit:

```
gh repo create MalakingOso/urps-curriculum --public --source=. --remote=origin --push
```

Public is fine: the content is a public curriculum and there are no
secrets. Check that `deno.lock` was committed and `_fresh/` and
`node_modules/` were not (`git ls-files | grep -E '^(_fresh|node_modules)/'`
should print nothing).

## 1. Cloudflare DNS record **[dashboard]**

In Cloudflare DNS for xenoj.com, add:

| Type | Name      | Content    | Proxy status     |
|------|-----------|------------|------------------|
| A    | education | `<VPS-IP>` | Proxied (orange) |

Same `<VPS-IP>` as the existing `urogyn` record. This can also be done from
Claude Code through the Cloudflare plugin. Nothing else changes in
Cloudflare or Porkbun; the `*.xenoj.com` origin cert already covers
`education.xenoj.com`.

## 2. Clone and build **[VPS]**

```
ssh berkley@<VPS-IP>
git clone https://github.com/MalakingOso/urps-curriculum.git /opt/apps/urps-curriculum
cd /opt/apps/urps-curriculum
deno task build
```

Use `deno task build` (plain `vite build`), which leaves `node_modules/` in
place. Do not delete `node_modules/` afterwards.

## 3. Install the systemd unit **[VPS]**

```
sudo cp /opt/apps/urps-curriculum/deploy/urps-curriculum.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now urps-curriculum
curl -I http://localhost:8001
```

The last line should return `200` before you touch Caddy.

## 4. Add the Caddy block **[local]** then **[VPS]**

**Read this before editing anything.** The VPS's `/etc/caddy/Caddyfile` is
a copy of `urogyn-analyzer/deploy/Caddyfile`, and urogyn's README ships
Caddy changes with `sudo cp .../urogyn-analyzer/deploy/Caddyfile
/etc/caddy/Caddyfile`. So the education block has to live in *urogyn's*
repo. If it only exists in `/etc/caddy/Caddyfile`, the next time anyone
re-copies urogyn's Caddyfile it silently disappears and
education.xenoj.com goes down.

The block is in `deploy/Caddyfile.snippet`:

```
education.xenoj.com {
	encode zstd gzip
	reverse_proxy localhost:8001
	tls /etc/ssl/cloudflare/cert.pem /etc/ssl/cloudflare/key.pem
}
```

**Preferred:** in `~/Programming/urogyn-analyzer` (dev machine), paste that
block into `deploy/Caddyfile` in place of the commented-out "Next app goes
here" example (keep the tab indentation), commit and push there. Then on
the VPS:

```
cd /opt/apps/urogyn-analyzer && git pull --ff-only
sudo cp /opt/apps/urogyn-analyzer/deploy/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

**At minimum** (if you need it live before touching urogyn's repo), append
the snippet directly on the VPS:

```
sudo sh -c 'sed -n "/^education.xenoj.com {/,/^}/p" \
  /opt/apps/urps-curriculum/deploy/Caddyfile.snippet >> /etc/caddy/Caddyfile'
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

and then still add the same block to urogyn's `deploy/Caddyfile` and push
it, so the two stay identical. (Pulling urogyn on the VPS afterwards
creates no conflict; `/etc/caddy/Caddyfile` is not a git checkout.)

Always `validate` before `reload`: every site on this box shares one Caddy
process, so a broken block takes urogyn and xenoj.com down too.

## 5. Install the update script **[VPS]**

```
sudo install -m 755 /opt/apps/urps-curriculum/deploy/update.sh /usr/local/bin/urps-update
```

The script restarts the app, so `berkley` needs to run that one command
without a password. Nothing else is granted:

```
echo 'berkley ALL=(root) NOPASSWD: /usr/bin/systemctl restart urps-curriculum' \
  | sudo tee /etc/sudoers.d/urps-update
sudo chmod 440 /etc/sudoers.d/urps-update
sudo visudo -c
```

Then run it once by hand (`urps-update`) to confirm it goes through clean.
If you change `deploy/update.sh` itself, re-run the `install` line.

## 6. Verification

Don't consider this done until every one of these actually passes -- run
them for real, don't assume:

- [ ] `curl -I http://localhost:8001` on the VPS returns `200` (Fresh app
      itself is up, independent of Caddy/Cloudflare).
- [ ] `systemctl status urps-curriculum` shows `active (running)`;
      `journalctl -u urps-curriculum -n 50` shows clean startup, no errors.
- [ ] `dig +short education.xenoj.com` returns Cloudflare anycast IPs
      (104.x / 172.x), not the raw VPS IP (confirms proxying is active).
- [ ] `curl -I https://education.xenoj.com` returns `200` with a
      `server: cloudflare` header.
- [ ] `curl -I https://education.xenoj.com/sessions/59` returns `200`;
      `/sessions/60` returns `404`.
- [ ] `curl -I https://urogyn.xenoj.com` and `curl -I https://xenoj.com`
      still return `200` (the Caddy change didn't break the neighbours).
- [ ] From an outside network, `curl -m 10 -kI https://<VPS-IP> -H 'Host: education.xenoj.com'`
      times out or is refused (ufw only admits Cloudflare ranges).
- [ ] `urps-update` runs to `live at <sha>` with no errors.

## Shipping an update

A `git pull` alone does not change the live site: `_fresh/` is gitignored
and the curriculum data is baked in at build time, so every change needs a
build and a restart. `urps-update` does all of it.

1. **[local]** Edit, then `deno task build && deno task start` (or
   `deno task dev`) to check it.
2. **[local]** `git commit` and `git push`.
3. **[local]** `ssh berkley@<VPS-IP> urps-update`

It refuses to run if the VPS checkout has local changes, then does
`git pull --ff-only`, builds, restarts the service, and checks `/`,
`/coverage`, `/library`, `/sessions/1`, `/sessions/59`, a vendored font,
that `/sessions/60` is a 404, and that the home page still says "URPS
Fellowship Didactic Curriculum".

## Updating curriculum content

Edit `data/curriculum.json` directly; it is the canonical source. Then
ship it like any other change (above).

Do not re-run `scripts/extract.py` (`deno task extract`). It was a one-time
import from the original xlsx/PDF, and re-running it would overwrite every
manual edit made to `data/curriculum.json` since.
