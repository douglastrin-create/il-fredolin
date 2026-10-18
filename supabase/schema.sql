-- Il Fredolin · esquema do banco (Supabase) — estado em produção em 17/10/2026
-- Reconstruído a partir da consulta de catálogo do projeto (tabelas, RLS, políticas, funções, gatilhos, índices).
-- Não exportados por aquela consulta: chaves estrangeiras e restrições CHECK (ver supabase/README.md, consulta 2).
-- Este arquivo descreve o estado; mudanças vão em supabase/migrations/ (nunca edite produção sem migração).

create table public.workspaces (
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint workspaces_pkey primary key (id)
);

create table public.members (
  workspace_id uuid not null,
  email text not null,
  user_id uuid,
  role text not null,
  name text,
  created_at timestamptz not null default now(),
  constraint members_pkey primary key (workspace_id, email)
);
create unique index members_one_workspace_per_user on public.members (user_id) where user_id is not null;

create table public.records (
  workspace_id uuid not null,
  col text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at bigint not null default 0,
  updated_by uuid,
  srv_at timestamptz not null default clock_timestamp(),
  constraint records_pkey primary key (workspace_id, col, id)
);
create index records_sync on public.records (workspace_id, srv_at);

create table public.library (
  id text not null,
  data jsonb not null,
  constraint library_pkey primary key (id)
);

-- ---------- funções ----------
create or replace function public.my_role(ws uuid) returns text
 language sql stable security definer set search_path to 'public' as $function$
  select role from public.members where workspace_id = ws and user_id = auth.uid()
$function$;

create or replace function public.can_read(ws uuid, c text) returns boolean
 language sql stable security definer set search_path to 'public' as $function$
  select case public.my_role(ws)
    when 'maestro' then true
    when 'chef'    then c <> 'fin'
    when 'sous'    then c in ('exec','lots','inv','ings','nx','vit')
    else false end
$function$;

create or replace function public.can_write(ws uuid, c text, del boolean) returns boolean
 language sql stable security definer set search_path to 'public' as $function$
  select case public.my_role(ws)
    when 'maestro' then true
    when 'chef'    then c in ('lib','exec','lots','ings','nx','inv','vit')
    when 'sous'    then c in ('lots','inv') and not del
    else false end
$function$;

create or replace function public.has_workspace() returns boolean
 language sql stable security definer set search_path to 'public' as $function$ select exists (select 1 from public.workspaces) $function$;

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

create or replace function public.members_keep_maestro() returns trigger language plpgsql as $function$
declare ws uuid := coalesce(old.workspace_id, new.workspace_id);
begin
  if (tg_op = 'DELETE' and old.role = 'maestro') or (tg_op = 'UPDATE' and old.role = 'maestro' and new.role <> 'maestro') then
    if (select count(*) from public.members where workspace_id = ws and role = 'maestro' and email <> old.email) = 0 then
      raise exception 'A equipe precisa de pelo menos um Maestro.';
    end if;
  end if;
  return coalesce(new, old);
end $function$;

create or replace function public.members_lower_email() returns trigger language plpgsql as $function$
begin new.email := lower(trim(new.email)); return new; end $function$;

create or replace function public.records_guard() returns trigger language plpgsql as $function$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;
  end if;
  new.srv_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end $function$;

-- ---------- gatilhos ----------
create trigger members_keep_maestro before update or delete on public.members for each row execute function public.members_keep_maestro();
create trigger members_lower_email before insert or update on public.members for each row execute function public.members_lower_email();
create trigger records_guard before insert or update on public.records for each row execute function public.records_guard();

-- ---------- segurança por linha ----------
alter table public.workspaces enable row level security;
alter table public.members enable row level security;
alter table public.records enable row level security;
alter table public.library enable row level security;

create policy ws_select on public.workspaces for select to authenticated using (my_role(id) is not null);
create policy ws_update on public.workspaces for update to authenticated using (my_role(id) = 'maestro') with check (my_role(id) = 'maestro');

create policy mem_select on public.members for select to authenticated using (my_role(workspace_id) is not null);
create policy mem_insert on public.members for insert to authenticated with check (my_role(workspace_id) = 'maestro');
create policy mem_update on public.members for update to authenticated using (my_role(workspace_id) = 'maestro') with check (my_role(workspace_id) = 'maestro');
create policy mem_delete on public.members for delete to authenticated using (my_role(workspace_id) = 'maestro');

create policy rec_select on public.records for select to authenticated using (can_read(workspace_id, col));
create policy rec_insert on public.records for insert to authenticated with check (can_write(workspace_id, col, deleted));
create policy rec_update on public.records for update to authenticated using (can_write(workspace_id, col, false)) with check (can_write(workspace_id, col, deleted));

create policy lib_select on public.library for select to authenticated
  using (exists (select 1 from members m where m.user_id = auth.uid() and m.role = any (array['maestro','chef'])));
