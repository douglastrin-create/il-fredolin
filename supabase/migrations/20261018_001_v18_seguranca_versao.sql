-- Il Fredolin · migração 001 (v18) · 18/10/2026
-- Rode no Supabase: SQL Editor → cole tudo → Run. É uma transação: ou aplica tudo, ou nada.
-- Desfazer: supabase/migrations/20261018_001_v18_seguranca_versao.down.sql
-- Compatível com o app antigo (v17): ele continua funcionando; só perde a gravação que já seria descartada.
begin;

-- =====================================================================
-- 1. CONVITES SÓ COM E-MAIL CONFIRMADO
--    claim_invites confiava no e-mail do token. Se a confirmação de e-mail estiver desligada no Auth (ou for
--    desligada um dia), quem criasse conta com o e-mail de um convite pendente herdava o perfil.
-- =====================================================================
create or replace function public.claim_invites() returns table(workspace_id uuid, role text, workspace_name text)
 language plpgsql security definer set search_path to 'public' as $function$
declare em text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then return; end if;
  if not exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null) then return; end if;
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
  if not exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null) then
    raise exception 'Confirme o e-mail pelo link que enviamos antes de criar o espaço.'; end if;
  if exists (select 1 from public.workspaces) then raise exception 'O espaço já existe: peça um convite ao Maestro.'; end if;
  insert into public.workspaces(name) values (coalesce(nullif(trim(p_name), ''), 'Il Fredolin')) returning id into ws;
  insert into public.members(workspace_id, email, user_id, role) values (ws, em, auth.uid(), 'maestro');
  return ws;
end $function$;

-- =====================================================================
-- 2. VERSÃO POR REGISTRO E CONFLITOS VISÍVEIS
--    Antes: gravação com updated_at (relógio do aparelho) mais antigo era descartada em silêncio (return null):
--    o app recebia "ok", e o aparelho com relógio atrasado perdia edições sem saber.
--    Agora: o servidor numera cada versão (ver). O app novo envia a versão que viu (base_ver); se outro aparelho
--    gravou antes, o servidor responde 409 (conflito) e o app guarda a edição na quarentena. "Tentar de novo"
--    envia force = true. Apps antigos (sem base_ver) seguem a regra do relógio, mas agora com 409 em vez de silêncio.
-- =====================================================================
alter table public.records add column if not exists ver bigint not null default 1;
alter table public.records add column if not exists base_ver bigint;
alter table public.records add column if not exists force boolean not null default false;

create or replace function public.records_guard() returns trigger language plpgsql
 set search_path to 'public' as $function$
declare role_ text := public.my_role(new.workspace_id); mk jsonb; path text[];
begin
  if tg_op = 'UPDATE' then
    if new.force then
      null;
    elsif new.base_ver is not null then
      if new.base_ver <> old.ver then
        raise exception using errcode = 'PT409', message = 'conflito: registro alterado em outro aparelho',
          detail = json_build_object('col', old.col, 'id', old.id, 'ver', old.ver)::text;
      end if;
    elsif new.updated_at < old.updated_at then
      raise exception using errcode = 'PT409', message = 'conflito: versão mais antiga que a do servidor',
        detail = json_build_object('col', old.col, 'id', old.id, 'ver', old.ver)::text;
    end if;
    -- baixa de estoque (movimento) é só de inserção: quem não é Maestro não altera nem apaga uma baixa registrada
    if old.col = 'inv' and old.data ->> 'kind' = 'mov' and coalesce(role_, '') <> 'maestro'
       and (new.data is distinct from old.data or new.deleted is distinct from old.deleted) then
      raise exception using errcode = 'PT409', message = 'conflito: baixa de estoque já registrada';
    end if;
    new.ver := old.ver + 1;
    new.base_ver := null; new.force := false;
  else
    new.ver := 1;   -- base_ver/force não são limpos aqui: num upsert o UPDATE recebe os valores do INSERT
  end if;
  -- 3. preço (markup) fica só na coleção de custos (fin), que só o Maestro lê
  path := case new.col when 'lib' then array['st','proc','markup'] when 'exec' then array['proc','markup']
                       when 'lots' then array['proc','markup'] else null end;
  if path is not null and new.data #> path is not null then
    mk := new.data #> path;
    new.data := new.data #- path;
    if role_ = 'maestro' then
      insert into public.records(workspace_id, col, id, data, updated_at)
      values (new.workspace_id, 'fin', 'mk:' || new.col || ':' || new.id, jsonb_build_object('v', mk), new.updated_at)
      on conflict (workspace_id, col, id) do update set data = excluded.data, updated_at = excluded.updated_at, force = true;
    end if;
  end if;
  new.srv_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end $function$;

-- =====================================================================
-- 3b. MARKUP JÁ GRAVADO: copia para fin e retira das receitas, execuções e lotes.
--     Gatilho desligado durante a cópia para preservar autor e data; srv_at sobe para os aparelhos receberem.
-- =====================================================================
alter table public.records disable trigger records_guard;
insert into public.records(workspace_id, col, id, data, updated_at, srv_at)
select workspace_id, 'fin', 'mk:' || col || ':' || id,
       jsonb_build_object('v', data #> (case col when 'lib' then array['st','proc','markup'] else array['proc','markup'] end)),
       updated_at, clock_timestamp()
  from public.records
 where (col = 'lib' and data #> '{st,proc,markup}' is not null) or (col in ('exec','lots') and data #> '{proc,markup}' is not null)
on conflict (workspace_id, col, id) do nothing;
update public.records set data = data #- '{st,proc,markup}', ver = ver + 1, srv_at = clock_timestamp()
 where col = 'lib' and data #> '{st,proc,markup}' is not null;
update public.records set data = data #- '{proc,markup}', ver = ver + 1, srv_at = clock_timestamp()
 where col in ('exec','lots') and data #> '{proc,markup}' is not null;
-- todos os aparelhos relêem uma vez e passam a conhecer a versão de cada registro
update public.records set srv_at = clock_timestamp();
alter table public.records enable trigger records_guard;

-- a API (PostgREST) relê o esquema para enxergar as colunas novas
notify pgrst, 'reload schema';
commit;
