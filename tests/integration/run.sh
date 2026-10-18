#!/usr/bin/env bash
# Integração real: Postgres + PostgREST (mesma série do Supabase) + código de sincronização do app.
# Uso: tests/integration/run.sh   (requer PGHOST/PGPORT/PGUSER de um superusuário e o binário postgrest no PATH ou em $POSTGREST)
set -euo pipefail
cd "$(dirname "$0")/../.."
PGRST="${POSTGREST:-postgrest}"; PORT="${PGRST_PORT:-3555}"; export PGRST_URL="http://localhost:$PORT"
export JWT_SECRET="${JWT_SECRET:-il-fredolin-teste-local-segredo-de-32-bytes-ou-mais}"
conf=$(mktemp); trap 'kill $pid 2>/dev/null || true; rm -f "$conf"' EXIT
for mode in baseline migrated; do
  tests/integration/setup-db.sh "$mode"
  printf 'db-uri = "postgres://authenticator:x@%s:%s/fred_e2e"\ndb-schemas = "public"\ndb-anon-role = "anon"\njwt-secret = "%s"\nserver-port = %s\n' \
    "${PGHOST_TCP:-localhost}" "${PGPORT:-5432}" "$JWT_SECRET" "$PORT" > "$conf"
  "$PGRST" "$conf" > /tmp/pgrst-$mode.log 2>&1 & pid=$!
  for i in $(seq 1 50); do curl -sf "$PGRST_URL/" >/dev/null 2>&1 && break; sleep 0.2; done
  echo "== banco $mode"; DB_MODE=$mode node --test tests/integration/two-devices.mjs
  kill $pid; wait $pid 2>/dev/null || true
done
