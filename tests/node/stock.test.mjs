/* Estoque por movimentos (v18): baixa FEFO sem regravar a entrada, idempotente por lote. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine();
const inv = () => [
  { id: 'E1', ingId: 'leite', qty: 1000, costKg: 4, exp: '2026-10-20', lot: 'A' },
  { id: 'E2', ingId: 'leite', qty: 3000, costKg: 5, exp: '2026-10-25', lot: 'B' },
  { id: 'E3', ingId: 'creme', qty: 500, costKg: 20, exp: '2026-10-22', lot: 'C' }];

test('baixa FEFO gera movimentos e não altera as entradas', () => {
  const I = inv(); const R = E.consumeFIFO(I, 'leite', 1500, 'L9');
  assert.equal(R.rest, 0); assert.equal(R.movs.length, 2);
  assert.deepEqual(Array.from(R.movs, m => [m.entry, m.g]), [['E1', 1000], ['E2', 500]], 'vence antes, sai antes');
  assert.equal(I[0].qty, 1000, 'entrada intacta');
  assert.equal(R.firstLot, 'A');
});
test('saldo = entrada − movimentos; custo médio acompanha o que sobrou', () => {
  const I = inv(); I.push(...E.consumeFIFO(I, 'leite', 1500, 'L9').movs);
  const by = E.invStock(I);
  assert.equal(by.leite.q, 2500); assert.equal(by.leite.c / by.leite.q, 5, 'sobrou só o lote B (R$ 5/kg)');
  assert.equal(E.invEntries(I).length, 3, 'movimentos não aparecem como entradas');
});
test('baixar o mesmo lote de novo não desconta duas vezes', () => {
  const I = inv(); I.push(...E.consumeFIFO(I, 'leite', 1500, 'L9').movs);
  const R2 = E.consumeFIFO(I, 'leite', 1500, 'L9');
  assert.equal(R2.already, true); assert.equal(R2.movs.length, 0);
  assert.equal(E.invStock(I).leite.q, 2500);
});
test('ids determinísticos: dois aparelhos baixando o mesmo lote geram os mesmos registros', () => {
  const a = E.consumeFIFO(inv(), 'leite', 700, 'L5').movs, b = E.consumeFIFO(inv(), 'leite', 700, 'L5').movs;
  assert.deepEqual(Array.from(a, m => m.id), Array.from(b, m => m.id));
});
test('falta de estoque é informada (rest) e o saldo nunca fica negativo', () => {
  const I = inv(); const R = E.consumeFIFO(I, 'creme', 800, 'L1'); I.push(...R.movs);
  assert.equal(R.rest, 300); assert.equal(E.invStock(I).creme, undefined);
  I.push({ id: 'M-x', kind: 'mov', entry: 'E3', ingId: 'creme', g: 999, lot: 'outro' });
  assert.equal(E.invEntries(I).find(e => e.id === 'E3').qty, 0);
});
test('entradas antigas (saldo já descontado na v17) continuam valendo', () => {
  const by = E.invStock([{ id: 'old', ingId: 'leite', qty: 420, costKg: 4 }]); assert.equal(by.leite.q, 420);
});
