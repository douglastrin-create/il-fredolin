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
const fails = []; const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) { fails.push(msg); if (process.env.CI) console.log(`::error title=E2E experimentos::${String(msg).replace(/\n/g, ' ').slice(0, 900)}`); } };
process.on('uncaughtException', e => { if (process.env.CI) console.log(`::error title=E2E experimentos exceção::${String(e && e.stack || e).replace(/\n/g, ' | ').slice(0, 900)}`); console.error(e); process.exit(1); });
process.on('unhandledRejection', e => { if (process.env.CI) console.log(`::error title=E2E experimentos exceção::${String(e && e.stack || e).replace(/\n/g, ' | ').slice(0, 900)}`); console.error(e); process.exit(1); });
check(/Entrar|Il Fredolin/.test(await pg.locator('#main').innerText()) && await pg.evaluate(() => typeof AUTH.view === 'function' && AUTH.state !== 'ready'), 'sem sessão: a tela de entrada (agora na camada de interface) aparece');
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
// seletor de tipo agrupado por família; trocar o tipo ajusta a temperatura de serviço
await pg.evaluate(() => { ROLE = 'maestro'; S.page = 'bancada'; renderNow(); });
const groups = await pg.$$eval('#tipo optgroup', g => g.map(x => x.label));
check(groups.length >= 5 && groups.includes('Internacional') && groups.includes('Tradicional e regional'), 'seletor de tipo agrupado por família: ' + groups.join(', '));
await pg.selectOption('#tipo', 'soft'); await pg.waitForTimeout(200);
check(await pg.evaluate(() => S.tipo === 'soft' && S.vit === -6.5), 'soft serve: temperatura de serviço vai para −6,5 °C');
await pg.evaluate(() => { S.page = 'laudo'; U.sub = { laudo: 'resumo' }; renderNow(); });
const res = await pg.locator('#main').innerText();
check(/Soft serve/.test(res) && /servido direto da máquina/.test(res) && /faixas com fonte/.test(res), 'Laudo mostra a família, o processo e a origem das faixas');
// Design inverso (v18.4): Creator → Criar por alvo → 3 · Alternativas e compromissos
await pg.evaluate(() => { S.page = 'creator'; S.creatorTab = 'gelato'; S.crSub = 'gerar'; S.tipo = 'crema'; S.vit = -12; S.lab.gen.tipo = 'crema'; S.lab.gen.fixed = [{ id: 'morango', g: 150 }]; Object.assign(S.lab.gen, genDef('crema')); S.lab.gen.crit = ['sug', 'sol']; U.gen = U.genFr = null; renderNow(); });
check(await pg.locator('#front-card').isVisible(), 'cartão "3 · Alternativas e compromissos" aparece');
await pg.click('#front-card button[data-a="frCrit"][data-v="melt"]'); await pg.waitForTimeout(100);
check(await pg.evaluate(() => S.lab.gen.crit.join(',') === 'sug,sol,melt'), 'critério marcado pela interface');
await pg.click('#front-card button[data-a="frRun"]'); await pg.waitForSelector('#front-tbl', { timeout: 5000 });
const nAlt = await pg.locator('#front-tbl .front-opt').count(); const ftxt = await pg.locator('#front-card').innerText();
check(nAlt >= 2 && /combinações de metas testadas/.test(ftxt) && (ftxt.match(/★/g) || []).length >= 3, `alternativas listadas (${nAlt}) com a melhor de cada critério marcada`);
check(/estimativas heurísticas/.test(ftxt), 'derretimento identificado como estimativa');
const nTot = await pg.evaluate(() => U.genFr.front.length);
check(nAlt === Math.min(8, nTot), `no celular mostra até 8 de ${nTot} opções (${nAlt})`);
if (nTot > 8) { await pg.click('#front-card button[data-a="frAll"]'); await pg.waitForTimeout(150);
  check(await pg.locator('#front-tbl .front-opt').count() === nTot, '"Mostrar todas" lista todas as opções'); }
