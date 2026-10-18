/* ===================== BALANCEADOR DE AÇÚCARES =====================
   Resolve sacarose (S), dextrose (D) e maltodextrina DE19 (M) para atingir ao mesmo tempo:
   congelamento-alvo na vitrine, POD-alvo e sólidos-alvo. Sistema linear 3×3 iterado. */
function solve3(a,b){const d=x=>x[0][0]*(x[1][1]*x[2][2]-x[1][2]*x[2][1])-x[0][1]*(x[1][0]*x[2][2]-x[1][2]*x[2][0])+x[0][2]*(x[1][0]*x[2][1]-x[1][1]*x[2][0]);
 const D=d(a);if(Math.abs(D)<1e-9)return null;return[0,1,2].map(i=>{const c=a.map((r,k)=>r.map((v,j)=>j===i?b[k]:v));return d(c)/D;});}
function solve2(a,b){const D=a[0][0]*a[1][1]-a[0][1]*a[1][0];if(Math.abs(D)<1e-9)return null;return[(b[0]*a[1][1]-a[0][1]*b[1])/D,(a[0][0]*b[1]-b[0]*a[1][0])/D];}
function balanceExact(st){
 const P=PROF[st.tipo];if(!P||tbase(st.tipo)==='gastro'||tbase(st.tipo)==='semacucar')return{ok:false,msg:'O balanceador automático trabalha com açúcares convencionais (crema, frutta, sorbetto e vegano).'};
 const dexId=dexPref(st);
 const ctrl=['sacarose',dexId,'malto'];
 const rest={...st,recipe:(st.recipe||[]).filter(r=>!ctrl.includes(r.id))};
 const m0=analyze(rest);if(m0.empty)return{ok:false,msg:'Adicione a base da receita primeiro.'};
 const dx=ING_BY[dexId].c,mx=ING_BY.malto.c;
 const pS=99.9,pD=dx.glu*1.9,pM=mx.gs*1.9*19/100;
 const oS=99.9,oD=dx.glu*.7,oM=mx.gs*.9*19/100;
 const sS=.999,sD=dx.glu/100,sM=mx.gs/100,wD=dx.w/100,wM=mx.w/100;
 const R=m0.A.tot,W0=m0.A.w,PAC0=m0.A.pac-m0.hfAbs,POD0=m0.A.pod,SOL0=R-W0-m0.A.alc;
 const mc=analyze(st),Pp=mc.P;const podT=(Pp.pod[0]+Pp.pod[1])/2/100,solT=clamp(mc.sol,Pp.sol[0]+.5,Pp.sol[1]-.5)/100,fzT=(Pp.fz[0]+Pp.fz[1])/2;
 let x=[0,0,0],mode='3';
 let S=m0.S;
 for(let it=0;it<6;it++){
  const se=seRequired(+st.vit,fzT,S)/100;
  // PAC: pS S + pD D + pM M - se*(wD D + wM M) = se*W0 - PAC0   (pac por 100 g de ingrediente → /100)
  const r1=[pS/100,pD/100-se*wD,pM/100-se*wM],b1=se*W0-PAC0;
  const r2=[oS/100-podT,oD/100-podT,oM/100-podT],b2=podT*R-POD0;
  const r3=[sS-solT,sD-solT,sM-solT],b3=solT*R-SOL0;
  let s=solve3([r1,r2,r3],[b1,b2,b3]);mode='3';
  if(!s||s.some(v=>v<-.5)){const t=solve2([r1.slice(0,2),r2.slice(0,2)],[b1,b2]);s=t?[t[0],t[1],0]:null;mode='2';}
  if(!s||s.some(v=>v<-.5)){const t=solve2([r1.slice(0,2),r3.slice(0,2)],[b1,b3]);s=t?[t[0],t[1],0]:null;mode='2s';}
  if(!s||s.some(v=>v<-.5))return{ok:false,msg:'Não há combinação de sacarose, dextrose e maltodextrina que atinja os três alvos com a base atual. Ajuste primeiro a base (água, gordura, sólidos) ou a temperatura da vitrine.'};
  x=s.map(v=>Math.max(0,v));
  const W=W0+wD*x[1]+wM*x[2],ms=(m0.A.msnf)/(R+x[0]+x[1]+x[2])*100,wp=W/(R+x[0]+x[1]+x[2])*100;S=wp>0?2.37*ms/wp:0;
 }
 const prop=[{id:'sacarose',g:x[0]},{id:dexId,g:x[1]},{id:'malto',g:x[2]}];
 const cur=ctrl.map(id=>{const r=(st.recipe||[]).find(q=>q.id===id);return r?+r.g:0;});
 const newRecipe=(st.recipe||[]).filter(r=>!ctrl.includes(r.id)).concat(prop.filter(p=>p.g>=.5).map(p=>({id:p.id,g:Math.round(p.g*10)/10})));
 const m1=analyze({...st,recipe:newRecipe});
 return{ok:true,mode,prop,cur,ctrl,newRecipe,m1};
}

