/* Il Fredolin · bateria de desempenho nos motores de navegador (§11, §13). Não roda no CI (tempo varia com a máquina):
   gera docs/bench/navegadores.json para o registro de decisão de arquitetura.
   Uso: node tests/e2e/bench.mjs   (Chromium normal, Chromium com CPU 4× e 6× mais lenta, WebKit) */
import { chromium, webkit } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : f.endsWith('.wasm') ? 'application/wasm' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); r.end(d); }); }).listen(8097);
const cmpSrc = fs.readFileSync(path.join(root, 'tools/wasm-proto/compare.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'));
const out = { quando: new Date().toISOString(), app: { bytes: html.length, gzipBytes: zlib.gzipSync(html, { level: 9 }).length, brotliBytes: zlib.brotliCompressSync(html).length }, motores: [] };
for (const [nome, bt, rate] of [['Chromium', chromium, 1], ['Chromium · CPU 4× mais lenta', chromium, 4], ['Chromium · CPU 6× mais lenta', chromium, 6], ['WebKit (motor do Safari)', webkit, 1]]) {
  let b; try { b = await bt.launch(); } catch (e) { console.log(`- ${nome}: não instalado, pulado`); continue; }
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const pg = await ctx.newPage();
  if (rate > 1) { const cdp = await ctx.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate }); }
  const t0 = Date.now(); await pg.goto('http://localhost:8097/index.html');
  await pg.waitForFunction(() => typeof renderNow === 'function' && document.querySelector('#main'), null, { timeout: 60000 });
  const abrir = Date.now() - t0;
  const r = await pg.evaluate(async src => {
    (0, eval)(src);
    const bench = benchRun({});
    const bytes = await (await fetch('tools/wasm-proto/heat.wasm')).arrayBuffer();
    const w = await wasmCompare({ analyze, heatSim, PRESETS, PROC0, clamp }, bytes, 15);
    const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e5) / 10 : null;
    return { bench, wasm: w, heapMB: mem, ua: navigator.userAgent };
  }, cmpSrc);
  out.motores.push({ nome, abrirMs: abrir, ...r });
  console.log(`\n== ${nome} · abrir o app ${abrir} ms · memória JS ${r.heapMB ?? '—'} MB`);
  for (const o of r.bench.ops) console.log(`  ${o.id.padEnd(14)} ${o.med.toFixed(1).padStart(8)} ms  (orçamento ${o.budget})`);
  for (const c of r.wasm.casos) console.log(`  wasm ${c.id.padEnd(14)} JS ${c.js.toFixed(2)} · JS otimizado ${c.jsOtim.toFixed(2)} · wasm ${c.wasm.toFixed(2)} ms · ${c.ganho.toFixed(1)}× · dif ${c.difMax.toExponential(1)}`);
  if (process.env.CI) { const g = id => { const o = r.bench.ops.find(x => x.id === id); return o ? o.med.toFixed(1) : '—'; };
    console.log(`::notice title=Desempenho ${nome}::abrir ${abrir} ms · memória ${r.heapMB ?? '—'} MB · análise ${g('analise')} · laudo ${g('laudo')} · pote ${g('pote')} · gerar ${g('gerar')} · ciclo ${g('ciclo')} · Monte Carlo ${g('montecarlo')} · alternativas ${g('alternativas')} ms · wasm/JS pote ${r.wasm.casos[0].ganho.toFixed(2)}× endurecimento ${r.wasm.casos[1].ganho.toFixed(2)}× malha40 ${r.wasm.casos[2].ganho.toFixed(2)}×`); }
  await b.close();
}
if (!process.env.CI) fs.writeFileSync(path.join(root, 'docs/bench/navegadores.json'), JSON.stringify(out, null, 1) + '\n');
console.log('\napp:', out.app); srv.close();