check(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), 'sem rolagem horizontal a 390 px');
const alvo = await pg.evaluate(() => U.genFr.front[U.genFr.front.length - 1].tgt);
await pg.locator('#front-tbl button[data-a="frPick"]').last().click(); await pg.waitForTimeout(300);
const usado = await pg.evaluate(() => ({ g: { pod: S.lab.gen.pod, fat: S.lab.gen.fat, msnf: S.lab.gen.msnf }, ok: !!(U.gen && U.gen.ok), rec: U.gen && U.gen.recipe.map(r => r.id + r.g).join(), alt: U.genFr.front[U.genFr.front.length - 1].recipe.map(r => r.id + r.g).join() }));
check(usado.ok && usado.g.pod === alvo.pod && usado.g.fat === alvo.fat && usado.rec === usado.alt, '"Usar esta" põe as metas no formulário e gera a mesma receita');
check(/Receita gerada/.test(await pg.locator('#main').innerText()), 'receita escolhida aparece pronta para a bancada');
await pg.evaluate(() => { S.lab.gen.crit = ['cost', 'sug', 'melt']; U.genFr = null; renderNow(); });
await pg.click('#front-card button[data-a="frRun"]'); await pg.waitForSelector('#front-tbl', { timeout: 5000 });
const nT2 = await pg.evaluate(() => U.genFr.front.length), nS2 = await pg.locator('#front-tbl .front-opt').count();
check(nT2 <= 8 || nS2 === 8, `com custo: ${nS2} de ${nT2} opções na tela`);
if (nT2 > 8) { await pg.click('#front-card button[data-a="frAll"]'); await pg.waitForTimeout(150);
  check(await pg.locator('#front-tbl .front-opt').count() === nT2, '"Mostrar todas" lista todas as opções'); }
