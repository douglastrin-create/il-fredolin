-- Il Fredolin · DESFAZ a migração 001 (volta ao esquema de 17/10/2026).
-- Devolve o markup às receitas, execuções e lotes a partir de fin; remove a versão por registro.
begin;
alter table public.records disable trigger records_guard;
update public.records r set data = jsonb_set(r.data, case r.col when 'lib' then '{st,proc,markup}'::text[] else '{proc,markup}'::text[] end, f.data -> 'v', true),
       srv_at = clock_timestamp()
  from public.records f
 where f.workspace_id = r.workspace_id and f.col = 'fin' and f.id = 'mk:' || r.col || ':' || r.id
   and r.col in ('lib','exec','lots') and (r.col <> 'lib' or r.data ? 'st') and (r.col = 'lib' or r.data ? 'proc');
delete from public.records where col = 'fin' and id like 'mk:%';
alter table public.records enable trigger records_guard;

create or replace function public.records_guard() returns trigger language plpgsql as $function$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;
  end if;
  new.srv_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end $function$;
alter table public.records drop column if exists force;
alter table public.records drop column if exists base_ver;
alter table public.records drop column if exists ver;

create or replace function public.claim_invites() returns table(workspace_id uuid, role text, workspace_name text)
 language plpgsql security definer set search_path to 'public' as $function$
declare em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then return; end if;
  update public.members m set user_id = auth.uid()
   where m.email = em and m.user_id is null
     and not exists (select 1 from public.members x where x.user_id = auth.uid());
  return query select m.workspace_id, m.role, w.name from public.members m join public.workspaces w on w.id = m.workspace_id where m.user_id = auth.uid();
end $function$;
create or replace function public.create_workspace(p_name text) returns uuid
 language plpgsql security definer set search_path to 'public' as $function$
declare ws uuid; em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then raise exception 'Entre na sua conta primeiro.'; end if;
  if exists (select 1 from public.workspaces) then raise exception 'O espaço já existe: peça um convite ao Maestro.'; end if;
  insert into public.workspaces(name) values (coalesce(nullif(trim(p_name), ''), 'Il Fredolin')) returning id into ws;
  insert into public.members(workspace_id, email, user_id, role) values (ws, em, auth.uid(), 'maestro');
  return ws;
end $function$;
-- a API (PostgREST) relê o esquema para enxergar as colunas novas
notify pgrst, 'reload schema';
commit;
