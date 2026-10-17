/* As etiquetas de natureza da interface (MODEL_NAT) não podem divergir do registro docs/model-registry.json. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { readApp } from './harness.mjs';
const reg = JSON.parse(fs.readFileSync(new URL('../../docs/model-registry.json', import.meta.url)));
const src = readApp().match(/const MODEL_NAT=\{[\s\S]*?\]\};/)[0];
const NAT = vm.runInNewContext(src + ';MODEL_NAT');
const word = { H: 'heurístico', SE: 'semiempírico', M: 'mecanístico', D: 'determinístico' };
test('cada etiqueta da interface existe no registro e usa a classe mais fraca registrada', () => {
  const byId = Object.fromEntries(reg.models.map(m => [m.id, m]));
  for (const [id, [label]] of Object.entries(NAT)) {
    assert.ok(byId[id], `modelo "${id}" não está no registro`);
    const weakest = ['H', 'SE', 'M', 'D'].find(c => byId[id].class.includes(c));
    assert.equal(label, word[weakest], `${id}: interface diz "${label}", registro diz ${byId[id].class}`);
  }
});
test('nenhum modelo se declara validado sem evidência', () => {
  for (const m of reg.models) assert.ok(!m.class.includes('V') || m.validation, m.id);
});
