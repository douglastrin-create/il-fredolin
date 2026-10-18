#!/usr/bin/env bash
# Aplica a migração, desfaz e confere que esquema e dados voltam idênticos; reaplicar duas vezes não falha.
set -euo pipefail
cd "$(dirname "$0")/../.."
P="psql -X -v ON_ERROR_STOP=1 -q -t -A"
$P -d postgres -c "drop database if exists fred_rt" -c "create database fred_rt" >/dev/null
$P -d fred_rt -f tests/db/supabase-shim.sql >/dev/null; $P -d fred_rt -f supabase/schema.sql >/dev/null
$P -d fred_rt >/dev/null <<'SQL'
insert into workspaces(id,name) values ('11111111-1111-1111-1111-111111111111','IF');
insert into records(workspace_id,col,id,data,updated_at) values
 ('11111111-1111-1111-1111-111111111111','lib','r1','{"st":{"proc":{"markup":4.2,"pastT":85}}}',1000),
 ('11111111-1111-1111-1111-111111111111','exec','e1','{"proc":{"markup":3.8}}',1000),
 ('11111111-1111-1111-1111-111111111111','lots','L1','{"proc":{"markup":3}}',1000),
 ('11111111-1111-1111-1111-111111111111','inv','E1','{"qty":5000}',1000);
SQL
snap(){ $P -d fred_rt -c "select string_agg(col||':'||id||'='||data::text||'@'||updated_at,' | ' order by col,id) from records"; }
schema(){ pg_dump -s -n public fred_rt | grep -vE '^(--|.(un)?restrict )' | sed '/^$/d' | sort; }  # ordem das concessões (ACL) é irrelevante
d0=$(snap); s0=$(schema)
for f in $(ls supabase/migrations/*.sql | grep -v '\.down\.sql$'); do $P -d fred_rt -f "$f" >/dev/null 2>&1; done
mid=$(snap); echo "$mid" | grep -q '"markup"' && { echo "FALHA: markup ainda nas receitas após migrar"; exit 1; }
for f in $(ls -r supabase/migrations/*.down.sql); do $P -d fred_rt -f "$f" >/dev/null; done
[ "$(snap)" = "$d0" ] || { echo "FALHA: dados diferentes após desfazer"; diff <(echo "$d0") <(snap); exit 1; }
[ "$(schema)" = "$s0" ] || { echo "FALHA: esquema diferente após desfazer"; diff <(echo "$s0") <(schema); exit 1; }
for i in 1 2; do for f in $(ls supabase/migrations/*.sql | grep -v '\.down\.sql$'); do $P -d fred_rt -f "$f" >/dev/null 2>&1; done; done
$P -d postgres -c "drop database fred_rt" >/dev/null
echo "ok | migrar → desfazer devolve esquema e dados idênticos; reaplicar é seguro"
