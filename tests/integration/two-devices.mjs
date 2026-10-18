/* Il Fredolin · integração real: o código de sincronização do app (62-supabase), em dois "aparelhos",
   contra PostgREST + Postgres com o esquema do Supabase. Requer tests/integration/setup-db.sh e PostgREST
   rodando (ver tests/integration/run.sh). Variáveis: PGRST_URL, JWT_SECRET. */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { readApp, segment, baseContext, memStorage } from '../node/harness.mjs';

const URL_ = process.env.PGRST_URL || 'http://localhost:3555';
const SECRET = process.env.JWT_SECRET || 'il-fredolin-teste-local-segredo-de-32-bytes-ou-mais';
const WS = '11111111-1111-1111-1111-111111111111';
const USERS = { maestro: ['00000000-0000-0000-0000-00000000000a', 'maestro@if.br'], chef: ['00000000-0000-0000-0000-00000000000b', 'chef@if.br'], sous: ['00000000-0000-0000-0000-00000000000c', 'sous@if.br'] };
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt(role) { const [sub, email] = USERS[role]; const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ sub, email, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`; }

/** um aparelho: localStorage próprio, coleções em memória, código real de 62-supabase */
function device(role, html = readApp()) {
  const toasts = [];
  const ctx = baseContext({ localStorage: memStorage(), navigator: { onLine: true }, document: { hidden: false, addEventListener() {} }, addEventListener() {},
    location: { origin: 'https://x', pathname: '/' }, atob: s => Buffer.from(s, 'base64').toString('binary'), escape, unescape,
    fetch: (u, o) => fetch(String(u).replace('/rest/v1', ''), o), FREDOLIN_CONFIG: { url: URL_, key: 'anon' } });
  const lsDecl = html.match(/const LS=\{[\s\S]*?\n?   return false;\}\}\};|const LS=\{get\(k\)[^\n]*\};/)[0];
  vm.runInContext(`${lsDecl}
    const plain=r=>JSON.parse(JSON.stringify(r));let ROLE=${JSON.stringify(role)};let ME={uid:'${USERS[role][0]}',ws:'${WS}',email:'${USERS[role][1]}'};
    const DB={lib:[],exec:[],lots:[],ings:[],nx:[],inv:[],vit:[]};const COLS={};for(const c in DB)COLS[c]={get:()=>DB[c],set:v=>{DB[c]=v;}};
    const STORE={setStatus(){},saveLocal(){},after(){},put(c,r){r.updatedAt=Date.now();const a=DB[c],k=a.findIndex(x=>String(x.id)===String(r.id));if(k>=0)a[k]=r;else a.unshift(r);SUPA_BACKEND.push(c,r);}};
    const MASTERS=[];function masterDexFix(){}function render(){}function safeRec(r){return r;}
    function libConflict(){return false;}function conflictCopy(r){return Object.assign({},r,{id:r.id+'c'});}
    function toast(t){__toasts.push(t);}const AUTH={lost(){}};
    ${segment(html, '62-supabase.js', '66-team.js')}
    SB.sess={access_token:${JSON.stringify(jwt(role))},refresh_token:'x',expires_at:Math.floor(Date.now()/1000)+3600};
    SUPA_BACKEND.kick=()=>{};
    globalThis.__D={B:SUPA_BACKEND,DB,STORE,FIN:()=>FIN,ROLE};`, Object.assign(ctx, { __toasts: toasts }), { filename: `index.html#${role}` });
  return { ...ctx.__D, toasts, sync: () => ctx.__D.B._sync() };
}
const sql = q => execSync(`psql -X -q -t -A -d fred_e2e -c ${JSON.stringify(q)}`, { encoding: 'utf8' }).trim();
const reset = () => sql(`delete from records`);
const mode = process.env.DB_MODE || 'migrated';

test('detecta o modo do servidor (coluna ver) e sincroniza', async () => {
  reset(); const A = device('chef');
  A.STORE.put('exec', { id: 'e1', name: 'Fior' }); await A.sync();
  assert.equal(A.B.verMode, mode === 'migrated');
  assert.equal(sql(`select data->>'name' from records where col='exec' and id='e1'`), 'Fior');
  assert.equal(A.B.outbox.length, 0);
});

