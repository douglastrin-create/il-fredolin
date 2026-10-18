#!/usr/bin/env bash
# Il Fredolin · testes do banco num Postgres local.  Uso: tests/db/run.sh [baseline|migrated]
# Variáveis: PGHOST, PGPORT, PGUSER (superusuário). Cria e apaga o banco "fred_test".
set -euo pipefail
cd "$(dirname "$0")/../.."
mode="${1:-migrated}"
P="psql -X -v ON_ERROR_STOP=1 -q -t -A"
$P -d postgres -c "drop database if exists fred_test" -c "create database fred_test" >/dev/null
$P -d fred_test -f tests/db/supabase-shim.sql >/dev/null
$P -d fred_test -f supabase/schema.sql >/dev/null
args=()
if [ "$mode" = migrated ]; then
  ls supabase/migrations/*.sql | grep -v "\.down\.sql$" | xargs cat > /tmp/fred_mig_all.sql; args=(-v MIGRATION=/tmp/fred_mig_all.sql)
fi
out=$($P -d fred_test "${args[@]}" -f tests/db/policies.sql 2>&1) || { echo "$out"; exit 2; }
echo "$out" | grep -E '^(ok|FALHA)'
$P -d postgres -c "drop database fred_test" >/dev/null
if [ "$mode" = migrated ]; then ! echo "$out" | grep -q '^FALHA'; fi
