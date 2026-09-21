#!/usr/bin/env bash
# Put whatever was pushed to GitHub live on the VPS: pull, rebuild, restart,
# check. Run it after every push (code or data/curriculum.json).
#
# Why a pull alone is not enough: the Vite build output (_fresh/) is
# gitignored, and data/curriculum.json is baked into the server bundle at
# build time, so nothing changes until `deno task build` runs and the
# service restarts.
#
# Install once (see deploy/README.md, step 5):
#   sudo install -m 755 /opt/apps/urps-curriculum/deploy/update.sh /usr/local/bin/urps-update
# and let berkley restart this one service without a password (nothing else):
#   echo 'berkley ALL=(root) NOPASSWD: /usr/bin/systemctl restart urps-curriculum' \
#     | sudo tee /etc/sudoers.d/urps-update
#   sudo chmod 440 /etc/sudoers.d/urps-update
# Then, after each push:
#   ssh berkley@<VPS-IP> urps-update
#
# Environment:
#   APP_DIR  git checkout      (/opt/apps/urps-curriculum)
#   SERVICE  systemd unit      (urps-curriculum)
#   PORT     port the unit uses, for the health check (8001)

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/apps/urps-curriculum}"
SERVICE="${SERVICE:-urps-curriculum}"
PORT="${PORT:-8001}"

log() { printf '%s [urps-update] %s\n' "$(date -Is)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

for tool in git deno curl; do
  command -v "$tool" >/dev/null || die "$tool not installed"
done
[[ -d "$APP_DIR/.git" ]] || die "$APP_DIR is not a git checkout"
cd "$APP_DIR"

# Anything modified locally would block a fast-forward; say so plainly.
if ! git diff --quiet || ! git diff --cached --quiet; then
  git status --short
  die "uncommitted changes in $APP_DIR; resolve them first"
fi

before="$(git rev-parse --short HEAD)"
git pull -q --ff-only
after="$(git rev-parse --short HEAD)"
log "checkout $before -> $after"

# `deno task build` leaves node_modules/ in place, which the server needs at
# runtime (nodeModulesDir: auto). Never delete it after building.
log "building"
deno task build

log "restarting $SERVICE"
sudo -n systemctl restart "$SERVICE"
for _ in 1 2 3 4 5 6 7 8 9 10; do
  curl -fsS -o /dev/null "http://localhost:$PORT/" 2>/dev/null && break
  sleep 1
done
systemctl is-active --quiet "$SERVICE" || die "$SERVICE failed to come back up"

# The session count comes from the data, so adding a session never breaks this check.
last="$(deno eval 'console.log(JSON.parse(Deno.readTextFileSync("data/curriculum.json")).sessions.length)')"
[[ "$last" =~ ^[0-9]+$ ]] || die "could not read the session count from data/curriculum.json"

# Home, the two index pages, the first and last session, and a vendored font
for path in / /coverage /library /sessions/1 "/sessions/$last" \
  /fonts/geist-latin-wght-normal.woff2; do
  curl -fsS -o /dev/null "http://localhost:$PORT$path" || die "GET $path failed"
done

# One past the last session must be a real 404, not a 200 or a 500.
status="$(curl -sS -o /dev/null -w '%{http_code}' "http://localhost:$PORT/sessions/$((last + 1))")"
[[ "$status" == "404" ]] || die "GET /sessions/$((last + 1)) returned $status, expected 404"

# Captured first: under pipefail, `curl | grep -q` fails when grep exits early.
home="$(curl -fsS "http://localhost:$PORT/")"
[[ "$home" == *"URPS Fellowship Didactic Curriculum"* ]] ||
  die "/ is not serving the curriculum home page"

log "live at $after"
