-- Il Fredolin · migração 002 (v18) · 18/10/2026 — resolve avisos do Security Advisor do Supabase
-- Desfazer: 20261018_002_v18_permissoes_funcoes.down.sql
begin;
-- 1. funções de gatilho com search_path fixo (aviso 0011): impede que um objeto homônimo em outro schema seja usado
alter function public.members_keep_maestro() set search_path = public;
alter function public.members_lower_email() set search_path = public;
-- 2. anônimo não executa funções SECURITY DEFINER (aviso 0028). O app só as chama depois do login, e as regras
--    de segurança (RLS) que usam can_read/can_write/my_role valem só para usuários autenticados.
revoke execute on function public.can_read(uuid, text), public.can_write(uuid, text, boolean), public.my_role(uuid),
  public.claim_invites(), public.create_workspace(text), public.has_workspace() from public, anon;
grant execute on function public.can_read(uuid, text), public.can_write(uuid, text, boolean), public.my_role(uuid),
  public.claim_invites(), public.create_workspace(text), public.has_workspace() to authenticated;
commit;
