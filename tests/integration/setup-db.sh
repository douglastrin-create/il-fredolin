#!/usr/bin/env bash
# Cria o banco "fred_e2e" (shim do Supabase + esquema [+ migrações]) e o papel que o PostgREST usa.
# Uso: setup-db.sh baseline|migrated
set -euo pipefail
cd "$(dirname "$0")/../.."
P="psql -X -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "drop database if exists fred_e2e" -c "create database fred_e2e" >/dev/null
$P -d postgres -c "do \$\$ begin if not exists (select from pg_roles where rolname='authenticator') then create role authenticator login noinherit password 'x'; end if; end \$\$" >/dev/null
$P -d fred_e2e -f tests/db/supabase-shim.sql >/dev/null
$P -d fred_e2e -c "grant anon, authenticated to authenticator" >/dev/null
$P -d fred_e2e -f supabase/schema.sql >/dev/null
if [ "${1:-migrated}" = migrated ]; then for f in $(ls supabase/migrations/*.sql | grep -v '\.down\.sql$'); do $P -d fred_e2e -f "$f" >/dev/null; done; fi
# equipe de teste: maestro, chef e sous confirmados, num espaço
$P -d fred_e2e >/dev/null <<'SQL'
insert into auth.users values ('00000000-0000-0000-0000-00000000000a','maestro@if.br',now()),('00000000-0000-0000-0000-00000000000b','chef@if.br',now()),('00000000-0000-0000-0000-00000000000c','sous@if.br',now());
insert into workspaces(id,name) values ('11111111-1111-1111-1111-111111111111','Il Fredolin');
alter table members disable trigger user;
insert into members(workspace_id,email,user_id,role) values
 ('11111111-1111-1111-1111-111111111111','maestro@if.br','00000000-0000-0000-0000-00000000000a','maestro'),
 ('11111111-1111-1111-1111-111111111111','chef@if.br','00000000-0000-0000-0000-00000000000b','chef'),
 ('11111111-1111-1111-1111-111111111111','sous@if.br','00000000-0000-0000-0000-00000000000c','sous');
alter table members enable trigger user;
SQL
