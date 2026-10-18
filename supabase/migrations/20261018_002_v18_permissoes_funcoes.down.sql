-- Il Fredolin · DESFAZ a migração 002
begin;
alter function public.members_keep_maestro() reset search_path;
alter function public.members_lower_email() reset search_path;
grant execute on function public.can_read(uuid, text), public.can_write(uuid, text, boolean), public.my_role(uuid),
  public.claim_invites(), public.create_workspace(text), public.has_workspace() to public, anon;
commit;
