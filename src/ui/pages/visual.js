/* ===================== LABORATÓRIO VISUAL (v18.17 · §36–39) =====================
   Câmara térmica: mapa de calor e corte do pote calculados pelo modelo de condução (core/heat-transfer/camara.js).
   Microscópio: volume de 400 µm de lado montado a partir das frações de volume (balanço) e da distribuição de
   cristais (hipotética). Cada fase declara o tipo de representação (§36):
     modelada     — geometria gerada a partir de hipóteses e parâmetros do motor;
     ilustrativa  — geometria didática, sem tamanho estimado;
     experimental — só quando houver medição (aqui: média e CV de cristais medidos ao microscópio num lote).
   Tudo é calculado quando a página abre (sob demanda) e desenhado em SVG ou canvas 2D, sem biblioteca externa:
   funciona offline e em qualquer navegador; não há animação, só o que o usuário pede. */
const VIS_SEC=[['camara','Câmara térmica'],['microscopio','Microscópio virtual']];
const VESSEL_OPTS=[['','Sem parede (modelo do app)'],...Object.entries(COOL_VESSEL).map(([k,v])=>[k,v.n])];
function visState(){U.vis=U.vis||{};const v=U.vis;v.mode=v.mode||'hard';if(v.ml==null)v.ml=+(S.proc.poteMl||500);if(v.vessel==null)v.vessel='';if(v.ti==null)v.ti=-1;if(v.Tamb==null)v.Tamb='';return v;}
function chamberCached(m){const v=visState();const key=JSON.stringify([S.tipo,S.vit,S.recipe,S.proc,v.mode,v.ml,v.vessel,v.Tamb,CAL.ver]);if(U.chamber&&U.chamber.key===key)return U.chamber.r;
 const r=chamberRun(m,{mode:v.mode,ml:v.ml,vessel:v.vessel,Tamb:v.Tamb===''?null:+v.Tamb,proc:S.proc,min:v.mode==='temper'?40:Math.max(120,Math.min(720,Math.ceil(((hardenModel(m,S.proc,v.ml)||{}).tDone||240)*1.15)))});U.chamber={key,r};return r;}
function heatMap(C){const W=560,H=200,L=40,R=8,T=8,B=24;const nt=C.times.length,nr=C.rad.length;const all=C.field.flat();const lo=Math.floor(Math.min(...all)),hi=Math.ceil(Math.max(...all));
 const cw=(W-L-R)/nt,ch=(H-T-B)/nr;let g='';
 for(let j=0;j<nt;j++)for(let i=0;i<nr;i++){/* linha de cima = superfície, de baixo = centro */const y=T+(nr-1-i)*ch;g+=`<rect x="${(L+j*cw).toFixed(1)}" y="${y.toFixed(1)}" width="${(cw+.4).toFixed(1)}" height="${(ch+.4).toFixed(1)}" fill="${tColor(C.field[j][i],lo,hi)}"/>`;}
 const tm=C.times[nt-1];const tk=tm>180?60:tm>60?20:10;for(let t=0;t<=tm;t+=tk)g+=`<text x="${L+t/tm*(W-L-R)}" y="${H-8}" text-anchor="middle" font-size="9" fill="var(--t3)">${t>=60&&tk>=60?f0(t/60)+' h':f0(t)+' min'}</text>`;
 g+=`<text x="${L-4}" y="${T+8}" text-anchor="end" font-size="9" fill="var(--t3)">borda</text><text x="${L-4}" y="${H-B}" text-anchor="end" font-size="9" fill="var(--t3)">centro</text>`;
 const v=visState();if(v.ti>=0&&v.ti<nt){const x=L+(v.ti+.5)*cw;g+=`<line x1="${x}" x2="${x}" y1="${T}" y2="${H-B}" stroke="var(--t1)" stroke-width="1.5"/>`;}
 return{svg:`<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:340px;height:auto;display:block" role="img" aria-label="Mapa de temperatura do pote: profundidade × tempo">${g}</svg></div>${tLegend(lo,hi,300)}`,lo,hi};}
