/* Fluxo real pela interface (Chromium): Laudo → O que medir; Lotes → Experimentos: escolher fatores, gerar plano,
   criar lotes, registrar medições e ver a análise. Uso: node tests/e2e/experiments.mjs */
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); r.end(d); } }); });
await new Promise(ok => srv.listen(0, ok));
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
await pg.route('**/*supabase.co/**', r => r.abort()); await pg.route('**/fonts.g*/**', r => r.abort());
await pg.goto(`http://localhost:${srv.address().port}/index.html`); await pg.waitForTimeout(1200);
const fails = []; const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) fails.push(msg); };
// entra como Maestro (sem servidor) e carrega a base de morango na bancada
await pg.evaluate(() => { AUTH.state = 'ready'; ME.ws = null; S = fromPreset(PRESETS.find(p => /fragola/i.test(p.name))); S.page = 'laudo'; U.sub = { laudo: 'medir' }; renderNow(); });
const medir = await pg.locator('#main').innerText();
check(/O que medir/.test(medir) && /Brix de cada fruta/.test(medir), 'Laudo → O que medir lista o Brix da fruta');
check(medir.indexOf('Brix de cada fruta') < medir.indexOf('Overrun pelo copo'), 'no morango, o Brix vem antes do overrun');
// Experimentos: escolher 2 fatores pela interface
await pg.evaluate(() => { S.page = 'lotes'; U.sub = { lotes: 'doe' }; renderNow(); });
await pg.selectOption('select[data-c="doeSel"][data-k="0"]', 'dextrosem').catch(async () => {
  const opts = await pg.$$eval('select[data-c="doeSel"][data-k="0"] option', o => o.map(x => x.value)); await pg.selectOption('select[data-c="doeSel"][data-k="0"]', opts.find(v => /dextro/.test(v)) || opts[1]); });
await pg.waitForTimeout(150);
await pg.selectOption('select[data-c="doeSel"][data-k="1"]', 'drawT'); await pg.waitForTimeout(150);
await pg.selectOption('select[data-c="doeOpt"][data-k="centers"]', '2'); await pg.waitForTimeout(150);
await pg.fill('input[data-i="doeName"]', 'teste e2e');
await pg.click('button[data-a="doeGen"]'); await pg.waitForTimeout(400);
const plano = await pg.locator('#main').innerText();
const nRows = await pg.locator('#main table.tbl tbody tr').count();
check(/Plano: teste e2e/.test(plano) && nRows === 6, `plano gerado com 4 + 2 centrais = 6 corridas (${nRows})`);
check(!/inviável/.test(plano), 'nenhuma corrida inviável');
await pg.click('button[data-a="doeLots"]'); await pg.waitForTimeout(400);
const lotes = await pg.evaluate(() => LOTS.filter(L => L.doe).map(L => ({ id: L.id, order: L.doe.order, coded: L.doe.coded, center: L.doe.center, tot: L.recipe.reduce((a, r) => a + r.g, 0), drawT: L.proc.drawT })));
check(lotes.length === 6 && new Set(lotes.map(l => l.id)).size === 6, '6 lotes criados com ids distintos');
const tot0 = lotes[0].tot; check(lotes.every(l => Math.abs(l.tot - tot0) < 0.2), 'todos os lotes com o mesmo peso total (compensação)');
// registra overrun medido com efeito conhecido: +6 pontos para saída mais fria (drawT baixo), nada da dextrose
await pg.evaluate(() => { LOTS.filter(L => L.doe).forEach((L, i) => { const ci = L.doe.factors.findIndex(f => f.key === 'drawT'); L.meas.ov = 30 - 3 * L.doe.coded[ci] + [0.3, -0.2, 0.1, -0.3, 0.2, -0.1][i]; STORE.put('lots', L); }); renderNow(); });
const analise = await pg.locator('#main').innerText();
check(/6 de 6 lotes medidos/.test(analise), 'análise vê os 6 lotes medidos');
const eff = await pg.evaluate(() => { const G = doeGroups()[0]; const d = G[0].doe; const R = doeAnalyze({ factors: d.factors, runs: G.map(L => ({ coded: L.doe.coded, center: L.doe.center })) }, G.map(L => L.meas.ov)); return R.effects.map(e => [e.n, Math.round(e.effect * 10) / 10, e.p]); });
const sai = eff.find(e => /saída/i.test(e[0])), dex = eff.find(e => /extros/i.test(e[0]));
check(sai && Math.abs(sai[1] + 6) < 0.6 && sai[2] < 0.05, `efeito da saída ≈ −6 e significativo (${JSON.stringify(sai)})`);
check(dex && Math.abs(dex[1]) < 0.6 && dex[2] > 0.05, `dextrose sem efeito (${JSON.stringify(dex)})`);
check(/efeito provável/.test(analise) && /não se distingue do ruído/.test(analise), 'leituras em linguagem simples aparecem');
// pH no lote
await pg.evaluate(() => { S.page = 'lotes'; U.sub = { lotes: 'lotes' }; U.lotOpen = LOTS[0].id; renderNow(); });
check(await pg.locator('input[data-k="meas.ph"]').count() === 1, 'campo pH medido no lote');
// Sous Chef não vê Experimentos
await pg.evaluate(() => { ROLE = 'sous'; S.page = 'lotes'; U.sub = { lotes: 'doe' }; renderNow(); });
check(!/Novo experimento/.test(await pg.locator('#main').innerText()), 'Sous Chef não vê a aba Experimentos');
check(!errs.length, 'sem erros de página ' + errs.join(' | '));
await b.close(); srv.close(); process.exit(fails.length ? 1 : 0);
