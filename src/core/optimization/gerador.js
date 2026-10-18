/* ===================== GERADOR POR ALVO (LAB) =====================
   Resolve a base para atingir massa, gordura, MSNF, doçura, congelamento e sólidos ao mesmo tempo. */
function gauss(A,b){const n=A.length;const M=A.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;if(Math.abs(M[p][c])<1e-10)return null;[M[c],M[p]]=[M[p],M[c]];
  for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}
 return M.map((r,i)=>r[n]/r[i]);}
function contrib(id,st){const i=ING_BY[id];const c=compOf(i,st&&st.brix||{});let pac=0,pod=0;for(const f in PACK)pac+=(c[f]||0)*PACK[f]/100;for(const f in PODK)pod+=(c[f]||0)*PODK[f]/100;if(c.gs){pac+=c.gs*1.9*(i.de||20)/100;pod+=c.gs*.9*(i.de||20)/100;}
 const msnf=i.msnf!=null?i.msnf:(i.dairy?(c.lac||0)+(c.prot||0)+(c.ash||0):0);
 return{w:(c.w||0)/100,fat:(c.fat||0)/100,msnf:msnf/100,pac:pac/100,pod:pod/100,sol:(100-(c.w||0)-(c.alc||0))/100,hf:(HFK.B*(i.hfB||0)+HFK.S*(i.hfS||0)+HFK.N*(i.hfN||0))/100};}
/* mínimos quadrados não negativos (Lawson–Hanson): min ‖Ax − b‖ com x ≥ 0 */
function nnls(A,b){const n=A[0].length;const x=new Array(n).fill(0);const P=new Set();
 const resid=()=>b.map((bi,i)=>bi-A[i].reduce((s,a,j)=>s+a*x[j],0));
 const grad=()=>{const r=resid();return Array.from({length:n},(_,j)=>A.reduce((s,row,i)=>s+row[j]*r[i],0));};
 const lsq=idx=>{const N=idx.map(j=>idx.map(k=>A.reduce((s,row)=>s+row[j]*row[k],0)+(j===k?1e-12:0)));const y=idx.map(j=>A.reduce((s,row,i)=>s+row[j]*b[i],0));return gauss(N,y);};
 for(let outer=0;outer<4*n;outer++){const w=grad();let t=-1,best=1e-9;for(let j=0;j<n;j++)if(!P.has(j)&&w[j]>best){best=w[j];t=j;}if(t<0)break;P.add(t);
  for(let inner=0;inner<4*n;inner++){const idx=[...P];const z=lsq(idx);if(!z){P.delete(t);break;}
   if(z.every(v=>v>1e-12)){idx.forEach((j,k)=>x[j]=z[k]);break;}
   let alpha=1;idx.forEach((j,k)=>{if(z[k]<=1e-12){const a=x[j]/(x[j]-z[k]);if(a<alpha)alpha=a;}});
   idx.forEach((j,k)=>{x[j]+=alpha*(z[k]-x[j]);});idx.forEach(j=>{if(x[j]<=1e-9){x[j]=0;P.delete(j);}});}}
 return x;}
/* GERADOR POR ALVO
   Resolve as gramas dos ingredientes de base por mínimos quadrados ponderados com gramas ≥ 0:
   massa e congelamento (PAC exigido pela vitrine) são praticamente rígidos; doçura, gordura, MSNF e sólidos
   são metas ponderadas. Nunca "desiste": devolve a receita viável mais próxima e diz quais metas cedeu e quanto. */
const GEN_VARS={crema:['leite','creme35','lpd','sacarose','dextrose'],frutta:['leite','creme35','lpd','sacarose','dextrose'],gastro:['leite','creme35','lpd','dextrose'],semacucar:['leite','creme35','lpd','alulose','fibramilho','sucralose'],sorbetto:['agua','sacarose','dextrose','malto'],vegan:['agua','cococreme','sacarose','dextrose','malto']};
const GEN_TOL={fat:.6,msnf:.6,pod:1,sol:1.2};
/* v18.4 · famílias: ingredientes-base próprios onde a base muda (água, iogurte, leite de cabra, creme e gema);
   as demais usam os do comportamento-base (tbase). Metas padrão = meio das faixas da família. */
