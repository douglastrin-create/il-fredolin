-- Il Fredolin · testes de segurança e sincronização do banco (rodar com tests/db/run.sh).
-- Cada teste grava ok/FALHA em _t. Os testes descrevem o comportamento DESEJADO.
\set ON_ERROR_STOP 1
set client_min_messages = warning;
create table _t(n serial, nome text, ok boolean, det text);
grant all on _t to authenticated, anon; grant usage on sequence _t_n_seq to authenticated, anon;
create or replace function _ok(nome text, ok boolean, det text default '') returns void language sql as
 $$ insert into _t(nome, ok, det) values (nome, ok, det) $$;
grant execute on function _ok(text,boolean,text) to authenticated, anon;
-- entrar como usuário (claims do JWT) e papel do Supabase
create or replace function _as(uid uuid, email text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',email,'role','authenticated')::text, false);
 execute 'set role authenticated'; end $$;
create or replace function _anon() returns void language plpgsql as $$
begin perform set_config('request.jwt.claims','{"role":"anon"}', false); execute 'set role anon'; end $$;

-- ---------- dados de base (como superusuário) ----------
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a','maestro@if.br',now()),('00000000-0000-0000-0000-00000000000b','chef@if.br',now()),
 ('00000000-0000-0000-0000-00000000000c','sous@if.br',now()),('00000000-0000-0000-0000-00000000000d','estranho@x.com',now()),
 ('00000000-0000-0000-0000-00000000000e','novo@if.br',null);   -- e-mail ainda não confirmado
select _as('00000000-0000-0000-0000-00000000000a','maestro@if.br');
select create_workspace('Il Fredolin');
reset role;
insert into members(workspace_id,email,user_id,role) select id,'chef@if.br','00000000-0000-0000-0000-00000000000b','chef' from workspaces;
insert into members(workspace_id,email,user_id,role) select id,'sous@if.br','00000000-0000-0000-0000-00000000000c','sous' from workspaces;
insert into members(workspace_id,email,role) select id,'novo@if.br','chef' from workspaces;   -- convite pendente
insert into records(workspace_id,col,id,data,updated_at) select id,'lib','r1','{"name":"Fior","st":{"proc":{"markup":4.2,"pastT":85}}}',1000 from workspaces;
insert into records(workspace_id,col,id,data,updated_at) select id,'exec','e1','{"name":"Fior","proc":{"markup":4.2}}',1000 from workspaces;
insert into records(workspace_id,col,id,data,updated_at) select id,'lots','L1','{"code":"IF-1","proc":{"markup":4.2}}',1000 from workspaces;
insert into records(workspace_id,col,id,data,updated_at) select id,'fin','lib:r1','{"v":{"leite":3.9}}',1000 from workspaces;
insert into records(workspace_id,col,id,data,updated_at) select id,'inv','E1','{"ingId":"leite","qty":5000}',1000 from workspaces;
create temp table ws as select id from workspaces;  grant select on ws to authenticated, anon;
-- migrações que existirem rodam aqui (run.sh injeta), simulando produção já com dados
\if :{?MIGRATION}
\i :MIGRATION
\endif

-- ---------- 1. leitura por perfil ----------
select _as('00000000-0000-0000-0000-00000000000c','sous@if.br');
select _ok('sous não lê receitas da biblioteca', not exists(select 1 from records where col='lib'));
select _ok('sous não lê custos (fin)', not exists(select 1 from records where col='fin'));
select _ok('sous não lê a biblioteca dos mestres', not exists(select 1 from library));
reset role; select _as('00000000-0000-0000-0000-00000000000b','chef@if.br');
select _ok('chef não lê custos (fin)', not exists(select 1 from records where col='fin'));
select _ok('chef lê a biblioteca da casa', exists(select 1 from records where col='lib'));
reset role; select _as('00000000-0000-0000-0000-00000000000d','estranho@x.com');
select _ok('não membro não vê nada', not exists(select 1 from records) and not exists(select 1 from members));
reset role; select _anon();
select _ok('anônimo não vê nada', not exists(select 1 from records) and not exists(select 1 from workspaces));
reset role;

-- ---------- 2. preço (markup) fora do alcance de chef e sous ----------
select _as('00000000-0000-0000-0000-00000000000b','chef@if.br');
select _ok('chef não vê o markup nas receitas', not exists(select 1 from records where col='lib' and data #> '{st,proc,markup}' is not null),
  (select string_agg(id,',') from records where col='lib' and data #> '{st,proc,markup}' is not null));
reset role; select _as('00000000-0000-0000-0000-00000000000c','sous@if.br');
select _ok('sous não vê o markup em execução e lotes', not exists(select 1 from records where col in ('exec','lots') and data #> '{proc,markup}' is not null));
reset role; select _as('00000000-0000-0000-0000-00000000000a','maestro@if.br');
select _ok('maestro continua vendo o markup (no próprio registro ou em fin)',
  exists(select 1 from records where (col='lib' and id='r1' and data #> '{st,proc,markup}' is not null) or (col='fin' and id='mk:lib:r1' and (data->>'v')::numeric=4.2)));
reset role;
-- cliente antigo (v17) do Maestro grava markup de novo: deve continuar fora do alcance do chef
select _as('00000000-0000-0000-0000-00000000000a','maestro@if.br');
insert into records(workspace_id,col,id,data,updated_at) select id,'lib','r1','{"name":"Fior","st":{"proc":{"markup":5}}}',2000 from ws
 on conflict (workspace_id,col,id) do update set data=excluded.data, updated_at=excluded.updated_at;
reset role; select _as('00000000-0000-0000-0000-00000000000b','chef@if.br');
select _ok('markup regravado por cliente antigo também não chega ao chef', not exists(select 1 from records where col='lib' and data #> '{st,proc,markup}' is not null));
reset role; select _as('00000000-0000-0000-0000-00000000000a','maestro@if.br');
select _ok('…e o maestro não perde o valor novo', exists(select 1 from records where (col='lib' and id='r1' and (data #>> '{st,proc,markup}')::numeric=5) or (col='fin' and id='mk:lib:r1' and (data->>'v')::numeric=5)));
reset role;

-- ---------- 3. escrita por perfil ----------
select _as('00000000-0000-0000-0000-00000000000c','sous@if.br');
do $$ begin insert into records(workspace_id,col,id,data,deleted,updated_at) select id,'lots','L1',  '{}',true,3000 from ws
 on conflict (workspace_id,col,id) do update set deleted=excluded.deleted; perform _ok('sous não apaga lotes',false);
exception when others then perform _ok('sous não apaga lotes',true); end $$;
do $$ begin insert into records(workspace_id,col,id,data,updated_at) select id,'fin','x','{"v":1}',3000 from ws; perform _ok('sous não grava custos',false);
exception when others then perform _ok('sous não grava custos',true); end $$;
do $$ begin insert into records(workspace_id,col,id,data,updated_at) select id,'inv','M-L1-leite-E1','{"kind":"mov","entry":"E1","ingId":"leite","g":600,"lot":"L1"}',3000 from ws;
 perform _ok('sous registra baixa de estoque (movimento)',true);
exception when others then perform _ok('sous registra baixa de estoque (movimento)',false,sqlerrm); end $$;
do $$ begin update records set data=jsonb_set(data,'{g}','1') where col='inv' and id='M-L1-leite-E1'; perform _ok('sous não altera baixa já registrada',
  (select (data->>'g')::numeric from records where col='inv' and id='M-L1-leite-E1')=600);
exception when others then perform _ok('sous não altera baixa já registrada',true); end $$;
do $$ begin update members set role='maestro' where email='sous@if.br'; perform _ok('sous não se promove',
  (select role from members where email='sous@if.br')='sous');
exception when others then perform _ok('sous não se promove',true); end $$;
do $$ begin update records set col='fin' where col='lots' and id='L1'; perform _ok('sous não move registro para outra coleção', not exists(select 1 from records where col='fin'));
exception when others then perform _ok('sous não move registro para outra coleção',true); end $$;
reset role;

-- ---------- 4. convites e e-mail confirmado ----------
select _as('00000000-0000-0000-0000-00000000000e','novo@if.br');
select _ok('convite não é reivindicado com e-mail não confirmado', not exists(select 1 from claim_invites()));
reset role;
select _ok('…e o convite continua pendente', (select user_id from members where email='novo@if.br') is null);
select _as('00000000-0000-0000-0000-00000000000a','maestro@if.br');
do $$ begin perform create_workspace('Outro'); perform _ok('não cria segundo espaço',false);
exception when others then perform _ok('não cria segundo espaço',true); end $$;
do $$ begin delete from members where email='maestro@if.br'; perform _ok('equipe nunca fica sem Maestro', exists(select 1 from members where role='maestro'));
exception when others then perform _ok('equipe nunca fica sem Maestro',true); end $$;
reset role;

-- ---------- 5. conflitos de gravação ----------
select _as('00000000-0000-0000-0000-00000000000b','chef@if.br');
-- gravação com data mais antiga que a do servidor: não pode "dar certo" sem gravar
do $$ declare st text; begin
  insert into records(workspace_id,col,id,data,updated_at) select id,'exec','e1','{"name":"velho"}',10 from ws
   on conflict (workspace_id,col,id) do update set data=excluded.data, updated_at=excluded.updated_at;
  perform _ok('gravação mais antiga que o servidor é recusada com aviso (não some calada)', false,
    'aceitou em silêncio; nome no servidor: '||(select data->>'name' from records where col='exec' and id='e1'));
exception when others then get stacked diagnostics st = returned_sqlstate; perform _ok('gravação mais antiga que o servidor é recusada com aviso (não some calada)', st='PT409', st||' '||sqlerrm); end $$;
reset role;
select _ok('versão por registro existe', exists(select 1 from information_schema.columns where table_name='records' and column_name='ver'));
\if :{?MIGRATION}
select _as('00000000-0000-0000-0000-00000000000b','chef@if.br');
-- dois aparelhos partem da mesma versão; o segundo a gravar recebe conflito mesmo com relógio adiantado
do $$ declare v bigint; st text; begin
  select ver into v from records where col='exec' and id='e1';
  insert into records(workspace_id,col,id,data,updated_at,base_ver) select id,'exec','e1','{"name":"A"}',5000,v from ws
   on conflict (workspace_id,col,id) do update set data=excluded.data, updated_at=excluded.updated_at, base_ver=excluded.base_ver;
  begin
   insert into records(workspace_id,col,id,data,updated_at,base_ver) select id,'exec','e1','{"name":"B"}',99999,v from ws
    on conflict (workspace_id,col,id) do update set data=excluded.data, updated_at=excluded.updated_at, base_ver=excluded.base_ver;
   perform _ok('edição concorrente vira conflito (não decide pelo relógio)', false, 'B sobrescreveu A');
  exception when others then get stacked diagnostics st = returned_sqlstate; perform _ok('edição concorrente vira conflito (não decide pelo relógio)', st='PT409', st); end;
  perform _ok('versão sobe a cada gravação', (select ver from records where col='exec' and id='e1')=v+1);
  insert into records(workspace_id,col,id,data,updated_at,base_ver,force) select id,'exec','e1','{"name":"B"}',6000,v,true from ws
   on conflict (workspace_id,col,id) do update set data=excluded.data, updated_at=excluded.updated_at, base_ver=excluded.base_ver, force=excluded.force;
  perform _ok('"tentar de novo" (force) substitui de propósito', (select data->>'name' from records where col='exec' and id='e1')='B');
  perform _ok('base_ver e force não ficam gravados', (select base_ver is null and not force from records where col='exec' and id='e1'));
end $$;
reset role;
\endif
-- autor e hora do servidor não podem ser forjados
select _as('00000000-0000-0000-0000-00000000000b','chef@if.br');
insert into records(workspace_id,col,id,data,updated_at,updated_by,srv_at) select id,'nx','n1','{}',7000,'00000000-0000-0000-0000-00000000000a','2000-01-01' from ws;
reset role;
select _ok('autor e hora do servidor não podem ser forjados', (select updated_by='00000000-0000-0000-0000-00000000000b' and srv_at>'2020-01-01' from records where col='nx' and id='n1'));

select case when ok then 'ok   ' else 'FALHA' end || ' | ' || nome || case when ok or det='' then '' else ' — '||det end from _t order by n;
