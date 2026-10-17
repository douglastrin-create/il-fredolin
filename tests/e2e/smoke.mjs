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
  let b; try { b = await eng.launch(); } catch { console.log(`- ${name}: não instalado, pulado`); continue; }
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  pg.on('pageerror', e => errs.push(String(e)));
  await pg.route('**/*supabase.co/**', r => r.abort()); await pg.route('**/fonts.g*/**', r => r.abort());
  await pg.goto(url); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => {
    const st = S, m = analyze(st), F = diagnose(st, m), sc = score(st, m, F), bad = []; let q = '';
    for (const k of Object.keys(VIEW)) { try { const h = VIEW[k](m, F, sc); if (badText(h.replace(/<input[^>]*value=""[^>]*>/g, ''))) bad.push(k); if (k === 'quimica') q = h; } catch (e) { bad.push(k + ': ' + e.message); } }
    SUPA_BACKEND.quarantine({ col: 'lib', id: 'x', data: {}, updated_at: 1 }, { status: 403 }); LS.bad = { k: 'QuotaExceededError' };
    const acc = accountCard(SUPA_BACKEND.pending()); const t = runTests();
    return { pages: Object.keys(VIEW).length, bad, tests: [t.pass, t.list.length], textura: q.includes('Estabilidade da textura') && !/Vida útil prevista/.test(q),
      quarentena: acc.includes('Alterações recusadas'), aviso: acc.includes('Gravação neste aparelho falhou') };
  });
  const ok = !errs.length && !r.bad.length && r.tests[0] === r.tests[1] && r.textura && r.quarentena && r.aviso;
  console.log(`${ok ? '✓' : '✗'} ${name}: ${r.pages} páginas, testes ${r.tests.join('/')}, erros ${errs.length}`, ok ? '' : JSON.stringify({ r, errs }));
  if (!ok) failed++; await b.close();
}
srv.close(); process.exit(failed ? 1 : 0);