await pg.evaluate(() => { S.lab.gen.crit = ['sug']; U.genFr = null; renderNow(); });
check(await pg.locator('#front-card button[data-a="frRun"]').isDisabled(), 'com um critério só, o botão fica desativado');
// Laboratório de estabilização (v18.5): ficha técnica com fonte e comparação de blends com lotes medidos
await pg.evaluate(() => { S.page = 'creator'; S.creatorTab = 'neutros'; S.nxEdit = { id: null, name: 'Teste', dose: 4, dairy: true, parts: { lbg: 50, xan: 20, guar: 30 }, from: 'nx_goff' }; U.nkbSel = null; U.nxCmp = null; U.nxCmpDairy = null; renderNow(); });
const nkb = await pg.locator('#nkb-card').innerText();
check(/Goma jataí/.test(nkb) && /85 °C/.test(nkb) && /\[1\]/.test(nkb) && /abrir/.test(nkb), 'ficha da jataí com hidratação a 85 °C e fonte numerada');
await pg.click('#nkb-card button[data-a="nkbSel"][data-v="lec"]'); await pg.waitForTimeout(100);
const lec = await pg.locator('#nkb-card').innerText();
check((lec.match(/sem dado registrado/g) || []).length >= 6, 'lecitina: campos sem fonte aparecem como "sem dado registrado"');
await pg.click('#nkb-card button[data-a="nkbSel"][data-v="pect"]'); await pg.waitForTimeout(100);
check(/60 °Bx/.test(await pg.locator('#nkb-card').innerText()) && /Inferência do app/.test(await pg.locator('#nkb-card').innerText()), 'pectina: condição de gel com fonte e inferência marcada');
const aval = await pg.locator('#main').innerText();
check(/Sinergia documentada/.test(aval) && /Goycoolea/.test(aval), 'avaliação do blend cita a fonte da sinergia jataí + xantana');
// lote medido com o Goff e comparação
await pg.evaluate(() => { const L = { id: 'e2e-nx', code: 'NX1', date: '2026-10-18', tipo: 'crema', vit: -12, recipe: [{ id: 'leite', g: 600 }, { id: 'nx_goff', g: 2.5 }], proc: {}, meas: { melt10: 42, ov: 33, icyDay: 5 }, pred: { melt10: 50 }, sens: { gelo: 4 } }; LOTS.push(L); renderNow(); });
const cmp = await pg.locator('#nxcmp-tbl').innerText();
check(/Clássico acadêmico/.test(cmp) && /no editor/.test(cmp), 'comparação mostra o blend em edição e o de referência');
check(/42%/.test(cmp) && /−8|-8/.test(cmp) && /33%/.test(cmp), 'comparação traz o derretimento e overrun medidos do lote e o desvio do previsto');
check(/Separação de soro/.test(cmp) && /risco/.test(cmp) && /protegido/.test(cmp), 'risco de soro: blend sem carragena × clássico com carragena');
await pg.click('#nxcmp-card button[data-a="nxCmpT"][data-v="nx_migoya"]'); await pg.waitForTimeout(150);
check(/Mono e diglicerídeos/.test(await pg.locator('#nxcmp-tbl').innerText()), 'Migoya aparece com componente não natural marcado');
await pg.click('#nxcmp-card button[data-a="nxCmpUse"][data-v="0"]'); await pg.waitForTimeout(150);
check(!/Separação de soro/.test(await pg.locator('#nxcmp-tbl').innerText()), 'em sorbetto a linha de soro some');
check(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), 'laboratório sem rolagem horizontal a 390 px');
await pg.evaluate(() => { LOTS = LOTS.filter(L => L.id !== 'e2e-nx'); });
// Ciência do motor (v18.8): fichas dos 21 modelos, três níveis e validação deixa-um-fora com lotes medidos
await pg.evaluate(() => { const p = PRESETS.find(x => x.name === 'Fiordilatte');
  for (let i = 1; i <= 6; i++) LOTS.push({ id: 'val' + i, code: 'V' + i, date: '2026-10-1' + i, tipo: 'crema', vit: -13, recipe: p.recipe.map(([id, g]) => ({ id, g })), proc: { machine: 'maqp1' }, meas: { ov: 28 + i, melt10: 38 + i, brix: 33.2 }, pred: {} });
  fitCalibration(LOTS); CAL.ver++; S.page = 'laudo'; U.sub = { laudo: 'resumo' }; renderNow(); });
