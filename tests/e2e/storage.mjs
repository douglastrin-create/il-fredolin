/* Armazenamento local (v18.9 · §42): IndexedDB principal + localStorage espelho.
   Migração não destrutiva, localStorage apagado, cota cheia, sem IndexedDB, IndexedDB travado, versão mais nova no
   espelho, cópias automáticas e restauração pela importação planejada. Uso: node tests/e2e/storage.mjs [chromium|webkit] */
import { chromium, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
await new Promise(ok => srv.listen(0, ok));
const url = `http://127.0.0.1:${srv.address().port}/index.html`;
const engName = process.argv[2] || 'chromium'; const eng = { chromium, webkit }[engName];
const fails = []; const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) { fails.push(msg); if (process.env.CI) console.log(`::error title=Armazenamento ${engName}::${String(msg).slice(0, 800)}`); } };
process.on('unhandledRejection', e => { if (process.env.CI) console.log(`::error title=Armazenamento ${engName} exceção::${String(e && e.stack || e).replace(/\n/g, ' | ').slice(0, 800)}`); console.error(e); process.exit(1); });
let b; try { b = await eng.launch(); } catch (e) { if (process.env.CI) { console.log(`::error title=Armazenamento ${engName}::não abriu`); process.exit(1); } console.log(`- ${engName}: não instalado, pulado`); srv.close(); process.exit(0); }
console.log('motor: ' + engName);
const ready = pg => pg.waitForFunction(() => typeof LOTS !== 'undefined' && typeof renderNow === 'function', null, { timeout: 15000 });
const lot = (id, code) => ({ id, code, date: '2026-10-18', tipo: 'crema', vit: -13, recipe: [{ id: 'leite', g: 600 }, { id: 'sacarose', g: 160 }], proc: {}, meas: {}, updatedAt: Date.now() });
const idbGet = (pg, k) => pg.evaluate(k => new Promise(res => { const r = indexedDB.open('fredolin'); r.onsuccess = () => { const g = r.result.transaction('kv').objectStore('kv').get(k); g.onsuccess = () => res(g.result ? g.result.s : null); g.onerror = () => res(null); }; r.onerror = () => res(null); }), k);
const newCtx = async init => { const c = await b.newContext(); await c.route('**/*supabase.co/**', r => r.abort()); await c.route('**/fonts.g*/**', r => r.abort()); if (init) await c.addInitScript(init); return c; };

/* 1. aparelho com dados da v18.8 (só localStorage): migração não destrutiva */
let ctx = await newCtx(); let pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto(url); await ready(pg);
await pg.evaluate(([l1]) => { localStorage.clear(); localStorage.setItem('fredolin_v10_lots', JSON.stringify([l1])); localStorage.setItem('fredolin_v9_lib', JSON.stringify([{ id: 'r1', name: 'Receita antiga', st: { tipo: 'crema', vit: -13, recipe: [{ id: 'leite', g: 600 }] }, updatedAt: 1 }])); localStorage.setItem('fredolin_app_ref', '[]'); }, [lot('L1', 'A1')]);
await pg.evaluate(() => new Promise(r => { const d = indexedDB.deleteDatabase('fredolin'); d.onsuccess = d.onerror = d.onblocked = () => r(); }));
await pg.reload(); await ready(pg);
let st = await pg.evaluate(() => ({ ok: KV.ok, mig: KV.migrated, lots: LOTS.map(l => l.code), lib: LIB.length, lsLots: !!localStorage.getItem('fredolin_v10_lots') }));
check(st.ok && st.mig >= 2 && st.lots.includes('A1') && st.lib === 1 && st.lsLots, `migração: IndexedDB ativo, ${st.mig} chaves copiadas, dados intactos e localStorage preservado`);
check((await idbGet(pg, 'fredolin_v10_lots') || '').includes('A1'), 'lotes gravados no IndexedDB');
check(await idbGet(pg, 'fredolin_app_ref') === null, 'cache que se baixa de novo (biblioteca dos mestres) não é copiado');

/* 2. gravação vai para os dois */
await pg.evaluate(([l2]) => { STORE.put('lots', l2); }, [lot('L2', 'A2')]); await pg.waitForTimeout(600);
check((await idbGet(pg, 'fredolin_v10_lots') || '').includes('A2') && await pg.evaluate(() => localStorage.getItem('fredolin_v10_lots').includes('A2')), 'nova gravação chega ao IndexedDB e ao espelho');

/* 3. localStorage apagado (limpeza do sistema, corrupção): recupera do IndexedDB e repara o espelho */
await pg.evaluate(() => localStorage.clear()); await pg.reload(); await ready(pg);
st = await pg.evaluate(() => ({ lots: LOTS.map(l => l.code).sort(), restored: KV.restored.length, mirror: (localStorage.getItem('fredolin_v10_lots') || '').includes('A2') }));
check(st.lots.join() === 'A1,A2' && st.restored >= 1 && st.mirror, `localStorage apagado: ${st.lots.length} lotes recuperados do IndexedDB e espelho reparado`);

/* 4. cota cheia no localStorage (Safari ~5 MB): a gravação não se perde e não há aviso de memória cheia */
await pg.evaluate(([l3]) => { window.__toasts = []; const t = toast; window.toast = m => { __toasts.push(m); t(m); };
  const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (String(k).startsWith('fredolin_')) throw new DOMException('cheio', 'QuotaExceededError'); return orig.call(this, k, v); };
  window.__ret = LS.set('fredolin_v10_lots', [...LOTS, l3]); LOTS.push(l3); }, [lot('L3', 'A3')]);