/* Balanceador: tenta a solução exata com três açúcares; se ela não existe (ou deixa a doçura fora da faixa),
   busca o melhor compromisso com sacarose, dextrose, maltodextrina e o líquido da base, sempre com o congelamento
   na temperatura de serviço como prioridade, e termina com um ajuste fino iterativo até o congelamento bater. */
function balance(st){const ex=balanceExact(st);
 if(ex.ok&&ex.mode!=='2s')return ex;
 const P=PROF[st.tipo];if(!P||tbase(st.tipo)==='gastro'||tbase(st.tipo)==='semacucar')return ex;
 const rb=balanceRobust(st);if(!rb.ok)return ex.ok?ex:rb;
 if(ex.ok){const sc=b=>Math.abs(b.m1.fzVit-b.m1.fzMid)*10+(b.mode==='aprox'?(b.prop[b.prop.length-1].g-b.cur[b.cur.length-1])/Math.max(1,b.m1.tot)*12:0)+Math.max(0,b.m1.P.pod[0]-b.m1.pod,b.m1.pod-b.m1.P.pod[1])+Math.max(0,b.m1.P.sol[0]-b.m1.sol,b.m1.sol-b.m1.P.sol[1])*.5;return sc(rb)<sc(ex)-.05?rb:ex;}
 return rb;}
const BAL_SUG=new Set(['glicose38','glicose60','xarope40','invertido','frutose','trealose','dextrose','dextrosem']);
const _COEF=new Map();
function ingCoef(id,st){const key=id+'|'+((st.brix||{})[id]||'')+'|'+ING_VER;if(_COEF.has(key))return _COEF.get(key);
 const m=analyzeRaw({tipo:st.tipo,vit:-13,recipe:[{id,g:100}],proc:Object.assign({},st.proc,{lossPct:0}),brix:st.brix||{},costs:{}});const A=m.A;
 const c={pac:(A.pac-m.hfAbs)/100,pod:A.pod/100,sol:(A.tot-A.w-A.alc)/100,w:A.w/100,msnf:A.msnf/100};_COEF.set(key,c);if(_COEF.size>300)_COEF.delete(_COEF.keys().next().value);return c;}
/* mínimos quadrados ponderados com variáveis ≥ 0 (enumera os conjuntos ativos: no máximo 4 variáveis) */
function nnlsSmall(cols,b,w){const n=cols.length,m=b.length;let best=null;
 const cost=x=>{let c=0;for(let r=0;r<m;r++){let v=-b[r];for(let j=0;j<n;j++)v+=cols[j][r]*x[j];c+=w[r]*w[r]*v*v;}return c;};
 const zero=new Array(n).fill(0);best={x:zero,c:cost(zero)};
 for(let mask=1;mask<(1<<n);mask++){const idx=[];for(let j=0;j<n;j++)if(mask&(1<<j))idx.push(j);if(idx.length>m)continue;const k=idx.length;
  const M=[],v=[];for(let a=0;a<k;a++){M.push([]);let s=0;for(let r=0;r<m;r++)s+=w[r]*w[r]*cols[idx[a]][r]*b[r];v.push(s);for(let c=0;c<k;c++){let t=0;for(let r=0;r<m;r++)t+=w[r]*w[r]*cols[idx[a]][r]*cols[idx[c]][r];M[a].push(t);}}
  const sol=gaussSolve(M,v);if(!sol||sol.some(q=>q<-1e-9||!isFinite(q)))continue;const x=new Array(n).fill(0);idx.forEach((j,a)=>x[j]=Math.max(0,sol[a]));const c=cost(x);if(c<best.c-1e-12)best={x,c};}
 return best.x;}
function gaussSolve(M,v){const n=v.length,A=M.map((r,i)=>[...r,v[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;if(Math.abs(A[p][c])<1e-12)return null;[A[c],A[p]]=[A[p],A[c]];
  for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c]/A[c][c];for(let k=c;k<=n;k++)A[r][k]-=f*A[c][k];}}return A.map((r,i)=>r[n]/r[i]);}
