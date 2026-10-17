/* Teste de fumaça no navegador (Chromium; WebKit quando disponível): o app abre, todas as páginas desenham,
   a bateria interna passa e as telas da auditoria v18 (quarentena, aviso de gravação, estabilidade da textura) aparecem.
   Uso: node tests/e2e/smoke.mjs  (requer `npx playwright install chromium`) */
import { chromium, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } }); });
await new Promise(ok => srv.listen(0, ok));
const url = `http://localhost:${srv.address().port}/index.html`;
let failed = 0;
const engines = [['chromium', chromium], ['webkit', webkit]];
for (const [name, eng] of engines) {
  let b; try { b = await eng.launch(); } catch { if (process.env.CI) { console.log(`✗ ${name}: não abriu no CI`); failed++; } else console.log(`- ${name}: não instalado, pulado`); continue; }
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.route('**/*supabase.co/**', r => r.abort()); await pg.route('**/fonts.g*/**', r => r.abort());
  await pg.goto(url); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => {
    const st = S, m = analyze(st), F = diagnose(st, m), sc = score(st, m, F), bad = []; let q = '';
    for (const k of Object.keys(VIEW)) { try { const h = VIEW[k](m, F, sc); if (badText(h.replace(/<input[^>]*value=""[^>]*>/g, ''))) bad.push(k); if (k === 'quimica') q = h; } catch (e) { bad.push(k + ': ' + e.message); } }
    SUPA_BACKEND.quarantine({ col: 'lib', id: 'x', data: {}, updated_at: 1 }, { status: 403 }); LS.bad = { k: 'QuotaExceededError' };
    const acc = accountCard(SUPA_BACKEND.pending()); const t = runTests();
    const cols = {}; BACKUP_COLS.forEach(c => cols[c] = [...COLS[c].get()]);
    cols.lib = [{ id: 'r1', name: 'Fior', updatedAt: 500, st: { recipe: [{ id: 'leite', g: 600 }] } }];
    const file = JSON.parse(JSON.stringify(backupPayload(cols, {}, { v: VERSION, date: 'hoje' })));
    file.lib.push({ id: 'r2', name: 'Nova', updatedAt: 10, st: { recipe: [{ id: 'leite', g: 1 }, { id: 'nao_existe', g: 5 }] } });
    file.lib[0].updatedAt = 100;
    const plan = planImport(file, cols, {}); U.imp = { name: 'b.json', plan, withDel: false }; const card = importCard(); U.imp = null;
    const backup = plan.cols.lib.keep === 1 && plan.cols.lib.add.length === 1 && card.includes('1 novos') && card.includes('mantidos');
    return { pages: Object.keys(VIEW).length, bad, tests: [t.pass, t.list.length], textura: q.includes('Estabilidade da textura') && !/Vida útil prevista/.test(q) && (q.match(/chip nat/g) || []).length >= 4,
      quarentena: acc.includes('Alterações recusadas'), aviso: acc.includes('Gravação neste aparelho falhou'), backup };
  });
  const ok = !errs.length && !r.bad.length && r.tests[0] === r.tests[1] && r.textura && r.quarentena && r.aviso && r.backup;
  console.log(`${ok ? '✓' : '✗'} ${name}: ${r.pages} páginas, testes ${r.tests.join('/')}, erros ${errs.length}`, ok ? '' : JSON.stringify({ r, errs }));
  if (!ok) failed++; await b.close();
  if (name !== 'chromium') continue;
  /* PWA: instala, corta a rede, recarrega e reabre numa aba nova (como fechar e abrir o app) */
  const b2 = await eng.launch(); const ctx = await b2.newContext(); const p1 = await ctx.newPage();
  await p1.goto(url.replace('localhost', '127.0.0.1').replace('/index.html', '/'));
  const swOk = await p1.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  await p1.reload(); await p1.waitForTimeout(800);                      /* agora controlada pelo service worker */
  await ctx.setOffline(true);
  let off = {};
  try { await p1.reload(); await p1.waitForTimeout(1200); off.reload = await p1.evaluate(() => typeof runTests === 'function' && runTests().list.every(x => x.ok)); } catch (e) { off.reload = 'erro: ' + e.message; }
  await p1.close(); const p2 = await ctx.newPage();
  try { await p2.goto(url.replace('localhost', '127.0.0.1').replace('/index.html', '/')); await p2.waitForTimeout(1200); off.reopen = await p2.evaluate(() => !!document.querySelector('#toast') && typeof analyze === 'function' && analyze(S).serveT < 0); } catch (e) { off.reopen = 'erro: ' + e.message; }
  const okOff = swOk && off.reload === true && off.reopen === true;
  console.log(`${okOff ? '✓' : '✗'} ${name} offline: service worker ${swOk ? 'ativo' : 'ausente'}, recarregar ${off.reload}, reabrir ${off.reopen}`);
  if (!okOff) failed++; await b2.close();
}
srv.close(); process.exit(failed ? 1 : 0);
