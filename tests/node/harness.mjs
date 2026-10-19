/* Il Fredolin · harness de testes em Node (v18-auditoria).
   Extrai módulos do index.html pelos marcadores "/* ==== NN-nome.js ==== *\/" e os executa num contexto isolado.
   Não há cópia do código: o teste roda exatamente o que o app publica. */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const readApp = (file = 'index.html') => fs.readFileSync(path.join(ROOT, file), 'utf8');
export function segment(html, fromMarker, toMarker) {
  const a = html.indexOf(`/* ==== ${fromMarker} ==== */`);
  const b = toMarker ? html.indexOf(`/* ==== ${toMarker} ==== */`) : html.lastIndexOf('</script>');
  if (a < 0 || b < 0 || b <= a) throw new Error(`marcadores não encontrados: ${fromMarker} → ${toMarker}`);
  return html.slice(a, b);
}
export function baseContext(extra = {}) {
  const ctx = { console, Math, Date, JSON, Set, Map, Intl, Object, Array, Number, String, Boolean, RegExp, Error, Symbol, Promise,
    isFinite, isNaN, parseFloat, parseInt, Infinity, NaN, setTimeout, clearTimeout, setInterval, clearInterval,
    encodeURIComponent, decodeURIComponent, Float64Array, Uint8Array, performance: globalThis.performance, ...extra };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  return vm.createContext(ctx);
}
/** Motor científico (01-util → 35-tests): o mesmo trecho que o app manda ao Web Worker. */
export function loadEngine(html = readApp()) {
  const ctx = baseContext();
  const src = segment(html, '01-util.js', '38-mode.js');
  vm.runInContext(src + `\n;globalThis.__E={fpdSE,fpdNorrish,seFromFpd,frozenPct,tempForFrozen,seRequired,analyze,analyzeRaw,heatSim,
    hardenModel,poteModel,fitCalibration,uncertainty,runTests,testRecipes,stTest,CAL,PRESETS,MASTERS,ING,ING_BY,
    coreAt,fitH,H_FREEZER,lgam,phaseAt,phaseProfile,crystalDist,crystalAging,MICRO_REF,CRYST_CV,parseRheo,rheoFit,rheoMeasured,VAL_Q,SENS_ATTR,SENS_METHODS,ciMean,tCrit,binomUpper,triMin,fP,chiP,triAnalyze,anova2,friedman,penalty,tdsCurves,pearson,sensBridge,clamp,heatSim,benchRun,BENCH_OPS,benchVerdict,cycleTwin,twinRows,coolStage,coolAt,coolTimeTo,storeResponse,storeResponseSim,thermProps,potTau,probeFit,COOL_MODE,COOL_VESSEL,maqPlan,fitCalibration,PROF,diagnose,balance,generate,genDef,genVars,genFrontier,paretoFront,FRONT_CRIT,NKB,NREF,NSYN,NKB_TOPICS,NCOMP,blendSyn,blendObserved,blendNonNat,analyzeBlend,NEUTRO_PRESETS,poteModel,hardenModel,poteReady,quenelleModel,validateLOO,VAL_Q,PROC0,ingProv,recipeProv,ING_REF,uncertainty,uncertaintyMC,uncCoverage,ING_BY:ING_BY,invStock,invEntries,consumeFIFO,measurePlan,doeDesign,doeRecipe,doeAnalyze,tP2,setHardN:n=>{HARD_N=n;}};`, ctx, { filename: 'index.html#engine' });
  return ctx.__E;
}
/** localStorage em memória; quotaBytes simula a cota do Safari. */
export function memStorage(quotaBytes = Infinity) {
  const m = new Map();
  const size = () => [...m].reduce((a, [k, v]) => a + k.length + v.length, 0);
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem(k, v) { const prev = m.get(k); m.set(k, String(v)); if (size() > quotaBytes) { if (prev == null) m.delete(k); else m.set(k, prev);
      const e = new Error('The quota has been exceeded.'); e.name = 'QuotaExceededError'; throw e; } },
    removeItem: k => m.delete(k), _map: m,
  };
}
/** Nuvem da equipe (62-supabase) com dependências mínimas simuladas. */
export function loadSync(html = readApp(), { quotaBytes } = {}) {
  const toasts = [];
  const ctx = baseContext({ localStorage: memStorage(quotaBytes), navigator: { onLine: true }, document: { hidden: false, addEventListener() {} },
    addEventListener() {}, location: { origin: 'https://x', pathname: '/' }, atob: s => Buffer.from(s, 'base64').toString('binary'), escape, unescape });
  const lsDecl = html.match(/const LS=\{[\s\S]*?\n?   return false;\}\}\};|const LS=\{get\(k\)[^\n]*\};/);
  if (!lsDecl) throw new Error('declaração de LS não encontrada');
  const stubs = `${lsDecl[0]}
    const plain=r=>JSON.parse(JSON.stringify(r));let ROLE='maestro';let ME={uid:'u1',ws:'w1',email:'a@b.c'};
    const COLS={lib:{get:()=>[],set(){}},lots:{get:()=>[],set(){}}};const STORE={setStatus(){},saveLocal(){},after(){}};
    const MASTERS=[];const APPEV={emit(){},on(){}};function masterDexFix(){}function render(){}function safeRec(r){return r;}function libConflict(){return false;}function conflictCopy(r){return r;}
    function toast(t){__toasts.push(t);}const AUTH={lost(){}};`;
  ctx.__toasts = toasts;
  vm.runInContext(stubs + '\n' + segment(html, '62-supabase.js', '66-team.js') + `\n;globalThis.__S={SUPA_BACKEND,LS,SB};`, ctx, { filename: 'index.html#sync' });
  return { ...ctx.__S, toasts, storage: ctx.localStorage };
}
/** Erro no formato que SB.req lança. */
export const httpErr = (status, msg = 'HTTP ' + status) => Object.assign(new Error(msg), { status, raw: msg });
export const offlineErr = () => Object.assign(new Error('Sem conexão com a internet.'), { offline: true });

/** Backup (60b-backup): plano de restauração. safeList simplificado (a limpeza real de receitas é coberta no E2E). */
export function loadBackup(html = readApp()) {
  const ctx = baseContext();
  vm.runInContext(`const safeList=a=>(Array.isArray(a)?a:[]).filter(r=>r&&typeof r==='object'&&r.id!=null);\n` + segment(html, '60b-backup.js', '61-sets.js') +
    `\n;globalThis.__B={planImport,backupPayload,BACKUP_COLS};`, ctx, { filename: 'index.html#backup' });
  return ctx.__B;
}
/** Perfis (39-roles): o que cada perfil pode acionar. */
export function loadRoles(html = readApp(), role = 'maestro') {
  const ctx = baseContext();
  vm.runInContext(segment(html, '39-roles.js', '40-ui-core.js') + `\n;ROLE=${JSON.stringify(role)};globalThis.__R={can};`, ctx, { filename: 'index.html#roles' });
  return ctx.__R;
}
