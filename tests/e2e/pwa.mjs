/* PWA confiável (§45): instalação conferida por hash, erro do servidor, conteúdo inesperado, atualização normal,
   atualização com o servidor ainda entregando a página antiga (propagação), abertura offline e diagnóstico na tela.
   Servidor de teste com versões trocáveis. Uso: node tests/e2e/pwa.mjs [chromium|webkit]. */
import { chromium, webkit } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { buildSW } from '../../tools/build.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const v1 = { html: fs.readFileSync(path.join(root, 'index.html'), 'utf8'), sw: fs.readFileSync(path.join(root, 'sw.js'), 'utf8') };
const verOf = h => (h.match(/const VERSION='([^']+)'/) || [])[1];
const html2 = v1.html.replace(/const VERSION='([^']+)'/, (m, v) => `const VERSION='${v}-teste2'`);
const v2 = { html: html2, sw: buildSW(html2).text };
let cur = { html: v1.html, sw: v1.sw }, override = null; /* override: {status, body} para a navegação */
const srv = http.createServer((q, r) => {
  const p = decodeURIComponent(q.url.split('?')[0]);
  const isPage = p === '/' || p === '/index.html';
  if (isPage && override) { r.writeHead(override.status, { 'Content-Type': 'text/html' }); r.end(override.body); return; }
  if (isPage) { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end(cur.html); return; }
  if (p === '/sw.js') { r.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' }); r.end(cur.sw); return; }
  const f = path.join(root, p);
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); } });
});
await new Promise(ok => srv.listen(0, ok));
const base = `http://127.0.0.1:${srv.address().port}/`;
const fails = []; const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) { fails.push(msg); if (process.env.CI) console.log(`::error title=PWA ${process.argv[2] || 'chromium'}::${msg.replace(/\n/g, ' ')}`); } };
let annotated = false;
const ann = (lvl, t, m) => { if (lvl === 'error') annotated = true; if (process.env.CI) console.log(`::${lvl} title=PWA ${process.argv[2] || 'chromium'} ${t}::${String(m).replace(/\n/g, ' | ').slice(0, 900)}`); };
process.on('exit', c => { if (c && !annotated) ann('error', 'saída', 'código ' + c + ' sem verificação falha (exceção no topo do script?)'); });
process.on('uncaughtException', e => { ann('error', 'exceção', e && e.stack || e); console.error(e); process.exit(1); });
process.on('unhandledRejection', e => { if (process.env.CI) console.log(`::error title=PWA ${process.argv[2] || 'chromium'} exceção::${String(e && e.stack || e).replace(/\n/g, ' | ').slice(0, 900)}`); console.error(e); process.exit(1); });

const engName = process.argv[2] || 'chromium'; const eng = { chromium, webkit }[engName];
let b; try { b = await eng.launch(); } catch (e) { if (process.env.CI) { console.log(`✗ ${engName}: não abriu no CI`); ann('error', 'abrir', e && e.message || e); process.exit(1); } console.log(`- ${engName}: não instalado, pulado`); srv.close(); process.exit(0); }
console.log('motor: ' + engName);
/* WebKit do Playwright não recarrega página com service worker em modo offline simulado ("internal error"): lá as etapas
   offline viram verificação online, e o relatório diz isso. O offline real é verificado no Chromium. */
const OFF = engName === 'chromium';
if (!OFF) console.log('- ' + engName + ': etapas com rede desligada não são simuláveis neste motor; verificadas online');
const ctx = await b.newContext();
await ctx.route('**/*supabase.co/**', r => r.abort()); await ctx.route('**/fonts.g*/**', r => r.abort());
const diag = pg => pg.evaluate(async () => { await navigator.serviceWorker.ready; for (let i = 0; i < 40 && !navigator.serviceWorker.controller; i++) await new Promise(r => setTimeout(r, 100)); return swAsk('diag'); });
const caches_ = pg => pg.evaluate(async () => (await caches.keys()).filter(k => k.startsWith('il-fredolin-')).sort());