test('edição concorrente: o segundo aparelho recebe conflito visível, não perde em silêncio', { skip: mode !== 'migrated' }, async () => {
  reset(); const A = device('chef'), B = device('chef');
  A.STORE.put('exec', { id: 'e1', name: 'base' }); await A.sync(); await B.sync();   // ambos conhecem a versão 1
  A.STORE.put('exec', { id: 'e1', name: 'A' }); await A.sync();
  B.STORE.put('exec', { id: 'e1', name: 'B' }); B.B.outbox.forEach(r => { r.updated_at += 10 * 60e3; });   // relógio de B adiantado 10 min
  await B.sync();
  assert.equal(sql(`select data->>'name' from records where col='exec' and id='e1'`), 'A', 'relógio adiantado não decide');
  assert.equal(B.B.rejected.length, 1); assert.equal(B.B.rejected[0].status, 409);
  assert.equal(B.DB.exec[0].name, 'A', 'B recebe a versão do servidor; a sua fica na quarentena');
  B.B.retryRejected(); await B.sync();
  assert.equal(sql(`select data->>'name' from records where col='exec' and id='e1'`), 'B', '"tentar de novo" substitui de propósito');
  assert.equal(B.B.rejected.length, 0);
});

test('duas edições seguidas no mesmo aparelho antes de enviar não geram conflito falso', { skip: mode !== 'migrated' }, async () => {
  reset(); const A = device('chef');
  A.STORE.put('exec', { id: 'e2', name: '1' }); await A.sync();
  A.STORE.put('exec', { id: 'e2', name: '2' }); A.STORE.put('exec', { id: 'e2', name: '3' }); await A.sync();
  A.STORE.put('exec', { id: 'e2', name: '4' }); await A.sync();
  assert.equal(A.B.rejected.length, 0); assert.equal(sql(`select data->>'name' from records where col='exec' and id='e2'`), '4');
});

test('markup: Maestro mantém, Chef e Sous não recebem', { skip: mode !== 'migrated' }, async () => {
  reset(); const M = device('maestro'), C = device('chef'), S = device('sous');
  M.STORE.put('lib', { id: 'r1', name: 'Fior', st: { proc: { markup: 4.2, pastT: 85 } } });
  M.STORE.put('exec', { id: 'e1', name: 'Fior', proc: { markup: 4.2 } }); await M.sync();
  assert.equal(sql(`select count(*) from records where col<>'fin' and (data #> '{st,proc,markup}' is not null or data #> '{proc,markup}' is not null)`), '0');
  await C.sync(); await S.sync();
  assert.equal(C.DB.lib[0].st.proc.markup, undefined); assert.equal(S.DB.exec[0].proc.markup, undefined);
  const M2 = device('maestro'); await M2.sync();   // outro aparelho do Maestro
  assert.equal(M2.DB.lib.find(r => r.id === 'r1').st.proc.markup, 4.2);
  assert.equal(M2.DB.exec.find(r => r.id === 'e1').proc.markup, 4.2);
});

test('estoque: baixas de dois aparelhos se somam; repetir não desconta de novo', { skip: mode !== 'migrated' }, async () => {
  reset(); const M = device('maestro'), S1 = device('sous'), S2 = device('chef');
  M.STORE.put('inv', { id: 'E1', ingId: 'leite', qty: 5000 }); await M.sync(); await S1.sync(); await S2.sync();
  S1.STORE.put('inv', { id: 'M-L1-leite-E1', kind: 'mov', entry: 'E1', ingId: 'leite', g: 600, lot: 'L1' });
  S2.STORE.put('inv', { id: 'M-L2-leite-E1', kind: 'mov', entry: 'E1', ingId: 'leite', g: 400, lot: 'L2' });
  await S1.sync(); await S2.sync();
  assert.equal(sql(`select sum((data->>'g')::numeric) from records where col='inv' and data->>'kind'='mov'`), '1000');
  assert.equal(sql(`select data->>'qty' from records where col='inv' and id='E1'`), '5000', 'a entrada não é regravada');
  S1.STORE.put('inv', { id: 'M-L1-leite-E1', kind: 'mov', entry: 'E1', ingId: 'leite', g: 999, lot: 'L1' }); await S1.sync();
  assert.equal(sql(`select data->>'g' from records where id='M-L1-leite-E1'`), '600', 'sous não altera baixa registrada');
  assert.equal(S1.B.rejected.length, 1, 'a tentativa fica visível na quarentena');
});

test('app antigo (v17.12.1) continua sincronizando com o banco migrado', { skip: mode !== 'migrated' }, async () => {
  let old; try { old = execSync('git show 52f99f0:index.html', { encoding: 'utf8', maxBuffer: 8e6, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return; }
  reset(); const O = device('chef', old), N = device('chef');
  O.STORE.put('exec', { id: 'v', name: 'do antigo' }); await O.sync();
  assert.equal(sql(`select data->>'name' from records where id='v'`), 'do antigo');
  await N.sync(); N.STORE.put('exec', { id: 'v', name: 'do novo' }); await N.sync();
  await O.sync(); assert.equal(O.DB.exec.find(r => r.id === 'v').name, 'do novo', 'o antigo recebe a edição do novo');
  O.STORE.put('exec', { id: 'v', name: 'antigo de novo' }); await O.sync();
  assert.equal(sql(`select data->>'name' from records where id='v'`), 'antigo de novo');
});
