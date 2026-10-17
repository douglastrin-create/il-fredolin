/* Backup e restauração: exportação completa e importação que nunca sobrescreve dado mais novo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBackup, loadRoles } from './harness.mjs';
const B = loadBackup();
const ids = a => Array.from(a, r => r.id); // arrays do contexto vm têm outro protótipo
const rec = (id, t, extra = {}) => ({ id, updatedAt: t, name: id, ...extra });

test('exportação leva todas as coleções, inclusive sets da vitrine e lápides', () => {
  const cols = Object.fromEntries(B.BACKUP_COLS.map(c => [c, [rec(c + '1', 1)]]));
  cols.vit = [rec('main', 1), rec('set_pro', 2, { kind: 'set' })];
  const p = B.backupPayload(cols, { lib: { gone: 9 } }, { v: 'x' });
  for (const c of ['lib', 'exec', 'lots', 'ings', 'nx', 'inv']) assert.equal(p[c].length, 1, c);
  assert.equal(p.vits.length, 2); assert.equal(p.schema, 2); assert.deepEqual(p.tomb, { lib: { gone: 9 } });
});

test('restaurar backup antigo não sobrescreve edição mais nova deste aparelho', () => {
  const local = { lib: [rec('a', 500), rec('b', 100)] };
  const plan = B.planImport({ lib: [rec('a', 200), rec('b', 300), rec('c', 50)] }, local, {});
  const L = plan.cols.lib;
  assert.equal(L.keep, 1, '"a" daqui (500) é mais novo que o do arquivo (200): fica');
  assert.deepEqual(ids(L.upd), ['b'], '"b" daqui (100) é mais antigo: atualiza');
  assert.deepEqual(ids(L.add), ['c']);
});

test('itens apagados aqui depois do backup não voltam sozinhos', () => {
  const plan = B.planImport({ lots: [rec('L1', 100), rec('L2', 100)] }, { lots: [] }, { lots: { L1: 400 } });
  assert.deepEqual(ids(plan.cols.lots.del), ['L1']);
  assert.deepEqual(ids(plan.cols.lots.add), ['L2']);
});

test('backup sem datas (artefato antigo) só completa o que falta', () => {
  const plan = B.planImport({ ings: [{ id: 'x' }, { id: 'y' }] }, { ings: [rec('x', 1)] }, {});
  assert.equal(plan.cols.ings.keep, 1); assert.deepEqual(ids(plan.cols.ings.add), ['y']);
});

test('formato v17 (só "vitrine") ainda é aceito', () => {
  const plan = B.planImport({ vitrine: { temp: -12, items: [1] } }, { vit: [] }, {});
  assert.equal(plan.cols.vit.add[0].id, 'main');
});

test('arquivo que não é backup é recusado', () => { assert.throws(() => B.planImport(null, {}, {})); });

test('perfis: todos podem resolver a própria quarentena; só o Maestro restaura backup', () => {
  for (const role of ['maestro', 'chef', 'sous']) {
    const { can } = loadRoles(undefined, role);
    for (const a of ['rejRetry', 'rejExport', 'rejDrop', 'rejDropYes', 'rejDropNo', 'logout']) assert.ok(can.act(a), `${role} · ${a}`);
    assert.equal(can.act('impGo'), role === 'maestro', `${role} · impGo`);
  }
});
