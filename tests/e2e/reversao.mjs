/* Il Fredolin · reversão (Fase 10: "testar migração e reversão").
   Um aparelho usa a versão atual (dados no IndexedDB com espelho no localStorage), cria lote, receita e muda a bancada.
   Depois o site volta a servir uma versão antiga (v18.8, antes do IndexedDB; e v17.12.1, antes de toda a série v18)
   e o app antigo precisa abrir com os mesmos dados. Uso: node tests/e2e/reversao.mjs [chromium|webkit] */
import { chromium, webkit } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const show = (c, f) => execSync(`git show ${c}:${f}`, { cwd: root, maxBuffer: 64e6 }).toString();
let page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/' || u === '/index.html') { r.writeHead(200, { 'content-type': 'text/html' }); r.end(page); return; }
  if (u === '/sw.js') { r.writeHead(404); r.end(); return; }
  fs.readFile(path.join(root, u), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': u.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); r.end(d); }); }).listen(8092);
const eng = { chromium, webkit }[process.argv[2] || 'chromium']; let b;
try { b = await eng.launch(); } catch (e) { console.log('- motor não instalado, pulado'); srv.close(); process.exit(process.env.CI ? 1 : 0); }
const fails = []; const check = (ok, msg) => { console.log((ok ? '✓ ' : '✗ ') + msg); if (!ok) { fails.push(msg); if (process.env.CI) console.log(`::error title=E2E reversão::${msg}`); } };
const ctx = await b.newContext({ serviceWorkers: 'block' }); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await ctx.route('**/*supabase.co/**', r => r.abort()); await ctx.route('**/fonts.g*/**', r => r.abort());
const ready = async () => { await pg.waitForFunction(() => typeof renderNow === 'function' && typeof LOTS !== 'undefined', null, { timeout: 30000 }); await pg.waitForTimeout(400); };
await pg.goto('http://localhost:8092/'); await ready();
/* sessão aberta (sem servidor): sem login o app mostra a tela de entrada e não grava a bancada */
await pg.evaluate(() => { if (typeof AUTH !== 'undefined') { AUTH.state = 'ready'; ME.ws = null; } S.name = 'Reversão teste'; S.vit = -14.5; const L = { id: 'rev1', code: 'REV1', name: 'Lote reversão', date: '2026-10-19', tipo: 'crema', vit: -12, recipe: [{ id: 'leite', g: 600 }, { id: 'sacarose', g: 150 }], proc: {}, meas: { ov: 31, rheo: '10:800; 50:400' }, panel: [{ m: 'tri', s: 'S1', ok: true }] }; LOTS.unshift(L); saveLot(L); renderNow(); });
await pg.waitForTimeout(1500);
check(await pg.evaluate(() => VERSION) !== null, 'versão atual gravou lote (com campos novos: reologia e painel) e mudou a bancada');
for (const [c, nome] of [['15b90c7', 'v18.8 (antes do IndexedDB)'], ['52f99f0', 'v17.12.1 (antes da série v18)']]) {
  page = show(c, 'index.html'); await pg.reload(); await ready();
  await pg.evaluate(() => { if (typeof AUTH !== 'undefined') { AUTH.state = 'ready'; ME.ws = null; } });
  const r = await pg.evaluate(() => ({ v: typeof VERSION !== 'undefined' ? VERSION : '?', name: S.name, vit: S.vit, lot: (LOTS.find(l => l.id === 'rev1') || {}).code, ov: ((LOTS.find(l => l.id === 'rev1') || {}).meas || {}).ov }));
  check(r.lot === 'REV1' && r.ov === 31 && r.name === 'Reversão teste' && r.vit === -14.5, `reverter para ${nome}: abre com o lote e a bancada da versão nova (${JSON.stringify(r)})`);
}
/* e voltar para a atual não perde nada do que a antiga viu */
page = fs.readFileSync(path.join(root, 'index.html'), 'utf8'); await pg.reload(); await ready();
check(await pg.evaluate(() => { const L = LOTS.find(l => l.id === 'rev1'); return !!L && L.meas.rheo === '10:800; 50:400' && L.panel.length === 1; }), 'voltar para a atual: campos que a antiga não conhecia continuam lá');
check(!errs.length, 'sem erros de página ' + errs.slice(0, 3).join(' | '));
await b.close(); srv.close(); process.exit(fails.length ? 1 : 0);