function crossSection(C,j,lo,hi){const S0=220,c=S0/2,R0=100;const f=C.field[j];let g='';
 for(let i=f.length-1;i>=0;i--){const r=R0*(i+1)/f.length;g+=`<circle cx="${c}" cy="${c}" r="${r.toFixed(1)}" fill="${tColor(f[i],lo,hi)}"/>`;}
 const rs=R0*(1-.015*1000/C.R);g+=`<circle cx="${c}" cy="${c}" r="${Math.max(0,rs).toFixed(1)}" fill="none" stroke="var(--t1)" stroke-dasharray="3 3"/>`;
 return`<svg viewBox="0 0 ${S0} ${S0}" style="width:100%;max-width:240px;height:auto;display:block;margin:auto" role="img" aria-label="Corte do pote no instante escolhido">${g}</svg>`;}
function pgVisual(m){const t=subOf('visual','camara');
 if(m.empty)return`<div class="pg"><h1>Laboratório visual</h1><p class="lead">Monte uma receita na Bancada primeiro.</p></div>`;
 const body=t==='microscopio'?microscopePage(m):chamberPage(m);
 return`<div class="pg"><div class="pghead"><div><h1>Laboratório visual</h1><p class="lead">${t==='microscopio'?'A microestrutura que o motor supõe, com o tipo de representação de cada fase declarado.':'Temperatura dentro do pote, da borda ao centro, calculada pelo modelo de condução.'}</p></div>${segHTML('visual',VIS_SEC,t,'Instrumentos')}</div>${body}</div>`;}
function chamberPage(m){const v=visState();const C=chamberCached(m);if(!C)return'';const H=heatMap(C);const nt=C.times.length;const j=v.ti>=0&&v.ti<nt?v.ti:nt-1;
 const sel=(k,opts,val)=>`<select data-c="visSet" data-k="${k}">${opts.map(([a,b])=>`<option value="${a}"${String(a)===String(val)?' selected':''}>${esc(b)}</option>`).join('')}</select>`;
 const meta={src:'Calculado agora pelo motor do app (não é medição)',vars:'temperatura (°C) por profundidade no pote (borda → centro) e tempo (min)',scale:`cor linear de ${fT(H.lo)} a ${fT(H.hi)} °C; ${C.rad.length} camadas de ${f1(C.R/C.rad.length)} mm`,
  method:'Diferenças finitas explícitas, passo adaptativo pelo limite de estabilidade; capacidade aparente com o calor latente da curva de congelamento',
  model:'Transferência de calor no pote (registro: heat-transfer) — esfera de mesmo raio do pote cilíndrico com altura = diâmetro',
  cond:`${esc(C.lab)}; pote de ${f0(C.ml)} mL${C.vessel?', parede '+esc(COOL_VESSEL[C.vessel].n):''}; troca de calor ${f1(C.h)} W/m²K${C.vessel?' (efetiva '+f1(C.hEff)+')':''}`,
  unc:'h do freezer estimado (calibrável pelo núcleo medido); sem tampa, sem contato com a prateleira'};
 return`<div class="card" id="vis-camara"><div class="row" style="gap:10px;flex-wrap:wrap">
   <label class="field" style="min-width:160px"><span class="lbl">Cenário</span>${sel('mode',[['hard','Endurecimento no freezer'],['temper','Temperagem na cozinha']],v.mode)}</label>
   <label class="field" style="min-width:110px"><span class="lbl">Pote (mL)</span><input type="number" data-c="visSet" data-k="ml" value="${v.ml}" step="50" min="100" max="5000"></label>
   <label class="field" style="min-width:170px"><span class="lbl">Recipiente</span>${sel('vessel',VESSEL_OPTS,v.vessel)}</label>
   <label class="field" style="min-width:110px"><span class="lbl">${v.mode==='temper'?'Cozinha':'Freezer'} (°C)</span><input type="number" data-c="visSet" data-k="Tamb" value="${v.Tamb}" placeholder="${v.mode==='temper'?S.proc.ambT:S.proc.storeT}" step="1"></label></div>
  ${sciFig(H.svg,meta,'camara')}
  <div class="g2" style="margin-top:12px;gap:16px;align-items:center"><div>${crossSection(C,j,H.lo,H.hi)}<p class="muted" style="text-align:center;font-size:11.5px;margin:4px 0 0">Corte em ${f0(C.times[j])} min · tracejado: camada de servir (1,5 cm)</p></div>
   <div><label class="field"><span class="lbl">Instante</span><input type="range" data-c="visSet" data-k="ti" min="0" max="${nt-1}" value="${j}" aria-label="Instante do corte"></label>
    <div class="kv"><span>Centro</span><span class="mono">${f1(C.core[j])} °C</span></div><div class="kv"><span>Camada de servir</span><span class="mono">${f1(C.scoop[j])} °C</span></div><div class="kv"><span>Borda</span><span class="mono">${f1(C.field[j][C.field[j].length-1])} °C</span></div>
    <div class="kv"><span>Ponto ideal da receita</span><span class="mono">${f1(C.serveT)} °C</span></div></div></div>
  <p class="note" style="margin:8px 0 0">Cada cor é um valor calculado, não uma animação. A parede do recipiente soma resistência à troca com o ar; "sem parede" é o que o resto do app usa.</p></div>`;}