function balanceRobust(st){
 const dexId=dexPref(st);
 /* açúcares estruturais que a receita já usa também podem subir ou descer */
 const sug=[...new Set(['sacarose',dexId,'malto',...(st.recipe||[]).map(r=>r.id).filter(id=>BAL_SUG.has(id))])];const D=sug.length;
 /* líquido da base para diluir quando a receita já tem anticongelante demais */
 const liq=(st.recipe||[]).filter(r=>ING_BY[r.id]&&!sug.includes(r.id)&&(ING_BY[r.id].c.w||0)>=85&&!(ING_BY[r.id].c.alc>0)).sort((a,b)=>b.g-a.g)[0];
 const dil=liq?liq.id:(tbase(st.tipo)==='crema'?'leite':'agua');
 const ctrl=[...sug,dil];
 const rest={...st,recipe:(st.recipe||[]).filter(r=>!sug.includes(r.id))};const m0=analyze(rest);if(m0.empty)return{ok:false,msg:'Adicione a base da receita primeiro.'};
 const mc=analyze(st),Pp=mc.P;const podT=(Pp.pod[0]+Pp.pod[1])/2/100,solT=clamp(mc.sol,Pp.sol[0]+.5,Pp.sol[1]-.5)/100,fzT=(Pp.fz[0]+Pp.fz[1])/2;
 const C=ctrl.map(id=>ingCoef(id,st));const R=m0.A.tot,W0=m0.A.w,PAC0=m0.A.pac-m0.hfAbs,POD0=m0.A.pod,SOL0=R-W0-m0.A.alc;
 let x=new Array(D+1).fill(0),Sx=m0.S;
 for(let it=0;it<8;it++){const se=seRequired(+st.vit,fzT,Sx)/100;
  const cols=C.map(c=>[(c.pac-se*c.w)/R,(c.pod-podT)/R,(c.sol-solT)/R]);const b=[(se*W0-PAC0)/R,(podT*R-POD0)/R,(solT*R-SOL0)/R];
  cols.forEach((c,j)=>c.push(j===D?1/R:0));b.push(0);
  x=nnlsSmall(cols,b,[40,3,1,2.5]);
  const tot=R+x.reduce((a,v)=>a+v,0),W=W0+x.reduce((a,v,j)=>a+v*C[j].w,0),ms=(m0.A.msnf+x.reduce((a,v,j)=>a+v*C[j].msnf,0))/tot*100,wp=W/tot*100;Sx=wp>0?2.37*ms/wp:0;}
 const base=(st.recipe||[]).filter(r=>!sug.includes(r.id)&&r.id!==dil);const dil0=((st.recipe||[]).find(r=>r.id===dil)||{g:0}).g;
 const build=xx=>base.concat(sug.map((id,j)=>({id,g:Math.round(xx[j]*10)/10})).filter(r=>r.g>=.5)).concat(dil0+xx[D]>=.5?[{id:dil,g:Math.round((+dil0+xx[D])*10)/10}]:[]);
 /* ajuste fino: secante sobre a dextrose (ou sacarose/líquido) até o congelamento bater na faixa central */
 const k=x[1]>.5?1:x[0]>.5?0:x[D]>.5?D:1;const fzOf=g=>{const y=x.slice();y[k]=Math.max(0,g);return analyze({...st,recipe:build(y)}).fzVit-fzT;};
 let g0=x[k],q0=fzOf(g0),g1=g0+(k===D?20:10)*(q0>0?1:-1),q1=fzOf(g1);
 for(let i=0;i<12&&Math.abs(q1)>.02;i++){if(Math.abs(q1-q0)<1e-9)break;const g2=Math.max(0,g1-q1*(g1-g0)/(q1-q0));g0=g1;q0=q1;g1=g2;q1=fzOf(g1);}
 if(Math.abs(q1)<Math.abs(fzOf(x[k])))x[k]=Math.max(0,g1);
 const newRecipe=build(x);const m1=analyze({...st,recipe:newRecipe});
 if(Math.abs(m1.fzVit-m1.fzMid)>3)return{ok:false,msg:'Nem com sacarose, dextrose, maltodextrina e diluição a receita chega ao ponto a '+fT(+st.vit)+' °C ('+f0(m1.fzVit)+'% de água congelada). A base já tem '+(m1.fzVit<m1.fzMid?'anticongelante demais (álcool, frutose, sal): reduza esses itens.':'pouco anticongelante para essa temperatura: use eritritol, açúcar invertido ou um pouco de álcool.')};
 const notes=[];if(m1.pod>Pp.pod[1]+.3)notes.push('a doçura ficou em '+f1(m1.pod)+'% (faixa '+fRg(Pp.pod)+'%) para segurar o congelamento a '+fT(+st.vit)+' °C');
 if(m1.pod<Pp.pod[0]-.3)notes.push('a doçura ficou em '+f1(m1.pod)+'% (faixa '+fRg(Pp.pod)+'%): a receita já traz muito anticongelante');
 if(m1.sol<Pp.sol[0]-.3||m1.sol>Pp.sol[1]+.3)notes.push('sólidos em '+f1(m1.sol)+'% (faixa '+fRg(Pp.sol)+'%)');
 if(x[D]>=.5)notes.push('entram '+f0(x[D])+' g de '+ING_BY[dil].n.toLowerCase()+' para diluir');
 const prop=ctrl.map((id,j)=>({id,g:j===D?+dil0+x[D]:x[j]}));const cur=ctrl.map(id=>{const r=(st.recipe||[]).find(q=>q.id===id);return r?+r.g:0;});
 return{ok:true,mode:'aprox',prop,cur,ctrl,newRecipe,m1,note:notes.length?'Congelamento no ponto; '+notes.join('; ')+'.':''};}