Object.assign(GEN_VARS,{granita:['agua','sacarose','dextrose'],paleta_fruta:['agua','sacarose','dextrose','malto'],froyo:['iogurte','leite','lpd','sacarose','dextrose'],
 dondurma:['cabra','creme35','lpd','sacarose','dextrose'],semifreddo:['creme35','leite','lpd','sacarose','dextrose'],kulfi:['leite','creme35','lpd','sacarose','dextrose']});
const genVars=t=>GEN_VARS[t]||GEN_VARS[tbase(t)]||GEN_VARS.crema;
/* sólidos são meta nas bases sem leite e no sem açúcar (o corpo vem da fibra, não do leite); nas lácteas resultam das outras metas */
const genSolTgt=t=>!genVars(t).includes('lpd')||tbase(t)==='semacucar';
/* v18.10 · metas padrão do gerador (antes junto das bases de referência, na camada de produto) */
const GEN_DEF={crema:{fat:8,msnf:9.5,pod:18,sol:38},frutta:{fat:3,msnf:6,pod:21,sol:35},gastro:{fat:9,msnf:9,pod:6,sol:34},semacucar:{fat:9,msnf:9,pod:16,sol:34},sorbetto:{fat:0,msnf:0,pod:25,sol:31},vegan:{fat:8,msnf:0,pod:18.5,sol:37}};
const genDef=t=>{if(GEN_DEF[t])return GEN_DEF[t];const P=PROF[t]||PROF.crema,mid=r=>Math.round((r[0]+r[1])/2*2)/2;return{fat:mid(P.fat),msnf:mid(P.msnf),pod:mid(P.pod),sol:mid(P.sol)};};
function generate(o){
 const P=PROF[o.tipo]||PROF.crema,B=+o.batch||1000,VARS=genVars(o.tipo).map(id=>id==='dextrose'&&DEX_FORM()!=='anid'?'dextrosem':id),proc=o.proc||{};
 const fixed=[];(o.fixed||[]).forEach(f=>{if(!f.id||!ING_BY[f.id]||!(+f.g>0))return;const e=fixed.find(x=>x.id===f.id);if(e)e.g+=+f.g;else fixed.push({id:f.id,g:+f.g});});
 if(o.stabId&&ING_BY[o.stabId]&&+o.stabGkg>0)fixed.push({id:o.stabId,g:B*o.stabGkg/1000});
 /* custard: a gema mínima da definição (sólidos ≈ 47,5% da gema fresca) entra fixa, com 5% de folga */
 if(P.yolkSolMin&&!fixed.some(f=>ING_BY[f.id]&&ING_BY[f.id].yolk))fixed.push({id:'gema',g:Math.round(B*P.yolkSolMin/.475/100*1.05)});
 /* frozen yogurt: iogurte mínimo da família (SDSU: de cultura sem incubação até 15–20% de iogurte na mistura) */
 if(P.yogMin&&!fixed.some(f=>/iogurt|grego|kefir/.test(f.id)))fixed.push({id:'iogurte',g:Math.round(B*P.yogMin/100)});
 /* sem açúcar: eritritol fixo em 4,5% (acima de ~5–6% recristaliza a frio, regra do próprio laudo); alulose e fibra de milho completam PAC e corpo.
    Até a v18.5 o gerador usava eritritol + inulina livres e chegava a ~16% de inulina (≈ 14 g por porção) */
 if(tbase(o.tipo)==='semacucar'&&!fixed.some(f=>f.id==='eritritol'))fixed.push({id:'eritritol',g:Math.round(B*.045)});
 const F0={w:0,fat:0,msnf:0,pac:0,pod:0,sol:0,hf:0,mass:0};fixed.forEach(f=>{const c=contrib(f.id);F0.mass+=f.g;for(const k in c)F0[k]+=c[k]*f.g;});
 if(F0.mass>=B*.98)return{ok:false,msg:'Os ingredientes fixos já somam o lote inteiro; aumente o lote ou reduza o sabor.'};
 const C=VARS.map(id=>contrib(id));const fzT=(P.fz[0]+P.fz[1])/2;const dairy=VARS.includes('lpd'),solTgt=genSolTgt(o.tipo);
 /* pesos: rígidas ≫ metas; a prioridade das metas depende do tipo */
 const tgt={pod:+o.pod,fat:+o.fat,msnf:+o.msnf,sol:+o.sol};
 /* nas bases lácteas os sólidos resultam das outras metas: só entram na conta se saírem da faixa do perfil (2ª passada) */
 const solve=(W,solT)=>{let S=0,x=null,m;
  for(let it=0;it<12;it++){const se=seRequired(+o.vit,fzT,S)/100;
   const rows=[],rhs=[];const add=(k,coef,b,scale)=>{if(!(W[k]>0))return;const w=Math.sqrt(W[k])/scale;rows.push(coef.map(v=>v*w));rhs.push(b*w);};
   add('mass',C.map(()=>1),B-F0.mass,B*.01);
   add('pac',C.map(c=>c.pac-c.hf-se*c.w),se*F0.w-(F0.pac-F0.hf),B*.01);
   ['pod','fat','msnf','sol'].forEach(k=>{const t=k==='sol'?solT:tgt[k];if(!isFinite(t))return;if(k==='fat'&&!C.some(c=>c.fat>.05))return;if(k==='msnf'&&!dairy)return;add(k,C.map(c=>c[k]),t/100*B-F0[k],B*.01);});
   x=nnls(rows,rhs);
   m=analyze({tipo:o.tipo,vit:o.vit,recipe:fixed.concat(VARS.map((id,i)=>({id,g:x[i]})).filter(r=>r.g>.05)),proc,brix:{}});
   if(Math.abs(m.S-S)<2e-3)break;S=m.S;}
  /* edulcorante de alta intensidade (POD > 300× a sacarose) entra em centésimos de grama: o corte de 0,3 g o apagaria */
  const hi=id=>C[VARS.indexOf(id)]&&C[VARS.indexOf(id)].pod>3;
  const rec=fixed.concat(VARS.map((id,i)=>({id,g:x[i]}))).filter(r=>r.g>=.3||(hi(r.id)&&r.g>=.01)).map(r=>({id:r.id,g:hi(r.id)?Math.round(r.g*100)/100:Math.round(r.g*10)/10}));
  return{rec,m:analyze({tipo:o.tipo,vit:o.vit,recipe:rec,proc,brix:{}})};};
 const W={mass:1e4,pac:3e3,pod:tbase(o.tipo)==='gastro'?.6:4,fat:3,msnf:2.5,sol:solTgt?1.2:0};
 let r=solve(W,tgt.sol);
 if(!solTgt){const rg=r.m.P.sol;if(r.m.sol>rg[1]+.5||r.m.sol<rg[0]-.5)r=solve({...W,sol:.8},r.m.sol>rg[1]?rg[1]:rg[0]);}
 const recR=r.rec,m=r.m;
 if(Math.abs(m.fzVit-m.fzMid)>3.2)return{ok:false,msg:'Com esses ingredientes fixos não é possível chegar ao congelamento certo a '+f1(+o.vit)+' °C (fica '+f0(m.fzVit)+'% de água congelada, alvo '+fRg(P.fz)+'%). Reduza o sabor que mais pesa no PAC (álcool, sal, açúcares do sabor) ou mude a vitrine.'};
 const dropped=[],miss={};['pod','fat','msnf','sol'].forEach(k=>{if(!isFinite(tgt[k]))return;if(k==='msnf'&&!dairy)return;
  /* base láctea: sólidos não são meta, mas sair da faixa da família também é aviso (ex.: muita pasta de fruto seco) */
  if(k==='sol'&&!solTgt){const rg=P.sol;if(m.sol>rg[1]+GEN_TOL.sol||m.sol<rg[0]-GEN_TOL.sol){dropped.push(k);miss[k]=m.sol;}return;}
  const got=m[k];if(Math.abs(got-tgt[k])>GEN_TOL[k]){dropped.push(k);miss[k]=got;}});
 return{ok:true,recipe:recR,dropped,miss,m};}