/* ---------- microscópio ---------- */
const MIC_BOX=400;/* µm */
const MIC_PH={ice:{n:'Gelo',col:'#7dd3fc'},air:{n:'Ar',col:'#e2e8f0'},fat:{n:'Gordura',col:'#facc15'}};
function micParams(m){const v=U.mic=U.mic||{T:'serve',day:0,yaw:.6,pitch:.35,zoom:1,cut:.5,show:{ice:1,air:1,fat:1},view:'3d'};
 const T=v.T==='store'?+S.proc.storeT:v.T==='draw'?+S.proc.drawT:+S.vit;const P=phaseAt(m,T);
 const K=(m.kin&&m.kin.Kstore)||0;let mean=crystalAging(m,[v.day],K)[0].mean,cv=.45,iceRep='modelada',iceSrc='média do índice do motor, forma gama com CV 0,45 suposto';
 const meas=LOTS.find(L=>L&&L.meas&&+L.meas.iceMean>0&&(L.name===S.name));if(meas&&v.day===0){mean=+meas.meas.iceMean;if(+meas.meas.iceCv>0)cv=+meas.meas.iceCv;iceRep='a partir de medição';iceSrc='média'+(+meas.meas.iceCv>0?' e CV':'')+' medidos no lote '+meas.code+' (posições e formas continuam geradas)';}
 return{v,T,P,mean,cv,iceRep,iceSrc,key:JSON.stringify([S.tipo,S.recipe,S.proc,v.T,v.day,mean,cv])};}
function micScene(p){const rnd=mulberry32(11);const nrm=()=>{let u=0;while(!u)u=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rnd());};const V=MIC_BOX**3,out=[];
 /* gelo: diâmetros de uma gama (Marsaglia–Tsang para k ≥ 1) até completar a fração de volume */
 const k=1/(p.cv*p.cv),th=p.mean*p.cv*p.cv;const gam=()=>{const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{x=nrm();v=1+c*x;}while(v<=0);v=v*v*v;const u=rnd();if(u<1-.0331*x*x*x*x||Math.log(u)<.5*x*x+d*(1-v+Math.log(v)))return d*v*th;}};
 const fill=(ph,frac,dia,max)=>{let vol=0;const tgt=frac*V;let n=0;while(vol<tgt&&n<max){const d=Math.max(2,dia());vol+=Math.PI/6*d*d*d;out.push({ph,x:rnd()*MIC_BOX,y:rnd()*MIC_BOX,z:rnd()*MIC_BOX,r:d/2});n++;}return n;};
 const nI=fill('ice',p.P.vol.ice,gam,3000),nA=fill('air',p.P.vol.air,()=>45,600),nF=fill('fat',Math.min(p.P.vol.fat,.02),()=>4,500);
 return{parts:out,nI,nA,nF};}