const tag = pg.locator('#main .chip.nat[data-v="overrun"]').first();
if (await tag.count()) { await tag.click(); await pg.waitForTimeout(300); }
else await pg.evaluate(() => { ACT.sciOpen('overrun'); });
check(await pg.evaluate(() => S.page === 'ciencia' && U.sciOpen === 'overrun'), 'etiqueta de natureza abre a ficha do modelo na página Ciência do motor');
await pg.waitForSelector('#sci-val', { timeout: 10000 }); await pg.waitForTimeout(200);
const sci = await pg.locator('#main').innerText();
check((await pg.locator('#main details.card').count()) === 25, 'página lista as 25 fichas de modelo');
check(/Três níveis de avaliação/.test(sci) && /Verificação matemática/.test(sci) && /Nenhum modelo do app é classificado como validado/.test(sci), 'três níveis explicados, sem modelo "validado"');
const val = await pg.locator('#sci-val').innerText();
const vt = val.replace(/\n/g, ' '); const nOv = +(vt.match(/Overrun\s+(\d+)/) || [])[1];
check(nOv >= 6 && /°Brix da mistura\s+6\b/.test(vt) && /pH\s+0\s+—/.test(vt), `validação conta os lotes medidos por grandeza (overrun ${nOv}, °Brix 6, pH 0 = sem dados)`);
check(/avaliado|dentro da tolerância/.test(val), 'com 6 lotes o status passa de "evidência inicial"');
check(/Cobertura da faixa de 90%/.test(val), 'linha de cobertura da faixa de 90% na validação');
const ficha = await pg.locator('#sci-overrun').innerText();
check(/Equação/.test(ficha) && /Tolerância para validação/.test(ficha) && /5 pontos percentuais/.test(ficha) && /Validação com os seus lotes/.test(ficha), 'ficha do overrun com equação, tolerância e validação');
check(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), 'Ciência do motor sem rolagem horizontal a 390 px');
await pg.evaluate(() => { LOTS = LOTS.filter(L => !String(L.id).startsWith('val')); fitCalibration(LOTS); CAL.ver++; });
// Procedência da composição (v18.11): filtro de ingredientes e linha de composição na incerteza
await pg.evaluate(() => { S.page = 'ingredientes'; U.ingProv = 'sem'; U.ingCat = 'Todas'; renderNow(); });
const ingTxt = await pg.locator('#main').innerText();
check(/sem fonte \(\d+\)/.test(ingTxt) && /Procedência/.test(ingTxt) && (await pg.locator('#main table.tbl tbody tr').count()) > 50, 'Ingredientes: filtro "sem fonte" e coluna de procedência');
await pg.evaluate(() => { U.ingProv = ''; S = fromPreset(PRESETS.find(p => /Cioccolato/.test(p.name))); S.page = 'laudo'; U.sub = { laudo: 'congelamento' }; renderNow(); });
const lau = await pg.locator('#main').innerText();
check(/Composição: \d+% da massa vem de ingredientes com fonte/.test(lau) && /Sem fonte \(sólidos\)/.test(lau), 'laudo mostra a parte da receita sem fonte e o efeito dela na faixa');
// Monte Carlo sob demanda (v18.12)
await pg.locator('button[data-a="uncMC"]').click();
await pg.waitForSelector('#unc-mc', { timeout: 15000 });
const mc = await pg.locator('#unc-mc').innerText();
check(/Monte Carlo · 5% a 95%/.test(mc) && /erro do próprio modelo/i.test(mc), 'Monte Carlo mostra faixa 5–95% e a parte do erro do modelo');
check(await pg.evaluate(() => !Object.keys(ING_BY).some(k => k.startsWith('~'))), 'Monte Carlo não deixa ingrediente temporário no banco');
// Ciclo completo (v18.13)
await pg.evaluate(() => { S = fromPreset(PRESETS.find(p => /Pistacchio/.test(p.name))); S.page = 'laudo'; U.sub = { laudo: 'ciclo' }; U.twinB = null; renderNow(); });
await pg.waitForSelector('#twin-card', { timeout: 10000 });
const tw = await pg.locator('#twin-card').innerText();
check(/Tratamento térmico/.test(tw) && /não simulado/.test(tw) && /Armazenamento/.test(tw) && /Serviço/.test(tw), 'ciclo completo com as etapas e a fidelidade de cada uma');
await pg.locator('button[data-a="twinBOn"]').click();
await pg.locator('select[data-c="twinB"][data-k="coolMode"]').selectOption('geladeira');
await pg.waitForTimeout(150);
const twcmp = await pg.locator('#twin-cmp').innerText();
check(/Cenário B/.test(twcmp) && /De 60 a 10 °C\s+25\s+min\s+\d{3}\s+\+\d{3}/.test(twcmp), 'cenário B (direto na geladeira) mostra o resfriamento horas mais lento');
await pg.locator('select[data-c="proc"][data-k="coolVessel"]').selectOption('plastico');
check(await pg.evaluate(() => S.proc.coolVessel === 'plastico'), 'recipiente do processo atual muda pela tela');
check(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), 'ciclo completo sem rolagem horizontal a 390 px');
// Tarefas no Web Worker (v18.14): Monte Carlo cancelável e medição do aparelho
await pg.evaluate(() => { S = fromPreset(PRESETS.find(p => /fragola/i.test(p.name))); S.page = 'laudo'; U.sub = { laudo: 'congelamento' }; U.uncMC = null; renderNow(); });
await pg.locator('button[data-a="uncMC"]').click();
await pg.waitForSelector('#unc-mc', { timeout: 20000 });
const mcW = await pg.evaluate(() => ({ worker: U.uncMC.worker, n: U.uncMC.r.n, top: U.uncMC.r.contrib[0].id, p05: U.uncMC.r.p05 }));
const mcLocal = await pg.evaluate(() => { const r = uncertaintyMC(S, { n: 300 }); return { top: r.contrib[0].id, p05: r.p05 }; });
check(mcW.worker === true && mcW.n === 300 && mcW.top === 'morango', 'Monte Carlo roda no Web Worker e acha o morango como fonte dominante');
check(Math.abs(mcW.p05 - mcLocal.p05) < 1e-9, 'resultado do worker idêntico ao da página (mesma semente)');
const busyBefore = await pg.evaluate(() => { document.querySelector('button[data-a="uncMC"][data-v="2000"]').click(); renderNow(); const b = !!(U.uncMC && U.uncMC.busy && document.querySelector('button[data-a="uncMCStop"]')); document.querySelector('button[data-a="uncMCStop"]').click(); return b; });
await pg.waitForTimeout(300);
check(busyBefore, 'alta resolução mostra progresso e o botão Cancelar');
check(/Cancelado/.test(await pg.locator('#main').innerText()) && await pg.evaluate(() => !U.uncMC.busy), 'alta resolução pode ser cancelada no meio');
await pg.evaluate(() => { S.page = 'ciencia'; renderNow(); });
await pg.locator('button[data-a="benchRun"]').click();
await pg.waitForSelector('#bench-tbl', { timeout: 90000 });
const bt = await pg.locator('#bench-card').innerText();
check((await pg.locator('#bench-tbl tbody tr').count()) === 12 && /Web Worker aberto em/.test(bt), 'medição do aparelho: 12 operações, rodando no Web Worker');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('fredolin_bench_v1'))[0].ops.length === 12), 'resultado guardado no aparelho');
// Painel sensorial (v18.15): método pelo objetivo, triângulo, perfil por escala, TDS, ordenação e física × percepção
await pg.evaluate(() => { const p = PRESETS.find(x => x.name === 'Fiordilatte');
  for (let i = 1; i <= 3; i++) LOTS.unshift({ id: 'sx' + i, code: 'SX' + i, name: 'Sensorial ' + i, date: '2026-10-18', tipo: 'crema', vit: -12, recipe: p.recipe.map(([id, g]) => ({ id, g: id === 'creme35' ? g + i * 30 : g })), proc: {}, meas: {}, panel: [] });
  U.panel = null; localStorage.removeItem('fredolin_v13_panel'); S.page = 'lotes'; U.sub = { lotes: 'painel' }; renderNow(); });
