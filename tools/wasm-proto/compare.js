/* Il Fredolin · comparação JavaScript × WebAssembly do laço do heatSim (Alternativa B, §11).
   Roda no Node (compare.mjs) e no navegador (tests/e2e/bench.mjs injeta este arquivo na página do app).
   E = objeto com analyze, heatSim, PRESETS, PROC0, clamp; bytes = conteúdo de heat.wasm. */
async function wasmCompare(E, bytes, reps) {
  reps = reps || 7;
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const X = instance.exports, mem = () => new Float64Array(X.memory.buffer);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const p = E.PRESETS.find(x => x.name === 'Fiordilatte');
  const m = E.analyze({ tipo: p.tipo, vit: p.vit, recipe: p.recipe.map(([id, g]) => ({ id, g })), proc: Object.assign({}, E.PROC0), brix: {}, costs: {} });
  const cases = [
    { id: 'pote', n: 'Pote de 500 mL saindo do freezer (40 min)', o: { ml: 500, N: 12, T0: -18, Ta: 23, h: 10, tMax: 2400, step: 15, dtMax: 6 } },
    { id: 'endurecimento', n: 'Endurecimento, 500 mL (12 h)', o: { ml: 500, N: 10, T0: -4, Ta: -20, h: 14, tMax: 43200, step: 60, dtMax: 30 } },
    { id: 'malha40', n: 'Pote, malha fina N = 40 (40 min)', o: { ml: 500, N: 40, T0: -18, Ta: 23, h: 10, tMax: 2400, step: 15, dtMax: 6 } }];
  /* o mesmo laço do heat.c, em JavaScript com vetores tipados e sem criar objetos por passo */
  function jsFast(o, tab, rho, r) {
    const N = o.N, NT = tab.cap.length, cap = tab.cap, kk = tab.kk, TL = -45, TS = .25, dr = r / N, h = o.h, Ta = o.Ta;
    const vol = new Float64Array(N), area = new Float64Array(N), Tn = new Float64Array(N).fill(o.T0), q = new Float64Array(N);
    let s0 = N, scoopV = 0;
    for (let i = 0; i < N; i++) { const a = (i + 1) * dr, b = i * dr; vol[i] = 4 / 3 * Math.PI * (a * a * a - b * b * b); area[i] = 4 * Math.PI * a * a; if (a > r - .015 + 1e-9) { if (i < s0) s0 = i; scoopV += vol[i]; } }
    const ix = T => { const i = Math.floor((T - TL) / TS + .5); return i < 0 ? 0 : i >= NT ? NT - 1 : i; };
    const curve = new Float64Array(Math.ceil(o.tMax / o.step + 2) * 4); curve[1] = curve[2] = curve[3] = o.T0; let nc = 1, t = 0, next = o.step;
    while (t < o.tMax) {
      let dtMax = o.dtMax;
      for (let i = 0; i < N; i++) { const j = ix(Tn[i]), kc = kk[j], C = rho * cap[j] * vol[i]; let G = 0;
        if (i < N - 1) G += (kc + kk[ix(Tn[i + 1])]) / 2 * area[i] / dr; if (i > 0) G += (kc + kk[ix(Tn[i - 1])]) / 2 * area[i - 1] / dr;
        if (i === N - 1) G += 1 / (dr / 2 / (kc * area[i]) + 1 / (h * area[i])); const lim = .45 * C / G; if (lim < dtMax) dtMax = lim; }
      const dt = dtMax > .05 ? dtMax : .05;
      for (let i = 0; i < N; i++) { const kc = kk[ix(Tn[i])]; let f = 0;
        if (i < N - 1) f += (kc + kk[ix(Tn[i + 1])]) / 2 * area[i] / dr * (Tn[i + 1] - Tn[i]); if (i > 0) f += (kc + kk[ix(Tn[i - 1])]) / 2 * area[i - 1] / dr * (Tn[i - 1] - Tn[i]);
        if (i === N - 1) f += (Ta - Tn[i]) / (dr / 2 / (kc * area[i]) + 1 / (h * area[i])); q[i] = f; }
      for (let i = 0; i < N; i++) Tn[i] += q[i] * dt / (rho * cap[ix(Tn[i])] * vol[i]);
      t += dt;
      if (t >= next) { let sc = 0; for (let i = s0; i < N; i++) sc += Tn[i] * vol[i]; curve[nc * 4] = t / 60; curve[nc * 4 + 1] = sc / scoopV; curve[nc * 4 + 2] = Tn[0]; curve[nc * 4 + 3] = Tn[N - 1]; nc++; next += o.step; }
    }
    return { nc, curve };
  }
  const out = [];
  for (const c of cases) {
    const o = c.o, js = () => E.heatSim(m, { ml: o.ml, N: o.N, T0: o.T0, Tamb: () => o.Ta, h: o.h, tMax: o.tMax, step: o.step, dtMax: o.dtMax });
    const ref = js(); const tab = m._ptab; const NT = tab.cap.length;
    const cp = X.p_cap() / 8, kp = X.p_kk() / 8; let M = mem(); M.set(tab.cap, cp); M.set(tab.kk, kp);
    const rho = E.clamp(m.gPerL || 800, 350, 1150), V = E.clamp(o.ml, 100, 5000) / 1e6, r = Math.cbrt(V / (2 * Math.PI));
    const wa = () => X.run(o.N, r, rho, o.h, o.T0, o.Ta, o.tMax, o.step, o.dtMax, -45, .25, NT, .015);
    const nc = wa(); M = mem(); const cv = X.p_curve() / 8;
    let maxd = 0; const n = Math.min(nc, ref.curve.length);
    for (let k = 0; k < n; k++) { const a = ref.curve[k]; maxd = Math.max(maxd, Math.abs(a.scoop - M[cv + k * 4 + 1]), Math.abs(a.core - M[cv + k * 4 + 2])); }
    const time = f => { for (let k = 0; k < 5; k++) f(); let inner = 1; for (;;) { const t = now(); for (let j = 0; j < inner; j++) f(); if (now() - t >= 20 || inner >= 4096) break; inner *= 2; } const ts = []; for (let k = 0; k < reps; k++) { const t = now(); for (let j = 0; j < inner; j++) f(); ts.push((now() - t) / inner); } ts.sort((x, y) => x - y); return ts[Math.floor(ts.length / 2)]; };
    const F = jsFast(o, tab, rho, r); let maxf = 0; for (let k = 0; k < Math.min(F.nc, ref.curve.length); k++) { const a = ref.curve[k]; maxf = Math.max(maxf, Math.abs(a.scoop - F.curve[k * 4 + 1]), Math.abs(a.core - F.curve[k * 4 + 2])); }
    const tj = time(js), tw = time(wa), tf = time(() => jsFast(o, tab, rho, r));
    out.push({ id: c.id, n: c.n, js: tj, jsOtim: tf, wasm: tw, ganho: tj / tw, ganhoOtim: tf / tw, difOtim: maxf, pontos: n, pontosJS: ref.curve.length, pontosWasm: nc, difMax: maxd });
  }
  return { wasmBytes: bytes.byteLength, casos: out };
}
if (typeof module !== 'undefined') module.exports = { wasmCompare };
