/* Famílias de produto (v18.3): cada família com uma receita de exemplo de ingredientes reais da base. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './harness.mjs';
const E = loadEngine(); E.CAL.on = false;
const R = (...a) => a.map(([id, g]) => ({ id, g }));
const EX = {
  granita: R(['limao', 250], ['sacarose', 220], ['agua', 530]),
  semifreddo: R(['creme35', 450], ['gema', 120], ['sacarose', 170], ['leite', 160], ['agua', 100]),
  americano: R(['leite', 520], ['creme35', 300], ['lpd', 45], ['sacarose', 120], ['glicose38', 30], ['neutro', 3]),
  philadelphia: R(['leite', 520], ['creme35', 300], ['lpd', 45], ['sacarose', 130], ['glicose38', 20], ['neutro', 3]),
  custard: R(['leite', 480], ['creme35', 290], ['gema', 70], ['lpd', 30], ['sacarose', 130], ['glicose38', 20]),
  soft: R(['leite', 700], ['creme35', 120], ['lpd', 60], ['sacarose', 120], ['neutro', 3]),
  froyo: R(['iogurte', 450], ['leite', 300], ['lpd', 70], ['sacarose', 150], ['dextrosem', 25], ['neutro', 4]),
  kulfi: R(['leite', 330], ['creme35', 340], ['lpd', 120], ['sacarose', 160], ['agua', 45], ['neutro', 5]),
  dondurma: R(['cabra', 640], ['creme35', 90], ['lpd', 60], ['sacarose', 190], ['nx_salep', 9], ['agua', 10]),
  paleta_fruta: R(['morango', 520], ['sacarose', 170], ['agua', 300], ['neutro', 3]),
  paleta_creme: R(['leite', 600], ['creme35', 140], ['lpd', 50], ['sacarose', 170], ['glicose38', 30], ['neutro', 3])
};
const st = (tipo, recipe, extra = {}) => Object.assign(E.stTest({ tipo, vit: E.PROF[tipo].serveT, recipe }, E.PROF[tipo].serveT), extra);
const titles = F => Array.from(F, f => f.title).join(' | ');

test('toda família nova tem faixas completas, fonte registrada e comportamento-base válido', () => {
  const novas = Object.keys(EX);
  for (const k of novas) { const P = E.PROF[k]; assert.ok(P, k);
    for (const f of ['sol', 'fat', 'msnf', 'swt', 'pod', 'prot', 'stab', 'fz', 'ov', 'draw']) assert.ok(Array.isArray(P[f]) && P[f][0] <= P[f][1], `${k}.${f}`);
    assert.ok(['crema', 'sorbetto'].includes(P.like) && P.proc && P.fam && (P.src || []).length && ['fonte', 'prática'].includes(P.conf), k); }
});

test('cada exemplo analisa sem número inválido e o diagnóstico roda', () => {
  for (const [k, rec] of Object.entries(EX)) { const s = st(k, rec), m = E.analyze(s);
    assert.ok(!m.empty, k); for (const f of ['sol', 'fat', 'fzVit', 'serveT', 'ov', 'visc', 'pod', 'gPerL']) assert.ok(Number.isFinite(m[f]), `${k}.${f}=${m[f]}`);
    assert.ok(E.diagnose(s, m).length > 0, k); }
});

test('fora da mantecadora, o overrun é o da família (não o da máquina)', () => {
  for (const k of ['semifreddo', 'kulfi', 'granita', 'paleta_fruta', 'soft', 'froyo']) { const P = E.PROF[k], m = E.analyze(st(k, EX[k]));
    assert.equal(m.ovSrc, 'processo', k); assert.equal(m.ov, Math.round((P.ov[0] + P.ov[1]) / 2), k); }
  assert.equal(E.analyze(st('americano', EX.americano)).ovSrc, 'máquina');
});

test('americano premium na Maestro: overrun abaixo da faixa é acusado (limite real da máquina)', () => {
  const s = st('americano', EX.americano); s.proc.machine = 'maqp1'; const m = E.analyze(s);
  assert.ok(m.ov < E.PROF.americano.ov[0]); assert.match(titles(E.diagnose(s, m)), /[Oo]verrun/);
});

test('granita: cristais grandes não são defeito; sem estabilizante não é aviso', () => {
  const s = st('granita', EX.granita), m = E.analyze(s), F = E.diagnose(s, m), T = titles(F);
  assert.doesNotMatch(T, /Sem estabilizante/); assert.match(T, /cristais grandes são o objetivo/);
  assert.equal(m.shelfVit, 60);
  const s2 = st('sorbetto', EX.granita); assert.notEqual(E.analyze(s2).shelfVit, 60, 'no sorbetto a regra de cristal continua valendo');
});

test('custard: sólidos de gema contra 21 CFR 135.110; philadelphia sem gema; froyo com iogurte', () => {
  const c = st('custard', EX.custard), mc = E.analyze(c); E.diagnose(c, mc);
  assert.ok(Math.abs(mc.yolkSol - 70 * .475 / mc.tot * 100) < .01, 'sólidos de gema = gema × 47,5%');
  assert.match(titles(E.diagnose(c, mc)), /Gema dentro da definição de custard/);
  const pouco = st('custard', EX.custard.map(r => r.id === 'gema' ? { id: 'gema', g: 15 } : r)); assert.match(titles(E.diagnose(pouco, E.analyze(pouco))), /Pouca gema/);
  const ph = st('philadelphia', [...EX.philadelphia, { id: 'gema', g: 40 }]); assert.match(titles(E.diagnose(ph, E.analyze(ph))), /Gema em estilo Philadelphia/);
  assert.doesNotMatch(titles(E.diagnose(st('philadelphia', EX.philadelphia), E.analyze(st('philadelphia', EX.philadelphia)))), /Gema em estilo/);
  assert.doesNotMatch(titles(E.diagnose(st('froyo', EX.froyo), E.analyze(st('froyo', EX.froyo)))), /sem iogurte/);
  const semIog = st('froyo', EX.froyo.filter(r => r.id !== 'iogurte').concat([{ id: 'leite', g: 450 }]));
  assert.match(titles(E.diagnose(semIog, E.analyze(semIog))), /Frozen yogurt sem iogurte/);
});

test('famílias de prática avisam que as faixas não têm fonte primária', () => {
  for (const k of ['granita', 'semifreddo', 'paleta_fruta', 'dondurma']) assert.match(titles(E.diagnose(st(k, EX[k]), E.analyze(st(k, EX[k])))), /Faixas de prática/, k);
  assert.doesNotMatch(titles(E.diagnose(st('americano', EX.americano), E.analyze(st('americano', EX.americano)))), /Faixas de prática/);
});

test('balanceador funciona nas famílias novas', () => {
  let ok = 0; const out = [];
  for (const k of Object.keys(EX)) { const b = E.balance(st(k, EX[k])); if (b && b.ok) ok++; out.push(k + ':' + (b && b.ok ? 'ok' : (b && b.msg || 'falhou'))); }
  assert.ok(ok >= 8, out.join(' · '));
});