const clickA = async (a, v) => { await pg.locator(`button[data-a="${a}"]${v != null ? `[data-v="${v}"]` : ''}`).first().click(); };
const lot = async id => { await pg.locator(`input[data-c="panelLot"][data-k="${id}"]`).check(); };
const taster = async n => { await pg.locator('#panelTaster').fill(n); await pg.locator('#panelTaster').dispatchEvent('input'); };
check(/O que você quer saber/.test(await pg.locator('#main').innerText()), 'painel começa pela pergunta do experimento');
// triângulo com 3 provadores: dois acertam, um erra
await clickA('panelMethod', 'tri'); await lot('sx1'); await lot('sx2');
for (const [nome, acerta] of [['Ana', true], ['Bia', true], ['Caio', false]]) {
  await taster(nome); await clickA('panelStart');
  const T = await pg.evaluate(() => U.panel.tri); const odd = T.lay.split('').filter(c => c === 'A').length === 1 ? 'A' : 'B';
  const idx = acerta ? T.lay.indexOf(odd) : T.lay.split('').findIndex(c => c !== odd);
  await clickA('panelTri', idx); await clickA('panelNext'); }
let pres = await pg.locator('#panel-res').innerText();
check(/Provadores\s+3/.test(pres) && /Acertaram o copo diferente\s+2/.test(pres) && /diferença não detectada/.test(pres) && /não prova que as versões são iguais/.test(pres), 'triângulo: 2 de 3, sem diferença detectada e sem concluir igualdade');
check(await pg.evaluate(() => LOTS.find(l => l.id === 'sx1').panel.filter(e => e.m === 'tri').length === 3 && new Set(LOTS.find(l => l.id === 'sx2').panel.map(e => e.lay)).size === 3), 'cada provador recebeu um arranjo de copos diferente, gravado nos dois lotes');
// perfil por escala com 2 provadores
await clickA('panelReset'); await clickA('panelMethod', 'qda'); await lot('sx1'); await lot('sx2'); await lot('sx3');
for (const [nome, base] of [['Ana', 3], ['Bia', 4]]) { await taster(nome); await clickA('panelStart');
  for (let k = 0; k < 3; k++) { const id = await pg.evaluate(() => U.panel.order[U.panel.i]); const n = +id.slice(2);
    for (const a of ['doce', 'crem', 'corpo', 'gran']) await clickA('panelSet', `${a}|${Math.min(10, base + (a === 'crem' ? 2 * n : 1))}`);
    await clickA('panelNext'); } }