class MicroScope{constructor(){this.cv=document.createElement('canvas');this.cv.style.cssText='width:100%;max-width:640px;height:auto;display:block;margin:0 auto;touch-action:none;border-radius:10px;background:#0b1220';this.cv.width=640;this.cv.height=480;this.cv.setAttribute('role','img');this.cx=this.cv.getContext('2d');
  let drag=null;this.cv.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];this.cv.setPointerCapture&&this.cv.setPointerCapture(e.pointerId);});
  this.cv.addEventListener('pointermove',e=>{if(!drag||!U.mic)return;U.mic.yaw+=(e.clientX-drag[0])*.01;U.mic.pitch=clamp(U.mic.pitch+(e.clientY-drag[1])*.01,-1.4,1.4);drag=[e.clientX,e.clientY];this.draw();});
  this.cv.addEventListener('pointerup',()=>{drag=null;});this.cv.addEventListener('wheel',e=>{if(!U.mic)return;e.preventDefault();U.mic.zoom=clamp(U.mic.zoom*(e.deltaY<0?1.1:1/1.1),.5,4);this.draw();},{passive:false});}
 mount(h){if(this.cv.parentNode!==h){h.innerHTML='';h.appendChild(this.cv);}}
 set(scene,v,label){this.scene=scene;this.v=v;this.cv.setAttribute('aria-label',label);this.draw();}
 draw(){const c=this.cx,W=this.cv.width,H=this.cv.height,v=this.v,S0=this.scene;if(!S0||!v)return;c.clearRect(0,0,W,H);c.fillStyle='#0b1220';c.fillRect(0,0,W,H);
  const cy=Math.cos(v.yaw),sy=Math.sin(v.yaw),cp=Math.cos(v.pitch),sp=Math.sin(v.pitch),sc=v.zoom*Math.min(W,H)/(MIC_BOX*1.9),h=MIC_BOX/2,cut=v.cut*MIC_BOX;
  if(v.view==='slice'){/* corte: plano z = cut, seção de cada esfera que o atravessa (como uma lâmina ao microscópio) */
   const s2=Math.min(W,H)*.92*v.zoom/MIC_BOX;const ox=W/2-h*s2,oy=H/2-h*s2;c.fillStyle='#1e293b';c.fillRect(ox,oy,MIC_BOX*s2,MIC_BOX*s2);
   S0.parts.forEach(p=>{if(!v.show[p.ph])return;const dz=p.z-cut;if(Math.abs(dz)>=p.r)return;const rr=Math.sqrt(p.r*p.r-dz*dz)*s2;c.beginPath();c.arc(ox+p.x*s2,oy+p.y*s2,rr,0,2*Math.PI);c.fillStyle=MIC_PH[p.ph].col;c.globalAlpha=p.ph==='air'?.85:.9;c.fill();});
   c.globalAlpha=1;c.strokeStyle='#94a3b8';c.strokeRect(ox,oy,MIC_BOX*s2,MIC_BOX*s2);this.scaleBar(c,ox,oy+MIC_BOX*s2+14,s2);return;}
  const pr=(x,y,z)=>{x-=h;y-=h;z-=h;const x1=cy*x+sy*z,z1=-sy*x+cy*z;const y1=cp*y-sp*z1,z2=sp*y+cp*z1;const f=900/(900+z2);return[W/2+x1*sc*f,H/2+y1*sc*f,z2,f];};
  const vis=S0.parts.filter(p=>v.show[p.ph]&&p.z<=cut).map(p=>{const q=pr(p.x,p.y,p.z);return{p,q};}).sort((a,b)=>b.q[2]-a.q[2]);
  vis.forEach(({p,q})=>{const rr=Math.max(.6,p.r*sc*q[3]);const g=c.createRadialGradient(q[0]-rr*.35,q[1]-rr*.35,rr*.1,q[0],q[1],rr);g.addColorStop(0,MIC_PH[p.ph].col);g.addColorStop(1,'#334155');c.fillStyle=g;c.globalAlpha=p.ph==='air'?.55:.92;c.beginPath();c.arc(q[0],q[1],rr,0,2*Math.PI);c.fill();});
  c.globalAlpha=1;c.strokeStyle='rgba(148,163,184,.6)';c.lineWidth=1;const E=[[0,0,0],[MIC_BOX,0,0],[MIC_BOX,MIC_BOX,0],[0,MIC_BOX,0],[0,0,MIC_BOX],[MIC_BOX,0,MIC_BOX],[MIC_BOX,MIC_BOX,MIC_BOX],[0,MIC_BOX,MIC_BOX]];
  [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b])=>{const A=pr(...E[a]),B=pr(...E[b]);c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(B[0],B[1]);c.stroke();});
  this.scaleBar(c,20,H-20,sc);}
 scaleBar(c,x,y,s){const L=100*s;c.strokeStyle='#e2e8f0';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+L,y);c.stroke();c.fillStyle='#e2e8f0';c.font='12px system-ui,sans-serif';c.fillText('100 µm',x+L+6,y+4);}}
