/* Arquitetura modular (v18.6): src/ é a fonte; index.html é montado; camadas não se misturam além das dívidas registradas. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { build, buildSW, readManifest } from '../../tools/build.mjs';
import { analyzeLayers, stripCode, topDecls, localNames } from '../../tools/layers.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

test('index.html é exatamente a montagem de src/ (ninguém editou o arquivo montado à mão)', () => {
  assert.equal(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), build());
});

test('sw.js é gerado com o SHA-256 da página montada e a versão do app', () => {
  const html = build(), sw = buildSW(html);
  assert.equal(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), sw.text);
  assert.match(sw.text, /const INDEX_SHA='[0-9a-f]{64}'/);
  assert.equal(sw.ver, (html.match(/const VERSION='([^']+)'/) || [])[1]);
  assert.ok(!/__INDEX_SHA__|__APP_VERSION__/.test(sw.text), 'marcadores substituídos');
  /* todo arquivo que o sw guarda existe no repositório */
  const core = JSON.parse(sw.text.match(/const CORE=(\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const u of core) assert.ok(fs.existsSync(path.join(ROOT, u)), u);
});

test('marcadores dos módulos continuam no arquivo montado, uma vez cada (Web Worker e testes dependem deles)', () => {
  const html = build();
  const marks = html.match(/^\/\* ==== [\w-]+\.js ==== \*\//gm) || []; /* só no início da linha: o workerSrc cita dois marcadores como texto */
  assert.equal(marks.length, 27, 'marcadores: ' + marks.length);
  assert.equal(new Set(marks).size, marks.length, 'marcador repetido');
  for (const m of ['01-util.js', '33-golden.js', '38-mode.js']) assert.ok(html.includes(`/* ==== ${m} ==== */`), m);
});

test('o trecho do Web Worker (01-util → 33-golden) só tem módulos de núcleo e de produto', () => {
  const f = readManifest().files;
  const a = f.indexOf('core/util.js'), b = f.indexOf('tests/golden.js');
  assert.ok(a > 0 && b > a);
  const bad = f.slice(a, b).filter(x => !/^(core|product)\//.test(x));
  assert.deepEqual(bad, []);
});

test('camadas: nenhuma dependência proibida além das dívidas registradas, e nenhuma dívida velha', () => {
  const known = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/layers-known.json'), 'utf8')).known;
  const key = v => `${v.file}|${v.uses}|${v.from}`;
  const V = analyzeLayers().violations.map(key).sort(), K = known.map(key).sort();
  assert.deepEqual(V, K);
  for (const k of known) assert.ok(k.why && k.why.length > 10, 'dívida sem motivo: ' + key(k));
});

test('verificador de camadas: ignora comentários, textos e nomes locais; pega uso real', () => {
  const code = stripCode("/* render() */ const a='render'; const t=`x ${render()} y`; // render\nfunction f(S){return S+1}");
  assert.ok(!/render\(\) \*\//.test(code));
  assert.equal((code.match(/render/g) || []).length, 1, 'só o render dentro de ${} conta');
  assert.deepEqual([...topDecls('const a=1,b=[1,2],c=f(1,2);\nfunction g(){}\nlet x;\nclass K{}')].sort(), ['K', 'a', 'b', 'c', 'g', 'x']);
  const L = localNames('function f(T,SE,S){const m=1;let {p,q}=o;[1].map(v=>v);try{}catch(err){}}');
  for (const n of ['T', 'SE', 'S', 'm', 'p', 'q', 'v', 'err']) assert.ok(L.has(n), n);
});

test('manifesto: toda camada esperada existe e nada em src/ fica fora da montagem', () => {
  const layers = new Set(readManifest().files.map(f => f.split('/')[0]));
  for (const l of ['shell', 'core', 'product', 'data', 'security', 'ui', 'tests']) assert.ok(layers.has(l), l);
});
