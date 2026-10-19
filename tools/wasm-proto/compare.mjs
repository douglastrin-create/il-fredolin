import fs from 'node:fs'; import { createRequire } from 'node:module';
import { loadEngine } from '../../tests/node/harness.mjs';
const require = createRequire(import.meta.url); const { wasmCompare } = require('./compare.js');
const E = loadEngine(); E.CAL.on = false;
const r = await wasmCompare(E, fs.readFileSync(new URL('./heat.wasm', import.meta.url)), 9);
if (process.argv.includes('--json')) console.log(JSON.stringify(r)); else for (const c of r.casos) console.log(`${c.id.padEnd(14)} JS ${c.js.toFixed(2)} ms · JS otimizado ${c.jsOtim.toFixed(2)} ms (dif ${c.difOtim.toExponential(1)}) · wasm ${c.wasm.toFixed(2)} ms · wasm ${c.ganho.toFixed(1)}× o atual, ${c.ganhoOtim.toFixed(2)}× o otimizado · pontos ${c.pontosJS}/${c.pontosWasm} · dif. máx ${c.difMax.toExponential(2)} °C`);