/* 0. migração: aparelho com o service worker antigo (v18.6, publicado) recebe esta versão */
{ const { execSync } = await import('node:child_process');
  const old = { html: execSync('git show origin/main:index.html', { cwd: root, maxBuffer: 64e6 }).toString(), sw: execSync('git show origin/main:sw.js', { cwd: root }).toString() };
  cur = old; const c0 = await b.newContext(); await c0.route('**/*supabase.co/**', r => r.abort()); await c0.route('**/fonts.g*/**', r => r.abort());
  const p0 = await c0.newPage(); await p0.goto(base); await p0.evaluate(async () => { await navigator.serviceWorker.ready; }); await p0.reload(); await p0.waitForTimeout(500);
  const k0 = await p0.evaluate(async () => (await caches.keys()).join(','));
  cur = { html: v1.html, sw: v1.sw };
  const ch = p0.evaluate(() => new Promise(res => { navigator.serviceWorker.addEventListener('controllerchange', () => res(true)); setTimeout(() => res(false), 8000); }));
  await p0.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update().catch(() => { }); });
  const took = await ch; await p0.reload(); await p0.waitForTimeout(3500);
  const k1 = await p0.evaluate(async () => (await caches.keys()).filter(k => k.startsWith('il-fredolin-')).join(','));
  if (OFF) await c0.setOffline(true); await p0.reload(); await p0.waitForTimeout(1000);
  const vOff = await p0.evaluate(() => typeof VERSION !== 'undefined' && VERSION).catch(() => null);
  check(took && vOff === verOf(v1.html) && k1 === 'il-fredolin-' + v1.sw.match(/INDEX_SHA='([0-9a-f]{12})/)[1], `migração do sw publicado (${verOf(old.html)}, cache ${k0}) → ${vOff}${OFF ? ' offline' : ''}; caches agora: ${k1}`);
  await c0.close(); cur = { html: v1.html, sw: v1.sw }; }

/* 1. instalação conferida */
let pg = await ctx.newPage(); await pg.goto(base); await pg.reload(); await pg.waitForTimeout(500);
let d = await diag(pg);
check(d.version === verOf(v1.html) && d.miss && d.miss.length === 0 && d.indexOk === true, `instala ${d.version}: ${d.have && d.have.length} arquivos guardados, página confere pelo SHA-256`);
const c1 = await caches_(pg);
check(c1.length === 1 && c1[0] === 'il-fredolin-' + v1.sw.match(/INDEX_SHA='([0-9a-f]{12})/)[1], 'cache versionado com o hash da página: ' + c1.join(','));

/* 2. erro do servidor durante a navegação: mostra a cópia guardada, não a página de erro */
override = { status: 500, body: '<h1>500 erro do servidor</h1>' };
await pg.reload(); await pg.waitForTimeout(800);
check(await pg.evaluate(() => typeof analyze === 'function' && !!document.querySelector('#main')), 'servidor com erro 500: abre a cópia guardada');
/* 3. conteúdo inesperado com 200 (portal, página trocada): é exibido online, mas não substitui a cópia guardada */
override = { status: 200, body: '<!doctype html><title>portal</title><h1>Faça login no Wi-Fi</h1>' };
await pg.reload(); await pg.waitForTimeout(600);
check(/Wi-Fi/.test(await pg.content()), 'online, a página inesperada aparece (é o que o servidor mandou)');
override = null;
if (OFF) { await ctx.setOffline(true);
  await pg.reload(); await pg.waitForTimeout(1000);
  check(await pg.evaluate(() => typeof analyze === 'function'), 'offline depois disso: abre o app guardado, não a página inesperada');
  await ctx.setOffline(false); } else { await pg.reload(); await pg.waitForTimeout(800); }
d = await diag(pg); check(d.indexOk === true, 'cópia guardada continua conferindo pelo hash');

/* 4. atualização com o servidor ainda entregando a página antiga: a versão nova não se instala e a antiga segue íntegra */
cur = { html: v1.html, sw: v2.sw };
await pg.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); try { await r.update(); } catch (e) { } });
await pg.waitForTimeout(2500);
const st4 = await pg.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return { active: r.active && r.active.state, waiting: !!r.waiting, installing: !!r.installing }; });
d = await diag(pg);
check(d.version === verOf(v1.html) && d.indexOk && !st4.waiting, `sw novo com página antiga no servidor: instalação recusada, segue ${d.version} (${JSON.stringify(st4)})`);
check((await caches_(pg)).length === 1, 'nenhum cache parcial da versão nova ficou para trás');

/* 5. atualização normal: página e sw novos; a nova versão é guardada inteira e a antiga apagada */
cur = { html: v2.html, sw: v2.sw };
const changed = pg.evaluate(() => new Promise(res => { navigator.serviceWorker.addEventListener('controllerchange', () => res(true)); setTimeout(() => res(false), 8000); }));
await pg.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); try { await r.update(); } catch (e) { } });
check(await changed, 'atualização normal: o service worker novo assume (o app oferece "Atualizar agora")');
await pg.waitForTimeout(500);
d = await diag(pg);
check(d.version === verOf(v2.html) && d.indexOk && d.miss.length === 0, `versão nova guardada e conferida: ${d.version}`);
{ const cs = await caches_(pg); check(cs.length === 1, 'cache da versão anterior apagado depois que a nova ficou completa: ' + cs.join(', ')); }
if (OFF) await ctx.setOffline(true); await pg.close();
const p2 = await ctx.newPage(); await p2.goto(base).catch(() => { }); await p2.waitForTimeout(1200);
check(await p2.evaluate(() => typeof VERSION !== 'undefined' && VERSION).catch(() => null) === verOf(v2.html), OFF ? 'fechar e reabrir offline: abre a versão nova' : 'fechar e reabrir: abre a versão nova');

/* 6. diagnóstico na tela (Conta e sincronização) */
await p2.evaluate(() => { AUTH.state = 'ready'; ME.ws = null; S.page = 'dados'; renderNow(); });
await p2.click('#off-card button[data-a="offDiag"]'); await p2.waitForTimeout(1500);
const card = await p2.locator('#off-card').innerText();
check(/Pronto para usar sem internet/.test(card) && /8 de 8/.test(card) && /confere \(SHA-256\)\s*sim/i.test(card.replace(/\n/g, ' ')), 'cartão "Funcionamento offline": pronto, 8 de 8 arquivos, página confere');
check(/Último backup exportado/.test(card), 'cartão mostra o último backup exportado');
await b.close(); srv.close();
console.log(fails.length ? `${fails.length} falha(s)` : 'PWA: tudo certo'); ann('notice', 'resumo', fails.length ? fails.length + ' falha(s)' : 'tudo certo');
process.exit(fails.length ? 1 : 0);