await pg.waitForTimeout(600);
st = await pg.evaluate(() => ({ ret: __ret, bad: Object.keys(LS.bad).length, toasts: __toasts.filter(t => /Memória do aparelho cheia/.test(t)).length }));
check(st.ret === true && st.bad >= 1 && st.toasts === 0, 'cota cheia no espelho: gravação aceita pelo IndexedDB, sem alarme falso');
await pg.reload(); await ready(pg);
check((await pg.evaluate(() => LOTS.map(l => l.code))).includes('A3'), 'depois de reabrir, o lote gravado com o espelho cheio está lá (IndexedDB mais novo vence)');

/* 5. espelho mais novo que o IndexedDB (gravação no IndexedDB falhou): o espelho vence e o IndexedDB é atualizado */
await pg.evaluate(() => { const v = JSON.parse(localStorage.getItem('fredolin_v10_lots')); v.push({ id: 'L4', code: 'A4', date: '2026-10-18', tipo: 'crema', vit: -13, recipe: [{ id: 'leite', g: 600 }], proc: {}, meas: {} });
  localStorage.setItem('fredolin_v10_lots', JSON.stringify(v)); const m = JSON.parse(localStorage.getItem('fredolin_kvat')); m.fredolin_v10_lots = Date.now() + 60000; localStorage.setItem('fredolin_kvat', JSON.stringify(m)); });
await pg.reload(); await ready(pg);
check((await pg.evaluate(() => LOTS.map(l => l.code))).includes('A4') && (await idbGet(pg, 'fredolin_v10_lots') || '').includes('A4'), 'espelho mais novo: vence e o IndexedDB é atualizado');

/* 6. cópia automática e restauração pela importação planejada */
st = await pg.evaluate(async () => { const r = await kvSnapTake({ v: VERSION, date: today() }); const L = await kvSnapList(); return { r, n: L.length, id: L[0] && L[0].id }; });
check(st.r.ok && st.n === 1 && st.r.n >= 4, `cópia automática guardada no IndexedDB (${st.r.n} itens)`);
await pg.evaluate(async () => { AUTH.state = 'ready'; ME.ws = null; ROLE = 'maestro'; S.page = 'dados'; renderNow(); await offlineDiag(); });
await pg.waitForSelector('#off-card button[data-a="snapRestore"]', { timeout: 5000 });
const card = await pg.locator('#off-card').innerText();
check(/IndexedDB\)\s*ativo/.test(card) && /Cópias automáticas/.test(card), 'cartão mostra armazenamento principal ativo e as cópias automáticas');
await pg.evaluate(() => { LOTS.splice(LOTS.findIndex(l => l.code === 'A1'), 1); });
await pg.click('#off-card button[data-a="snapRestore"]'); await pg.waitForTimeout(400);
st = await pg.evaluate(() => U.imp && { name: U.imp.name, novos: U.imp.plan && JSON.stringify(U.imp.plan).includes('A1') });
check(!!st && /cópia automática/.test(st.name) && st.novos, '"Ver e restaurar" abre a importação planejada com o lote que sumiu');
check(!errs.length, 'sem erros de página ' + errs.join(' | '));
await ctx.close();

/* 7. navegador sem IndexedDB: o app abre como antes, só com o localStorage */
ctx = await newCtx(() => { try { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); } catch (e) { } });
pg = await ctx.newPage(); await pg.goto(url); await ready(pg);
await pg.evaluate(([l]) => { localStorage.setItem('fredolin_v10_lots', JSON.stringify([l])); }, [lot('N1', 'SEM-IDB')]); await pg.reload(); await ready(pg);
st = await pg.evaluate(() => ({ ok: KV.ok, reason: KV.reason, lots: LOTS.map(l => l.code), ret: LS.set('fredolin_v11_vits', []) }));
check(!st.ok && /indisponível/.test(st.reason) && st.lots.includes('SEM-IDB') && st.ret === true, 'sem IndexedDB: abre só com o localStorage e grava normalmente');
await ctx.close();

/* 8. IndexedDB travado (nunca responde): o app abre em até ~2,5 s com o localStorage */
ctx = await newCtx(() => { try { const o = indexedDB.open.bind(indexedDB); indexedDB.open = (...a) => (/fredolin/.test(a[0]) ? {} : o(...a)); } catch (e) { } });
pg = await ctx.newPage(); const t0 = Date.now(); await pg.goto(url); await ready(pg); const dt = Date.now() - t0;
st = await pg.evaluate(() => ({ ok: KV.ok, reason: KV.reason }));
check(!st.ok && /2,5 s/.test(st.reason) && dt < 9000, `IndexedDB travado: app abre com o localStorage (${dt} ms; motivo registrado)`);
await ctx.close();

await b.close(); srv.close();
console.log(fails.length ? `${fails.length} falha(s)` : 'Armazenamento: tudo certo');
if (process.env.CI) console.log(`::notice title=Armazenamento ${engName} resumo::${fails.length ? fails.length + ' falha(s)' : 'tudo certo'}`);
process.exit(fails.length ? 1 : 0);