let MSCOPE=null;
function microscopePage(m){const p=micParams(m);const v=p.v;if(!U.micScene||U.micScene.key!==p.key)U.micScene={key:p.key,scene:micScene(p)};const sc=U.micScene.scene;
 const chip=(a,val,lab,on)=>`<button data-a="${a}" data-v="${val}" aria-pressed="${on}">${lab}</button>`;
 const rep=[['Gelo',p.iceRep,p.iceSrc,`${sc.nI} cristais, ${f0(p.P.vol.ice*100)}% do volume`],['Ar','ilustrativa','fração de volume pelo overrun (balanço); diâmetro de 45 µm só para desenhar: o tamanho das bolhas não é estimado',`${sc.nA} bolhas, ${f0(p.P.vol.air*100)}% do volume`],
  ['Gordura','ilustrativa','fora de escala: glóbulos reais têm ~1 µm (invisíveis a esta escala) e aglomerados 3–100 µm; aqui pontos de 4 µm só marcam onde a gordura está',`${sc.nF} pontos (amostra), gordura = ${f0(p.P.vol.fat*100)}% do volume`],
  ['Matriz não congelada','modelada','o espaço escuro; solutos a '+f0(p.P.conc)+'% e viscosidade ~10^'+f1(p.P.logEtaMat)+' Pa·s (WLF)',`${f0(p.P.vol.mat*100)}% do volume`]];
 const meta={src:'Gerado pelo app a partir do motor; '+(p.iceRep==='a partir de medição'?'média de cristais medida':'nenhuma imagem real'),vars:'posição e diâmetro (µm) de cristais, bolhas e gordura num cubo de '+MIC_BOX+' µm',scale:'barra de 100 µm; perspectiva no 3D, escala real no corte',
  method:'Frações de volume por balanço (phaseAt); diâmetros dos cristais sorteados de uma gama (semente fixa); posições aleatórias uniformes, sobreposição permitida',model:'Fases e cristais (registro: microstructure-phases); envelhecimento pelo amadurecimento de Ostwald do motor',
  cond:`${v.T==='store'?'freezer':v.T==='draw'?'saída da produtora':'serviço'} a ${fT(p.T)} °C; ${v.day?v.day+' dias no freezer':'hoje'}`,unc:'Forma, dispersão e posição dos cristais são hipóteses; bolhas e gordura são ilustrativas. Não é imagem de microscópio.'};
 return`<div class="card" id="vis-micro"><div class="row" style="gap:8px;flex-wrap:wrap">
   <div class="chips" role="group" aria-label="Temperatura">${chip('micT','draw','Saída da produtora',v.T==='draw')}${chip('micT','serve','Serviço',v.T==='serve')}${chip('micT','store','Freezer',v.T==='store')}</div>
   <div class="chips" role="group" aria-label="Tempo">${[0,7,30].map(d=>chip('micDay',d,d?d+' dias':'Hoje',v.day===d)).join('')}</div></div>
  <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><div class="chips" role="group" aria-label="Vista">${chip('micView','3d','Volume 3D',v.view==='3d')}${chip('micView','slice','Corte (lâmina)',v.view==='slice')}</div>
   <div class="chips" role="group" aria-label="Fases">${Object.entries(MIC_PH).map(([k,x])=>chip('micShow',k,x.n,!!v.show[k])).join('')}</div>
   <span class="sp"></span><button class="btn ghost sm" data-a="micZoom" data-v="-1" aria-label="Afastar">−</button><button class="btn ghost sm" data-a="micZoom" data-v="1" aria-label="Aproximar">+</button></div>
  <label class="field" style="margin-top:8px"><span class="lbl">${v.view==='slice'?'Profundidade do corte':'Cortar o cubo na profundidade'}: ${f0(v.cut*MIC_BOX)} µm</span><input type="range" data-c="micCut" min="0" max="100" value="${Math.round(v.cut*100)}" aria-label="Profundidade do corte"></label>
  ${sciFig('<div id="micHost" style="margin-top:8px"></div><p class="muted" style="font-size:11.5px;margin:4px 0 0">Arraste para girar · role ou use + e − para aproximar.</p>',meta,'micro')}
  <div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Fase</th><th>Representação</th><th class="r">No cubo</th></tr></thead><tbody>${rep.map(([n,r,s,q])=>`<tr><td>${n}</td><td><span class="chip ${r==='ilustrativa'?'warn':r==='a partir de medição'?'ok':'info'}">${r}</span><div class="muted" style="font-size:11.5px">${esc(s)}</div></td><td class="r mono" style="font-size:12px">${q}</td></tr>`).join('')}</tbody></table></div>
  <p class="note" style="margin:8px 0 0">Esferas são geometria didática: cristais reais são irregulares e bolhas ficam envoltas por gordura e gelo. O que vale aqui são as proporções e a ordem de grandeza dos tamanhos, não a forma. Reconstrução a partir de imagens reais exigiria fotos de microscópio, que o app ainda não importa.</p></div>`;}