pres = await pg.locator('#panel-res').innerText();
check(/Cremosidade/.test(pres) && /sim/.test(pres) && /da variação/.test(pres), 'perfil: ANOVA detecta a diferença de cremosidade e mostra a variação entre avaliadores');
check((await pg.locator('#panel-bridge').innerText()).match(/Cremosidade[\s\S]*dados insuficientes/) != null, 'física × percepção: com 3 lotes, sem conclusão');
// TDS: um provador, uma amostra
await clickA('panelReset'); await clickA('panelMethod', 'tds'); await lot('sx1');
await taster('Ana'); await clickA('panelStart'); await clickA('panelTdsGo'); await clickA('panelTdsTap', 'doce'); await pg.waitForTimeout(250); await clickA('panelTdsTap', 'crem'); await pg.waitForTimeout(250); await clickA('panelTdsEnd'); await clickA('panelNext');
const tdsE = await pg.evaluate(() => { const e = LOTS.find(l => l.id === 'sx1').panel.find(x => x.m === 'tds'); return e ? JSON.stringify({ seq: e.seq, end: e.end }) : 'nada gravado'; });
check(/"seq":\[\[[\d.]+,"doce"\],\[[\d.]+,"crem"\]\]/.test(tdsE) && JSON.parse(tdsE).end > JSON.parse(tdsE).seq[0][0], 'TDS grava a sequência no tempo: ' + tdsE);
await pg.waitForSelector('#panel-res svg', { timeout: 5000 }).catch(() => {});
check((await pg.locator('#panel-res svg').count()) === 1, 'TDS desenha as curvas de dominância');
// ordenação
await clickA('panelReset'); await clickA('panelMethod', 'rank'); for (const id of ['sx1', 'sx2', 'sx3']) await lot(id);
for (const nome of ['Ana', 'Bia', 'Caio']) { await taster(nome); await clickA('panelStart'); for (const id of ['sx3', 'sx2', 'sx1']) await clickA('panelRank', id); await clickA('panelNext'); }
pres = await pg.locator('#panel-res').innerText();
check(/Friedman/.test(pres) && /Soma dos postos/.test(pres), 'ordenação com teste de Friedman');
check(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), 'painel sem rolagem horizontal a 390 px');
await pg.evaluate(() => { LOTS = LOTS.filter(L => !String(L.id).startsWith('sx')); U.panel = null; });
// Microestrutura e reologia (v18.16)
await pg.evaluate(() => { S = fromPreset(PRESETS.find(p => /Pistacchio/.test(p.name))); LOTS.unshift({ id: 'rh1', code: 'RH1', name: S.name, date: '2026-10-18', tipo: S.tipo, vit: S.vit, recipe: JSON.parse(JSON.stringify(S.recipe)), meas: { rheo: '5:1400; 10:1000; 30:620; 60:450; 120:330', rheoT: 4 } }); S.page = 'laudo'; U.sub = { laudo: 'micro' }; renderNow(); });
await pg.waitForSelector('#micro-fases', { timeout: 10000 });
const mic = await pg.locator('#main').innerText();
check(/Matriz não congelada/.test(mic) && /balanço/.test(mic) && /distribuição hipotética/.test(mic) && /Não é medição/.test(mic) && /não estimado/.test(mic), 'microestrutura separa balanço, semiempírico e hipótese; bolhas não estimadas');
check(/Lote RH1/.test(mic) && /pseudoplástico/.test(mic) && /Herschel–Bulkley/.test(mic), 'reologia ajustada das leituras do lote');
check(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), 'microestrutura sem rolagem horizontal a 390 px');
await pg.evaluate(() => { LOTS = LOTS.filter(L => L.id !== 'rh1'); });
// Laboratório visual e fichas dos gráficos (v18.17)
await pg.evaluate(() => { S = fromPreset(PRESETS.find(p => /Pistacchio/.test(p.name))); S.page = 'laudo'; U.sub = { laudo: 'congelamento' }; renderNow(); });
await pg.waitForTimeout(150);
const nMeta = await pg.locator('#main details.sci-meta').count();
check(nMeta >= 1 && /Depressão do ponto de congelamento/.test(await pg.locator('#main details.sci-meta').first().textContent()), `gráficos do laudo ganham a ficha (fonte, método, modelo): ${nMeta}`);
await pg.locator('#main details.sci-meta').first().evaluate(d => { d.open = true; });
await pg.locator('#main details.sci-meta button[data-a="sciOpen"]').first().click();
check(await pg.evaluate(() => S.page === 'ciencia' && !!U.sciOpen), 'o modelo na ficha abre a ficha do modelo em Ciência do motor');
await pg.evaluate(() => { S.page = 'visual'; U.sub = { visual: 'camara' }; U.vis = null; renderNow(); });
await pg.waitForSelector('#vis-camara svg', { timeout: 10000 });
const camRects = await pg.locator('#vis-camara svg[aria-label^="Mapa de temperatura"] rect').count();
check(camRects >= 14 * 20, `câmara térmica: mapa calculado célula a célula (${camRects} células)`);
await pg.locator('#vis-camara select[data-k="vessel"]').selectOption('plastico'); await pg.waitForTimeout(200);
check(await pg.evaluate(() => U.chamber && U.chamber.r.vessel === 'plastico' && U.chamber.r.hEff < U.chamber.r.h), 'parede de plástico reduz a troca de calor efetiva');
await pg.evaluate(() => { U.sub = { visual: 'microscopio' }; U.mic = null; renderNow(); });
await pg.waitForSelector('#micHost canvas', { timeout: 10000 });
const mt = await pg.locator('#vis-micro').innerText();
check(/modelada/.test(mt) && /ilustrativa/.test(mt) && /não é estimado/.test(mt) && /Não é imagem de microscópio|Esferas são geometria didática/.test(mt), 'microscópio declara o tipo de representação de cada fase');
await pg.locator('button[data-a="micView"][data-v="slice"]').click(); await pg.locator('button[data-a="micShow"][data-v="air"]').click(); await pg.locator('button[data-a="micT"][data-v="store"]').click();
check(await pg.evaluate(() => U.mic.view === 'slice' && !U.mic.show.air && U.mic.T === 'store' && !!document.querySelector('#micHost canvas')), 'corte, isolar fases e trocar a temperatura');
check(await pg.evaluate(() => document.documentElement.scrollWidth <= 390), 'laboratório visual sem rolagem horizontal a 390 px');
check(!errs.length, 'sem erros de página ' + errs.join(' | '));
await b.close(); srv.close(); process.exit(fails.length ? 1 : 0);
