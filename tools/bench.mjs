#!/usr/bin/env node
/* Il Fredolin · bateria de desempenho do motor no Node (a mesma do app: product/desempenho.js).
   Uso: node tools/bench.mjs [--json] [--scale 0.5] */
import os from 'node:os';
import { loadEngine } from '../tests/node/harness.mjs';
const E = loadEngine();
const i = process.argv.indexOf('--scale'); const scale = i > 0 ? +process.argv[i + 1] : 1;
const mem0 = process.memoryUsage().heapUsed;
const r = E.benchRun({ scale });
const out = { env: `Node ${process.version} · ${os.cpus()[0].model} · ${os.cpus().length} núcleos`, heapMB: Math.round((process.memoryUsage().heapUsed - mem0) / 1e5) / 10, ...JSON.parse(JSON.stringify(r)) };
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }
console.log(out.env);
for (const o of out.ops) console.log(`${o.id.padEnd(14)} ${o.cls.padEnd(7)} mediana ${o.med.toFixed(1).padStart(7)} ms  (min ${o.min.toFixed(1)}, máx ${o.max.toFixed(1)}, n=${o.reps})  orçamento ${o.budget} ms`);
console.log(`total ${Math.round(out.totalMs)} ms`);