function visualAfterRender(){const h=document.getElementById('micHost');if(!h||!U.micScene||!U.mic)return;if(!MSCOPE)MSCOPE=new MicroScope();MSCOPE.mount(h);MSCOPE.set(U.micScene.scene,U.mic,'Microscópio virtual: volume modelado de '+MIC_BOX+' µm');}
const VIS_ACT={micT:v=>{if(U.mic){U.mic.T=v;render();}},micDay:v=>{if(U.mic){U.mic.day=+v;render();}},micView:v=>{if(U.mic){U.mic.view=v;render();}},
 micShow:v=>{if(U.mic){U.mic.show[v]=U.mic.show[v]?0:1;render();}},micZoom:v=>{if(U.mic){U.mic.zoom=clamp(U.mic.zoom*(+v>0?1.25:.8),.5,4);if(MSCOPE)MSCOPE.draw();}}};
const VIS_CHG={visSet:t=>{const v=visState();const k=t.dataset.k;if(k==='ti'){v.ti=+t.value;return;}if(k==='ml'){const x=+t.value;if(!(x>=100&&x<=5000))return false;v.ml=x;}else if(k==='Tamb'){v.Tamb=t.value===''?'':+t.value;}else v[k]=t.value;v.ti=-1;},
 micCut:t=>{if(U.mic){U.mic.cut=clamp(+t.value/100,0,1);}}};
