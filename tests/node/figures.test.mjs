/* §39: todo gráfico científico tem ficha (fonte, variáveis e unidades, escalas, método, modelo, condições, incerteza). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const fig = fs.readFileSync(path.join(ROOT, 'src/ui/components/figura.js'), 'utf8');
const metaSrc = fig.slice(fig.indexOf('const FIG_META={'), fig.indexOf('const FIG_SKIP='));
const keys = [...metaSrc.matchAll(/^ '([^']+)':\{/gm)].map(m => m[1]);
const skip = JSON.parse(fig.match(/const FIG_SKIP=(\[[^\]]*\])/)[1].replace(/'/g, '"'));
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/model-registry.json'), 'utf8'));

test('todo gráfico (role="img") da interface tem ficha registrada ou usa sciFig', () => {
  const dir = path.join(ROOT, 'src/ui'); const files = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') && files.push(path.join(d, e.name)));
  walk(dir); const miss = [];
  for (const f of files) { const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/role="img"[^>]*?aria-label="([^"$]*)/g)) { const lab = m[1];
      if (!lab || skip.some(x => lab.startsWith(x)) || keys.some(k => lab.startsWith(k))) continue;
      /* gráficos dentro de sciFig: o rótulo aparece num arquivo que chama sciFig */
      if (/sciFig\(/.test(s) && /visual\.js$/.test(f)) continue;
      miss.push(path.basename(f) + ': ' + lab); } }
  assert.deepEqual(miss, []);
  assert.ok(keys.length >= 20, 'fichas: ' + keys.length);
});

test('cada ficha tem os 7 campos e aponta para modelos que existem no registro', () => {
  const ids = new Set(reg.models.map(m => m.id));
  for (const k of keys) { const i = metaSrc.indexOf(`'${k}':{`); const body = metaSrc.slice(i, metaSrc.indexOf('\n', i));
    for (const f of ['src:', 'vars:', 'scale:', 'method:', 'model:', 'cond:', 'unc:']) assert.ok(body.includes(f), `${k}: falta ${f}`);
    const mm = body.match(/model:\[([^\]]*)\]/); if (mm) for (const id of mm[1].split(',').map(x => x.trim().replace(/'/g, ''))) assert.ok(ids.has(id), `${k}: modelo ${id} não existe`); }
});
