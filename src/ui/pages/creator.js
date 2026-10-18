/* ==== 55-creator.js ==== */
/* ===================== CREATOR — MODELO DE MICROESTRUTURA ===================== */
/* Converte o resultado do motor em grandezas de microestrutura (campo de 400 µm):
   fração de gelo, de ar, diâmetro médio dos cristais, envelhecimento por Ostwald (LSW: d³ = d0³ + K·t),
   gordura parcialmente coalescida, proteína nas interfaces, lactose cristalizada e rede de hidrocoloides. */
const FIELD_UM=400,AIR_D=40,SENS_D=50;
function microModel(st,m,F,sc,days){
 const P=m.P,pr=m.pr,o={};
 const fz=m.fzVit/100,phiAir=m.ov/(100+m.ov);
 const iceVol=(m.wat/100)*fz/.917,mixVol=1/m.rhoMix;o.phiIce=clamp(iceVol/mixVol*(1-phiAir),0,.75);o.phiAir=phiAir;
 /* coarsening */
 const lo=P.stab[0],hiS=P.stab[1];const k=m.kin;
 o.K=k.Kvit;o.d0=m.crystal;o.d=Math.cbrt(Math.pow(o.d0,3)+o.K*days);o.shelf=m.shelfVit;o.shelfStore=m.shelfStore;
 o.fStab=k.fStab;o.fShock=k.fShock;o.fSerum=k.fKinVit;o.km=k.km;
 /* ar */
 const protOk=m.prot>=Math.max(.5,P.prot[0]-.5)||tbase(st.tipo)==='sorbetto';const bubbleStable=protOk&&m.hydro>=P.stab[0]*.6;
 o.airD=AIR_D*(1+(bubbleStable?0:.05*days))*(m.ov>P.ov[1]+5?1.15:1);o.bubbleStable=bubbleStable;
 /* gordura e proteína (aglomerados ampliados para visibilidade) */
 o.nFat=Math.round(clamp(m.fat*7,0,90));o.destab=clamp((m.destab||0)/100,0,.9);o.butter=m.fat>11.5||(m.keyPct.mono||0)>.35||(m.fat>10.5&&pr.drawMin>13);
 o.nProt=Math.round(clamp(m.prot*9,0,50));
 o.nLac=m.lacW>9?Math.round((m.lacW-9)*5*(1+days/6)):(m.lacW>8.3&&days>6?Math.round((days-6)*.6):0);
 /* rede de estabilizante */
 o.net=m.hydro<.02?0:clamp(m.hydro/((lo+hiS)/2),0,2.2);o.netExcess=m.hydro>hiS*1.25||(m.keyPct.xan||0)>.12;
 /* estados */
 o.soft=m.fzVit<P.fz[0]-1;o.hard=m.fzVit>P.fz[1]+1;o.big=o.d>45;
 o.serumConc=m.SE/(1-fz||1);
 const crit=F.filter(f=>f.sev==='crit').length,warn=F.filter(f=>f.sev==='warn').length;
 o.imbalance=clamp(Math.abs(m.fzVit-m.fzMid)/12+crit*.35+warn*.08+(o.big?.3:0)+(o.nLac>0?.2:0)+(o.butter?.2:0),0,1.5);
 const structural=['Térmico','Sólidos','Estrutura','Lactose','Estabilização','Processo','Segurança'];
 o.perfect=sc>=92&&!F.some(f=>(f.sev==='crit'||f.sev==='warn')&&structural.includes(f.area))&&!o.big&&o.nLac===0;
 o.score=sc;
 /* indicadores do painel */
 const st3=(ok,warnC)=>ok?'ok':warnC?'warn':'crit';
 o.pills=[
  ['Congelamento',f0(m.fzVit)+'% a '+f1(m.vit)+'°',st3(Math.abs(m.fzVit-m.fzMid)<=3,Math.abs(m.fzVit-m.fzMid)<=8)],
  ['Cristais de gelo','≈'+f0(o.d)+' µm',st3(o.d<=42,o.d<=SENS_D)],
  ['Doçura','POD '+f1(m.pod)+'%',st3(m.pod>=P.pod[0]&&m.pod<=P.pod[1],m.pod>=P.pod[0]-3&&m.pod<=P.pod[1]+3)],
  ['Sólidos',f1(m.sol)+'%',st3(m.sol>=P.sol[0]&&m.sol<=P.sol[1],m.sol>=P.sol[0]-3&&m.sol<=P.sol[1]+3)],
  ['Emulsão',tbase(st.tipo)==='sorbetto'?'sem gordura':f1(m.fat)+'% gordura',tbase(st.tipo)==='sorbetto'?'ok':st3(m.fat>=P.fat[0]&&m.fat<=P.fat[1]&&!o.butter&&(m.fat<=8||m.hasEmul),!o.butter)],
  ['Ar incorporado',f0(m.ov)+'%',st3(m.ov>=P.ov[0]&&m.ov<=P.ov[1]&&bubbleStable,bubbleStable)],
  ['Rede estabilizante',m.hydro>.02?f2(m.hydro)+'%':'ausente',st3(m.hydro>=P.stab[0]&&!o.netExcess,m.hydro>0||tbase(st.tipo)==='gastro')],
  ['Lactose',m.lac>0?f1(m.lacW)+'% da água':'sem lactose',st3(m.lacW<=9&&o.nLac===0,m.lacW<=10.5)]
 ];
 return o;
}

/* ===================== CREATOR — MODELO DA REDE DO NEUTRO ===================== */
const NSTYLE={starch:{col:'#fde68a',glob:1},konj:{col:'#38bdf8',seg:12,L:11,w:2.4,branch:1},lbg:{col:'#7dd3fc',seg:11,L:11,w:2},guar:{col:'#6ee7b7',seg:11,L:11,w:2,branch:1},tara:{col:'#5eead4',seg:9,L:11,w:2,branch:.5},xan:{col:'#f6c90e',seg:8,L:12,w:2.6,stiff:1},carr:{col:'#a78bfa',seg:5,L:10,w:1.6,helix:2},cmc:{col:'#f472b6',seg:8,L:11,w:2},pect:{col:'#fb923c',seg:6,L:10,w:2},citf:{col:'#a3e635',seg:6,L:9,w:1.4,fiber:1},gel:{col:'#fda4af',seg:7,L:10,w:1.4,helix:3},acacia:{col:'#e2e8f0',glob:1},inu:{col:'#cbd5e1',glob:1},lec:{col:'#fbbf24',surf:1},mono:{col:'#fbbf24',surf:1}};
function neutroModel(E,pastT,prIn){
 const pr=Object.assign({},PROC0,prIn||(typeof S!=='undefined'&&S&&S.proc)||{},{pastT:+pastT});
 const b=analyzeBlend(E,E.dairy);const comps=[];const keys={};for(const k in b.eff)if(NCOMP[k]&&NCOMP[k].dose&&b.eff[k]>0)keys[k]=b.eff[k];
 const hy=Object.keys(keys).length?hydRun(keys,pr):null;const hOf=k=>hy&&hy.h[k]!=null?hy.h[k]:1;
 for(const k in b.eff){const nc=NCOMP[k];if(!nc||!nc.dose)continue;const mid=(nc.dose[0]+nc.dose[1])/2;const load=b.eff[k]/mid;
  const n=NSTYLE[k]&&(NSTYLE[k].glob||NSTYLE[k].surf)?Math.round(clamp(load*5,0,14)):Math.round(clamp(load*3.2,0,9));
  if(n>0)comps.push({k,n,h:hOf(k),hydrated:hOf(k)>=.9,load});}
 const has=k=>(b.eff[k]||0)>0;
 const galacto=has('lbg')||has('guar')||has('tara');
 const floc=E.dairy&&galacto&&!has('carr')&&!(has('citf')&&b.eff.citf>.1)&&!has('cmc');
 const hydFrac=comps.length?comps.reduce((a,c)=>a+c.load*c.h,0)/comps.reduce((a,c)=>a+c.load,0):0;
 const bound=clamp(((b.P.visc+b.P.anti)/2/100)*hydFrac*1.05,0,.95);
 const excess=b.hydro>.7||(b.eff.xan||0)>.18;const weak=b.hydro<.15;
 const iceD=Math.round(18+(1-bound)*60);
 const unhyd=comps.filter(c=>!c.hydrated).map(c=>NCOMP[c.k].n);
 const warn=b.notes.filter(n=>n.sev==='warn').length;
 const inRange=NFUN.filter(([k])=>k!=='emul'&&k!=='siner').every(([k])=>b.P[k]>=50&&b.P[k]<=88);
 const perfect=!warn&&!floc&&!excess&&!weak&&!unhyd.length&&inRange;
 const st3=(ok,w)=>ok?'ok':w?'warn':'crit';
 const pills=[
  ['Água imobilizada',f0(bound*100)+'%',st3(bound>=.5&&bound<=.85,bound>=.35)],
  ['Cristais previstos','≈'+iceD+' µm',st3(iceD<=42,iceD<=SENS_D)],
  ['Hidrocoloides',f2(b.hydro)+'% da mistura',st3(!excess&&!weak,b.hydro>.1)],
  ['Hidratação',f0(hydFrac*100)+'% '+(unhyd.length?'· incompleta a '+pastT+' °C':'· completa a '+pastT+' °C'),st3(!unhyd.length,hydFrac>=.75)],
  ['Caseínas',E.dairy?(floc?'floculando':'dispersas'):'sem leite',E.dairy?st3(!floc,true):'ok'],
  ['Emulsificação','índice '+b.P.emul,st3(b.P.emul>=20||!E.dairy,true)]
 ];
 return{b,comps,floc,bound,excess,weak,iceD,unhyd,perfect,pills,hydFrac,hy};
}

/* ===================== MOTOR DE PARTÍCULAS ===================== */
const COL={ice:'#7dd3fc',air:'#e6ecf4',fat:'#f6c90e',prot:'#6ee7b7',lac:'#ffffff',net:'#a78bfa',ok:'#6ee7b7',warn:'#fbbf24',crit:'#fb7185',bg:'#0a1220'};
const rnd=(a,b)=>a+Math.random()*(b-a);
class SimBase{
 constructor(){this.cv=document.createElement('canvas');this.cv.className='simcv';this.cv.setAttribute('role','img');this.cx=this.cv.getContext('2d');this.W=640;this.H=420;this.t=0;this.running=false;this.rings=[];this.reduce=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  if('ResizeObserver' in window){this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(this.cv);}}
 resize(){const r=this.cv.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(2,window.devicePixelRatio||1);const w=r.width,h=Math.round(clamp(w*.66,280,470));
  if(this.cv.style.height!==h+'px')this.cv.style.height=h+'px';
  if(Math.abs(this.W-w)>1||Math.abs(this.H-h)>1||this.cv.width!==Math.round(w*dpr)){const sx=w/this.W,sy=h/this.H;this.scalePts(sx,sy);this.W=w;this.H=h;this.cv.width=Math.round(w*dpr);this.cv.height=Math.round(h*dpr);this.cx.setTransform(dpr,0,0,dpr,0,0);this.onResize&&this.onResize();}}
 mount(host){if(!host)return;if(this.cv.parentNode!==host)host.appendChild(this.cv);this.resize();if(!this.running){this.running=true;this.last=performance.now();requestAnimationFrame(t=>this.loop(t));}}
 loop(t){if(!this.cv.isConnected){this.running=false;return;}const dt=Math.min(.05,Math.max(0,(t-this.last)/1000));this.last=t;this.t+=dt;this.step(this.reduce?dt*.35:dt);this.draw();requestAnimationFrame(x=>this.loop(x));}
 ring(x,y,col){this.rings.push({x,y,r:4,a:.9,col});}
 drawRings(c,dt){this.rings=this.rings.filter(r=>r.a>.03);this.rings.forEach(r=>{r.r+=60*dt;r.a*=.94;c.strokeStyle=r.col;c.globalAlpha=r.a;c.lineWidth=1.5;c.beginPath();c.arc(r.x,r.y,r.r,0,7);c.stroke();});c.globalAlpha=1;}
 label(c,x,y,txt,col){c.font='500 11px "DM Mono",ui-monospace,monospace';const w=c.measureText(txt).width+12;let lx=clamp(x+14,4,this.W-w-4),ly=clamp(y-22,4,this.H-22);
  c.strokeStyle=col;c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(lx,ly+9);c.stroke();c.fillStyle='rgba(8,12,20,.88)';c.fillRect(lx,ly,w,18);c.strokeRect(lx,ly,w,18);c.fillStyle=col;c.fillText(txt,lx+6,ly+13);}
 frame(c,perfect,imb){const t=this.t;if(perfect){const a=.35+.25*Math.sin(t*1.6);c.strokeStyle=`rgba(110,231,183,${a})`;c.lineWidth=3;c.strokeRect(1.5,1.5,this.W-3,this.H-3);}
  else if(imb>.6){const a=.15+.15*Math.sin(t*5);c.strokeStyle=`rgba(251,113,133,${a})`;c.lineWidth=3;c.strokeRect(1.5,1.5,this.W-3,this.H-3);}}
}
/* ---------- gelato ---------- */
class GelSim extends SimBase{
 constructor(){super();this.P=[];this.p=null;this.cv.setAttribute('aria-label','Microestrutura simulada do gelato');}
 scalePts(sx,sy){this.P.forEach(q=>{q.x*=sx;q.y*=sy;});}
 get ppu(){return this.W/FIELD_UM;}
 set(p){if(!p){this.p=null;this.P=[];return;}const first=!this.p;this.p=p;this.reconcile(first);}
 onResize(){if(this.p)this.reconcile(false);}
 reconcile(first){const p=this.p,A=this.W*this.H,u=this.ppu;
  const rIce=Math.max(3,p.d/2*u*.92),rAir=p.airD/2*u*.9;
  const want={ice:Math.round(clamp(p.phiIce*A/(Math.PI*rIce*rIce),0,70)),air:Math.round(clamp(p.phiAir*A/(Math.PI*rAir*rAir),0,40)),fat:p.nFat,prot:p.nProt,lac:Math.min(40,p.nLac)};
  for(const ty in want){const alive=this.P.filter(q=>q.ty===ty&&!q.dying);const n=want[ty];
   for(let i=alive.length;i<n;i++)this.spawn(ty,first);for(let i=n;i<alive.length;i++)alive[alive.length-1-(i-n)].dying=1;}
  this.P.forEach(q=>{if(q.ty==='ice')q.tr=rIce*(.7+q.v*.6);else if(q.ty==='air')q.tr=rAir*(.8+q.v*.4);else if(q.ty==='fat')q.tr=p.butter&&q.v<.35?3.6+q.v*6:1.9;else if(q.ty==='prot')q.tr=1.2;else q.tr=7+q.v*6;});
  const airs=this.P.filter(q=>q.ty==='air'&&!q.dying);this.P.filter(q=>q.ty==='fat').forEach((q,i)=>{q.anchor=airs.length&&q.v<p.destab?airs[i%airs.length]:null;});
  this.P.filter(q=>q.ty==='prot').forEach((q,i)=>{q.anchor=airs.length?airs[i%airs.length]:null;});}
 spawn(ty,inside){let x,y,vx=0,vy=0;if(!inside&&ty==='ice'&&this.p&&this.p.stage==='mant'){x=3;y=rnd(0,this.H);vx=rnd(60,120);this.ring(4,y,COL.ice);}else if(inside){x=rnd(0,this.W);y=rnd(0,this.H);}else{const s=Math.floor(Math.random()*4);x=s===0?-10:s===1?this.W+10:rnd(0,this.W);y=s===2?-10:s===3?this.H+10:rnd(0,this.H);const ang=Math.atan2(this.H/2-y,this.W/2-x);vx=Math.cos(ang)*rnd(40,90);vy=Math.sin(ang)*rnd(40,90);if(ty==='ice'||ty==='air'||ty==='lac')this.ring(clamp(x,0,this.W),clamp(y,0,this.H),ty==='lac'?COL.crit:ty==='ice'?COL.ice:COL.air);}
  const q={ty,x,y,vx,vy,r:inside?0:0,tr:3,a:0,v:Math.random(),rot:rnd(0,6.28),vr:rnd(-.3,.3),ph:rnd(0,6.28),pts:Array.from({length:9},()=>rnd(.82,1.12))};this.P.push(q);return q;}
 step(dt){const p=this.p;if(!p)return;const amp=p.amp!=null?p.amp:.3;const agit=2+38*amp;const W=this.W,H=this.H;const sh=p.shear||0,cx=W/2,cy=H/2;this.ang=(this.ang||0)+sh*dt*1.4;
  const big=this.P.filter(q=>q.ty==='ice'||q.ty==='air');
  for(let i=0;i<big.length;i++){const a=big[i];for(let j=i+1;j<big.length;j++){const b=big[j];const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,min=(a.r+b.r)*(p.hard&&a.ty==='ice'&&b.ty==='ice'?.92:1.02);if(d<min){const f=(min-d)/d*.5;a.x-=dx*f*.5;a.y-=dy*f*.5;b.x+=dx*f*.5;b.y+=dy*f*.5;}}}
  const clumps=p.butter?this.P.filter(q=>q.ty==='fat'&&q.v<.35):[];
  this.P.forEach(q=>{
   q.a+=((q.dying?0:1)-q.a)*Math.min(1,dt*3);q.r+=(q.tr*(q.dying?.3:1)-q.r)*Math.min(1,dt*2.2);
   if(q.anchor&&!q.anchor.dying&&q.anchor.a>.2){q.ph+=dt*(.25+q.v*.3);const R=q.anchor.r+(q.ty==='prot'?1:2.5);const tx=q.anchor.x+Math.cos(q.ph+q.v*9)*R,ty=q.anchor.y+Math.sin(q.ph+q.v*9)*R;q.x+=(tx-q.x)*Math.min(1,dt*4);q.y+=(ty-q.y)*Math.min(1,dt*4);return;}
   /* Stokes-Einstein: difusão ∝ T/(η·r) — partículas grandes e fase viscosa se movem menos */
   const m=1.6/(1+q.r*.18);
   q.vx+=(Math.random()-.5)*agit*m*dt*12;q.vy+=(Math.random()-.5)*agit*m*dt*12;
   if(sh){const dx=q.x-cx,dy=q.y-cy;const tvx=-dy*.55,tvy=dx*.55;q.vx+=(tvx-q.vx)*Math.min(1,dt*1.5)*sh;q.vy+=(tvy-q.vy)*Math.min(1,dt*1.5)*sh;q.vx+=-dx*dt*.15*sh;q.vy+=-dy*dt*.15*sh;}
   if(p.butter&&q.ty==='fat'&&clumps.length){const c=clumps[Math.floor(q.v*clumps.length)];if(c&&c!==q){q.vx+=(c.x-q.x)*dt*.8;q.vy+=(c.y-q.y)*dt*.8;}}
   const damp=Math.pow(p.net>1.4?.05:.18,dt);q.vx*=damp;q.vy*=damp;q.x+=q.vx*dt;q.y+=q.vy*dt;q.rot+=q.vr*dt*(p.soft?2:.6);
   if(q.x<0){q.x=0;q.vx*=-.5;}if(q.x>W){q.x=W;q.vx*=-.5;}if(q.y<0){q.y=0;q.vy*=-.5;}if(q.y>H){q.y=H;q.vy*=-.5;}});
  this.P=this.P.filter(q=>!(q.dying&&q.a<.03));this._dt=dt;}
 blob(c,q,wob){c.beginPath();const n=q.pts.length;for(let i=0;i<=n;i++){const k=i%n,ang=q.rot+k/n*6.283,rr=q.r*(q.pts[k]+(wob?Math.sin(this.t*3+k)*wob:0));const x=q.x+Math.cos(ang)*rr,y=q.y+Math.sin(ang)*rr;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}
 draw(){const c=this.cx,p=this.p,W=this.W,H=this.H;if(!p){c.fillStyle='#070b13';c.fillRect(0,0,W,H);return;}
  const g=c.createRadialGradient(W*.5,H*.45,10,W*.5,H*.5,Math.max(W,H)*.75);const conc=clamp(p.serumConc/250,0,1);
  g.addColorStop(0,`rgb(${18+conc*22},${26+conc*10},${44-conc*12})`);g.addColorStop(1,'#070b13');c.fillStyle=g;c.fillRect(0,0,W,H);
  /* rede de estabilizante */
  if(p.net>0){const nodes=this.P.filter(q=>(q.ty==='ice'||q.ty==='air')&&q.a>.3);const maxD=40+p.net*45;c.lineWidth=p.netExcess?1.4:.8;c.strokeStyle=p.netExcess?'rgba(251,113,133,.35)':'rgba(167,139,250,.28)';c.beginPath();
   for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<a.r+b.r+maxD*.6&&((i*7+j*3)%10)<p.net*4.5){const mx=(a.x+b.x)/2+Math.sin(this.t*.7+i)*6,my=(a.y+b.y)/2+Math.cos(this.t*.6+j)*6;c.moveTo(a.x,a.y);c.quadraticCurveTo(mx,my,b.x,b.y);}}c.stroke();}
  /* bolhas de ar */
  this.P.filter(q=>q.ty==='air').forEach(q=>{c.globalAlpha=q.a;c.fillStyle='rgba(230,236,244,.05)';c.strokeStyle=p.bubbleStable?'rgba(230,236,244,.55)':'rgba(251,191,36,.6)';c.lineWidth=1.3;c.beginPath();c.arc(q.x,q.y,q.r,0,7);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.arc(q.x-q.r*.35,q.y-q.r*.35,q.r*.18,0,7);c.fill();});
  /* cristais de gelo */
  this.P.filter(q=>q.ty==='ice').forEach(q=>{c.globalAlpha=q.a;const dum=q.r*2/this.ppu;const col=dum>SENS_D?COL.crit:dum>42?COL.warn:COL.ice;
   this.blob(c,q,p.soft?.06:0);c.fillStyle=p.soft?'rgba(125,211,252,.08)':'rgba(125,211,252,.16)';c.fill();c.strokeStyle=col;c.lineWidth=p.soft?1:1.4;if(p.soft){c.setLineDash([3,3]);}c.stroke();c.setLineDash([]);
   c.strokeStyle='rgba(255,255,255,.18)';c.beginPath();c.moveTo(q.x-q.r*.3,q.y-q.r*.2);c.lineTo(q.x+q.r*.1,q.y-q.r*.45);c.stroke();});
  if(p.hard){const ices=this.P.filter(q=>q.ty==='ice'&&q.a>.5);c.strokeStyle='rgba(125,211,252,.6)';c.lineWidth=3;c.beginPath();for(let i=0;i<ices.length;i++)for(let j=i+1;j<ices.length;j++){const a=ices[i],b=ices[j];if(Math.hypot(a.x-b.x,a.y-b.y)<(a.r+b.r)*1.05){c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}}c.stroke();}
  /* gordura e proteína */
  const fs=p.fatSolid!=null?p.fatSolid:1;this.P.filter(q=>q.ty==='fat').forEach(q=>{c.globalAlpha=q.a;c.beginPath();c.arc(q.x,q.y,q.r+(fs<.2?.6:0),0,7);if(fs<.2){c.fillStyle='rgba(246,201,14,.28)';c.fill();c.strokeStyle=COL.fat;c.lineWidth=1;c.stroke();}else{c.fillStyle=COL.fat;c.globalAlpha=q.a*(.55+.45*fs);c.fill();}});
  this.P.filter(q=>q.ty==='prot').forEach(q=>{c.globalAlpha=q.a*.9;c.fillStyle=COL.prot;c.fillRect(q.x-q.r,q.y-q.r,q.r*2,q.r*2);});
  /* lactose */
  this.P.filter(q=>q.ty==='lac').forEach(q=>{c.globalAlpha=q.a*(.75+.25*Math.sin(this.t*4+q.ph));c.save();c.translate(q.x,q.y);c.rotate(q.rot);c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.moveTo(-q.r,0);c.lineTo(0,-2.2);c.lineTo(q.r,0);c.lineTo(0,2.2);c.closePath();c.fill();c.restore();});
  c.globalAlpha=1;this.drawRings(c,this._dt||.016);
  /* anotações */
  const labs=[];const ices=this.P.filter(q=>q.ty==='ice'&&q.a>.6).sort((a,b)=>b.r-a.r);
  if(ices[0]&&p.big)labs.push([ices[0].x,ices[0].y,'cristal ≈'+f0(ices[0].r*2/this.ppu)+' µm',COL.crit]);
  if(p.soft&&ices[1])labs.push([ices[1].x,ices[1].y,'gelo fundindo · PAC alto',COL.warn]);
  if(p.hard&&ices[2])labs.push([ices[2].x,ices[2].y,'cristais soldados · duro',COL.warn]);
  const lac=this.P.find(q=>q.ty==='lac'&&q.a>.6);if(lac)labs.push([lac.x,lac.y,'lactose cristalizando',COL.crit]);
  if(p.butter){const f=this.P.find(q=>q.ty==='fat'&&q.v<.35&&q.a>.6);if(f)labs.push([f.x,f.y,'grumos de gordura',COL.warn]);}
  if(!p.bubbleStable){const a=this.P.find(q=>q.ty==='air'&&q.a>.6);if(a)labs.push([a.x,a.y,'bolhas instáveis',COL.warn]);}
  if(p.netExcess){const a=this.P.find(q=>q.ty==='air'&&q.a>.6&&q!==labs[0]);if(a)labs.push([a.x+a.r,a.y,'rede gomosa',COL.crit]);}
  labs.slice(0,3).forEach(l=>this.label(c,...l));
  /* mantecação: parede fria do cilindro (nucleação) e pá raspadora */
  if(p.stage==='mant'){const gw=c.createLinearGradient(0,0,26,0);gw.addColorStop(0,'rgba(125,211,252,.45)');gw.addColorStop(1,'rgba(125,211,252,0)');c.fillStyle=gw;c.fillRect(0,0,26,H);
   c.save();c.translate(W/2,H/2);c.rotate(this.ang||0);c.strokeStyle='rgba(230,236,244,.10)';c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(-Math.min(W,H)*.42,0);c.lineTo(Math.min(W,H)*.42,0);c.stroke();c.restore();}
  if(p.snap){c.font=(W<520?'500 10px':'500 11px')+' "DM Mono",ui-monospace,monospace';const L=[];const maxW=W-36;
   procHUD(p.snap).forEach(t=>{let cur='';t.split(' · ').forEach(part=>{const nx=cur?cur+' · '+part:part;if(cur&&c.measureText(nx).width>maxW){L.push(cur);cur=part;}else cur=nx;});if(cur)L.push(cur);});
   const w=Math.min(W-20,Math.max(...L.map(t=>c.measureText(t).width))+16);
   c.fillStyle='rgba(7,11,19,.78)';c.fillRect(10,10,w,L.length*15+8);c.strokeStyle='rgba(125,211,252,.35)';c.lineWidth=1;c.strokeRect(10,10,w,L.length*15+8);
   L.forEach((t,i)=>{c.fillStyle=i?'rgba(203,213,225,.92)':'#7dd3fc';c.fillText(t,18,24+i*15);});}
  /* escala */
  const u=this.ppu;c.fillStyle='rgba(230,236,244,.85)';c.fillRect(14,H-18,SENS_D*u,3);c.font='500 10.5px "DM Mono",ui-monospace,monospace';c.fillText('50 µm · limiar sensorial',14,H-24);
  c.textAlign='right';c.fillStyle='rgba(154,168,189,.9)';c.fillText('campo '+FIELD_UM+' µm',W-12,H-12);c.textAlign='left';
  this.frame(c,p.perfect,p.imbalance);}
}
/* ---------- neutro ---------- */
class NeuSim extends SimBase{
 constructor(){super();this.ch=[];this.wat=[];this.mic=[];this.glob=[];this.ice=[];this.p=null;this.cv.setAttribute('aria-label','Rede de hidrocoloides simulada');}
 scalePts(sx,sy){const f=q=>{q.x*=sx;q.y*=sy;};this.ch.forEach(c=>c.n.forEach(f));this.wat.forEach(f);this.mic.forEach(f);this.glob.forEach(f);this.ice.forEach(f);}
 set(p){const first=!this.p;this.p=p;this.build(first);}
 build(first){const p=this.p,W=this.W,H=this.H;
  if(!this.wat.length)for(let i=0;i<150;i++)this.wat.push({x:rnd(0,W),y:rnd(0,H),vx:0,vy:0,i});
  this.wat.forEach(w=>w.bound=w.i/150<p.bound);
  const wantMic=S.nxEdit.dairy?22:0;while(this.mic.length<wantMic)this.mic.push({x:rnd(0,W),y:rnd(0,H),vx:0,vy:0,a:0});this.mic.length=Math.min(this.mic.length,wantMic);
  if(!this.ice.length)for(let i=0;i<4;i++)this.ice.push({x:i%2?W-30:30,y:i<2?30:H-30,r:6,pts:Array.from({length:8},()=>rnd(.85,1.1)),rot:rnd(0,6)});
  /* cadeias */
  const want={};p.comps.forEach(c=>{if(!NSTYLE[c.k].glob&&!NSTYLE[c.k].surf)want[c.k]=c;});
  this.ch.forEach(c=>{if(!want[c.k])c.dying=1;});
  for(const k in want){const st=NSTYLE[k],cur=this.ch.filter(c=>c.k===k&&!c.dying);const n=want[k].n;
   for(let i=cur.length;i<n;i++){const x0=first?rnd(40,W-40):(Math.random()<.5?-20:W+20),y0=rnd(30,H-30);const ang=rnd(0,6.28);const nodes=[];for(let s=0;s<st.seg;s++)nodes.push({x:x0+Math.cos(ang)*s*st.L,y:y0+Math.sin(ang)*s*st.L,vx:0,vy:0});this.ch.push({k,n:nodes,a:0,ph:rnd(0,6)});if(!first)this.ring(clamp(x0,0,W),y0,st.col);}
   for(let i=n;i<cur.length;i++)cur[i].dying=1;
   this.ch.filter(c=>c.k===k).forEach(c=>{c.hyd=want[k].hydrated;c.h=want[k].h;});}
  /* glóbulos e tensoativos */
  const wg=[];p.comps.forEach(c=>{if(NSTYLE[c.k].glob||NSTYLE[c.k].surf)for(let i=0;i<c.n;i++)wg.push(c.k);});
  while(this.glob.length<wg.length)this.glob.push({x:rnd(0,W),y:rnd(0,H),vx:0,vy:0,a:0,ph:rnd(0,6)});this.glob.length=wg.length;this.glob.forEach((g,i)=>g.k=wg[i]);}
 step(dt){const p=this.p;if(!p)return;const W=this.W,H=this.H;const visc=p.excess?.02:p.b.hydro>.4?.08:.2;const agit=6+(p.perfect?0:20)+(p.excess?-3:0);
  const jig=(q,amp)=>{q.vx+=(Math.random()-.5)*amp*dt*12;q.vy+=(Math.random()-.5)*amp*dt*12;};
  const wall=q=>{if(q.x<0){q.x=0;q.vx*=-.5;}if(q.x>W){q.x=W;q.vx*=-.5;}if(q.y<0){q.y=0;q.vy*=-.5;}if(q.y>H){q.y=H;q.vy*=-.5;}};
  /* cadeias: molas + flexão */
  this.ch.forEach(c=>{c.a+=((c.dying?0:1)-c.a)*Math.min(1,dt*2);const st=NSTYLE[c.k];const L=st.L*(.32+.68*(c.h!=null?c.h:c.hyd?1:0));const n=c.n;
   for(let it=0;it<2;it++)for(let i=0;i<n.length-1;i++){const a=n[i],b=n[i+1];const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,f=(d-L)/d*.5;a.x+=dx*f;a.y+=dy*f;b.x-=dx*f;b.y-=dy*f;
    if(st.stiff&&i<n.length-2){const e=n[i+2];const ex=e.x-a.x,ey=e.y-a.y,ed=Math.hypot(ex,ey)||.01,g=(ed-2*L)/ed*.25;a.x+=ex*g;a.y+=ey*g;e.x-=ex*g;e.y-=ey*g;}}
   n.forEach(q=>{jig(q,agit*(.6+.6*(c.h!=null?c.h:c.hyd?1:0)));const d=Math.pow(visc,dt);q.vx*=d;q.vy*=d;q.x+=q.vx*dt;q.y+=q.vy*dt;wall(q);});});
  this.ch=this.ch.filter(c=>!(c.dying&&c.a<.03));
  const segs=[];this.ch.forEach(c=>{if(c.hyd&&!c.dying)c.n.forEach(q=>segs.push(q));});
  /* água: livre corre, ligada fica presa perto das cadeias */
  this.wat.forEach(w=>{if(w.bound&&segs.length){const s=segs[w.i%segs.length];const ang=w.i*2.4+this.t*.4;w.x+=(s.x+Math.cos(ang)*7-w.x)*Math.min(1,dt*3);w.y+=(s.y+Math.sin(ang)*7-w.y)*Math.min(1,dt*3);}
   else{jig(w,70);const d=Math.pow(.4,dt);w.vx*=d;w.vy*=d;w.x+=w.vx*dt;w.y+=w.vy*dt;wall(w);}});
  /* micelas de caseína */
  const centers=[[W*.3,H*.35],[W*.68,H*.62]];
  this.mic.forEach((q,i)=>{q.a+=(1-q.a)*Math.min(1,dt*2);jig(q,14);if(p.floc){const cc=centers[i%2];q.vx+=(cc[0]-q.x)*dt*.9;q.vy+=(cc[1]-q.y)*dt*.9;}else{this.mic.forEach(o=>{if(o===q)return;const dx=q.x-o.x,dy=q.y-o.y,d=Math.hypot(dx,dy)||1;if(d<40){q.vx+=dx/d*dt*60;q.vy+=dy/d*dt*60;}});}
   const d=Math.pow(.2,dt);q.vx*=d;q.vy*=d;q.x+=q.vx*dt;q.y+=q.vy*dt;wall(q);});
  this.glob.forEach(g=>{g.a+=(1-g.a)*Math.min(1,dt*2);jig(g,10);const d=Math.pow(.2,dt);g.vx*=d;g.vy*=d;g.x+=g.vx*dt;g.y+=g.vy*dt;g.ph+=dt;wall(g);});
  /* cristais de gelo nos cantos crescem até o tamanho previsto */
  const target=p.iceD*this.W/FIELD_UM/2;this.ice.forEach(q=>{q.r+=(target-q.r)*Math.min(1,dt*.6);});
  this._dt=dt;}
 draw(){const c=this.cx,p=this.p,W=this.W,H=this.H;if(!p){c.fillStyle='#070b13';c.fillRect(0,0,W,H);return;}
  const g=c.createRadialGradient(W/2,H/2,10,W/2,H/2,Math.max(W,H)*.7);g.addColorStop(0,'#101a2c');g.addColorStop(1,'#070b13');c.fillStyle=g;c.fillRect(0,0,W,H);
  if(p.floc){c.fillStyle='rgba(251,191,36,.06)';c.beginPath();c.ellipse(W*.5,H*.5,W*.16,H*.2,0,0,7);c.fill();}
  /* gelo */
  this.ice.forEach(q=>{const dum=q.r*2*FIELD_UM/W;c.beginPath();for(let i=0;i<=8;i++){const k=i%8,a=q.rot+k/8*6.283,rr=q.r*q.pts[k];const x=q.x+Math.cos(a)*rr,y=q.y+Math.sin(a)*rr;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fillStyle='rgba(125,211,252,.12)';c.fill();c.strokeStyle=dum>SENS_D?COL.crit:dum>42?COL.warn:COL.ice;c.lineWidth=1.3;c.stroke();});
  /* água */
  this.wat.forEach(w=>{c.fillStyle=w.bound?'rgba(125,211,252,.85)':'rgba(125,211,252,.28)';c.fillRect(w.x-1.2,w.y-1.2,2.4,2.4);});
  /* micelas */
  this.mic.forEach(q=>{c.globalAlpha=q.a;c.fillStyle='rgba(240,236,228,.75)';c.beginPath();c.arc(q.x,q.y,4.2,0,7);c.fill();c.strokeStyle='rgba(255,255,255,.35)';c.stroke();});c.globalAlpha=1;
  /* cadeias */
  this.ch.forEach(ch=>{const st=NSTYLE[ch.k],n=ch.n;c.globalAlpha=ch.a*(.55+.45*(ch.h!=null?ch.h:ch.hyd?1:0));c.strokeStyle=st.col;c.lineWidth=st.w;c.lineCap='round';
   const path=(off)=>{c.beginPath();n.forEach((q,i)=>{const ox=off?Math.sin(i*1.6+this.t*2+off)*2.6:0;i?c.lineTo(q.x+ox,q.y-ox):c.moveTo(q.x+ox,q.y-ox);});c.stroke();};
   if(st.helix){for(let h=0;h<st.helix;h++)path(h*2.1+.5);}else if(st.fiber){path(0);c.save();c.translate(0,3);path(0);c.restore();}else path(0);
   if(st.branch&&ch.hyd){c.lineWidth=1.2;for(let i=1;i<n.length-1;i+=st.branch>.7?2:3){const q=n[i],nx=n[i+1];const dx=nx.y-q.y,dy=q.x-nx.x,d=Math.hypot(dx,dy)||1;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x+dx/d*6,q.y+dy/d*6);c.stroke();}}
   if(!ch.hyd){c.fillStyle=st.col;c.beginPath();c.arc(n[0].x,n[0].y,2.5,0,7);c.fill();}
   if(ch.k==='carr'&&this.mic.length){const a=n[0],b=n[n.length-1];const near=q=>this.mic.reduce((m,o)=>Math.hypot(o.x-q.x,o.y-q.y)<Math.hypot(m.x-q.x,m.y-q.y)?o:m,this.mic[0]);[a,b].forEach(e=>{const mm=near(e);if(Math.hypot(mm.x-e.x,mm.y-e.y)<70){c.lineWidth=.8;c.setLineDash([2,3]);c.beginPath();c.moveTo(e.x,e.y);c.lineTo(mm.x,mm.y);c.stroke();c.setLineDash([]);e.x+=(mm.x-e.x)*.02;e.y+=(mm.y-e.y)*.02;}});}});
  c.globalAlpha=1;
  /* glóbulos (inulina, acácia) e tensoativos (gotas de gordura com caudas) */
  this.glob.forEach(q=>{const st=NSTYLE[q.k];c.globalAlpha=q.a;if(st.surf){c.fillStyle='rgba(246,201,14,.25)';c.beginPath();c.arc(q.x,q.y,7,0,7);c.fill();c.strokeStyle=st.col;c.lineWidth=1;for(let i=0;i<8;i++){const a=i/8*6.283+q.ph*.3;c.beginPath();c.moveTo(q.x+Math.cos(a)*7,q.y+Math.sin(a)*7);c.lineTo(q.x+Math.cos(a)*11,q.y+Math.sin(a)*11);c.stroke();}}
   else if(q.k==='acacia'){c.fillStyle='rgba(226,232,240,.55)';c.beginPath();c.arc(q.x,q.y,4.5,0,7);c.fill();c.strokeStyle='rgba(246,201,14,.6)';c.beginPath();c.arc(q.x,q.y,7,0,7);c.stroke();}
   else{c.fillStyle='rgba(203,213,225,.45)';for(let i=0;i<3;i++){c.beginPath();c.arc(q.x+Math.cos(i*2.1)*3,q.y+Math.sin(i*2.1)*3,2.6,0,7);c.fill();}}});
  c.globalAlpha=1;this.drawRings(c,this._dt||.016);
  const labs=[];if(p.floc&&this.mic[0])labs.push([this.mic[0].x,this.mic[0].y,'caseínas floculando · soro',COL.warn]);
  const un=this.ch.find(x=>!x.hyd&&!x.dying);if(un)labs.push([un.n[0].x,un.n[0].y,NCOMP[un.k].n+' '+f0((un.h||0)*100)+'% hidratada',COL.warn]);
  if(p.excess&&this.ch[0])labs.push([this.ch[0].n[3]?this.ch[0].n[3].x:W/2,this.ch[0].n[3]?this.ch[0].n[3].y:H/2,'rede saturada · gomoso',COL.crit]);
  if(p.weak)labs.push([W*.5,H*.5,'rede fraca · água livre',COL.crit]);
  if(this.ice[0]&&p.iceD>45)labs.push([this.ice[0].x,this.ice[0].y,'cristal ≈'+p.iceD+' µm',COL.crit]);
  labs.slice(0,3).forEach(l=>this.label(c,...l));
  c.font='500 10.5px "DM Mono",ui-monospace,monospace';c.fillStyle='rgba(154,168,189,.9)';c.textAlign='right';c.fillText('fase não congelada · água ligada '+f0(p.bound*100)+'%',W-12,H-12);c.textAlign='left';
  this.frame(c,p.perfect,p.perfect?0:(p.excess||p.weak||p.floc?.8:.3));}
}

/* ===================== PÁGINA CREATOR ===================== */
function pills(list){return`<div class="pills">${list.map(([n,v,s])=>`<div class="pill2 ${s}"><span class="dot"></span><span class="n">${n}</span><span class="v">${v}</span></div>`).join('')}</div>`;}
function seal(ok,title,sub){return ok?`<div class="seal"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="15" fill="none" stroke="var(--ok)" stroke-width="2"/><path d="M10 17.5l4.5 4.5L24 12" fill="none" stroke="var(--ok)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg><div><b>${title}</b><span>${sub}</span></div></div>`:'';}
function phaseMap(m,p){const P=m.P,W=300,H=190,L=34,R=10,T=10,B=26;const x0=50,x1=90,y0=P.sol[0]-8,y1=P.sol[1]+8;const sx=v=>L+(clamp(v,x0,x1)-x0)/(x1-x0)*(W-L-R),sy=v=>T+(1-(clamp(v,y0,y1)-y0)/(y1-y0))*(H-T-B);
 U.trail=U.trail||[];const last=U.trail[U.trail.length-1];if(!last||Math.abs(last[0]-m.fzVit)>.05||Math.abs(last[1]-m.sol)>.05){U.trail.push([m.fzVit,m.sol]);if(U.trail.length>10)U.trail.shift();}
 let g=`<rect x="${sx(P.fz[0])}" y="${sy(P.sol[1])}" width="${sx(P.fz[1])-sx(P.fz[0])}" height="${sy(P.sol[0])-sy(P.sol[1])}" fill="rgba(110,231,183,.14)" stroke="rgba(110,231,183,.5)" stroke-dasharray="3 3"/>`;
 for(let v=50;v<=90;v+=10)g+=`<text x="${sx(v)}" y="${H-8}" text-anchor="middle" fill="var(--t3)" font-size="9.5">${v}%</text>`;
 [y0,(y0+y1)/2,y1].forEach(v=>g+=`<text x="${L-5}" y="${sy(v)+3}" text-anchor="end" fill="var(--t3)" font-size="9.5">${f0(v)}</text>`);
 g+=`<polyline points="${U.trail.map(t=>sx(t[0])+','+sy(t[1])).join(' ')}" fill="none" stroke="var(--t3)" stroke-width="1" stroke-dasharray="2 2"/>`;
 U.trail.slice(0,-1).forEach((t,i)=>g+=`<circle cx="${sx(t[0])}" cy="${sy(t[1])}" r="2" fill="var(--t3)" opacity="${.3+i*.06}"/>`);
 const col=p.perfect?'var(--ok)':p.imbalance>.6?'var(--crit)':'var(--warn)';g+=`<circle cx="${sx(m.fzVit)}" cy="${sy(m.sol)}" r="6" fill="${col}"><animate attributeName="r" values="5;8;5" dur="1.6s" repeatCount="indefinite"/></circle>`;
 return`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Mapa de equilíbrio: água congelada × sólidos">${g}<text x="${W-R}" y="${T+10}" text-anchor="end" fill="var(--t3)" font-size="9.5">sólidos ↑ · congelada →</text></svg>`;}

function pgCreator(m,F,sc){
 const tab=S.creatorTab||'gelato';
 return`<div class="pg"><div class="row" style="align-items:flex-end"><div style="flex:1;min-width:240px"><h1>Creator</h1><p class="lead">Laboratório de formulação com simulação ao vivo. Cada grama alterada recalcula o motor e a microestrutura reage.</p></div>
  <div class="seg" role="tablist" aria-label="Laboratório">${[['gelato','Gelato'],['neutros','Neutros']].map(([k,n])=>`<button role="tab" data-a="crTab" data-v="${k}" aria-selected="${tab===k}">${n}</button>`).join('')}</div></div>
 ${tab==='gelato'?crGelato(m,F,sc):crNeutros(m)}</div>`;}

function crGelato(m,F,sc){
 const days=+U.days||0;
 const q=norm((U.cq||'').trim());const res=q?ING.filter(i=>i.id!=='nx_tmp'&&norm(i.n+' '+i.cat).includes(q)).slice(0,10):[];
 const u=U.procU!=null?clamp(+U.procU,0,6.99):PROC_SERV;const C=m.empty?null:procCtx(S,m);const p=m.empty?null:microAt(S,m,F,sc.total,days,u,C);U.gp=p;U._cr=m.empty?null:{m,F,sc:sc.total,C};
 const rows=(S.recipe||[]).map(r=>{const i=ING_BY[r.id];if(!i)return'';const step=r.g>=200?10:r.g>=20?5:r.g>=5?1:.5;
  return`<div class="crrow"><span class="nm">${esc(i.n)}<small>${esc(i.cat)} · ${m.tot?f1(r.g/m.tot*100):0}%</small></span><span class="stp"><button data-a="crStep" data-v="${r.id}|${-step}" aria-label="Menos ${step} g">−</button><input type="number" id="cg-${r.id}" data-i="g" data-id="${r.id}" value="${r.g}" min="0" step="${step}" aria-label="Gramas de ${esc(i.n)}"><button data-a="crStep" data-v="${r.id}|${step}" aria-label="Mais ${step} g">+</button></span><button class="btn del" data-a="rm" data-v="${r.id}" aria-label="Remover">✕</button></div>`;}).join('');
 const sub=S.crSub||'atelie';
 return`<div class="crgrid">
  <div class="card crleft"><h2>Formulação <span class="muted" style="text-transform:none;letter-spacing:0">${f0(m.tot)} g · ${esc(m.P.n)}</span></h2>
   <div class="search" style="margin-bottom:10px"><input type="text" id="cq" data-i="cq" value="${esc(U.cq||'')}" placeholder="Adicionar ingrediente…" autocomplete="off" aria-label="Adicionar ingrediente">${res.length?`<div class="res">${res.map(i=>`<button data-a="crAdd" data-v="${i.id}"><span>${esc(i.n)}</span><span class="tag">${esc(i.cat)}</span></button>`).join('')}</div>`:''}</div>
   <div class="crlist">${rows||'<p class="muted">Adicione ingredientes ou carregue uma receita da Biblioteca.</p>'}</div>
   ${(()=>{const h=liveBalCard(m);return h?h.replace(/^<div class="card">/,'<div class="crbal" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line)">'):'';})()}
   <div class="row" style="margin-top:10px"><button class="btn sm" data-a="go" data-v="laudo">Abrir laudo</button></div>
  </div>
  <div class="crcenter">
   <div class="card" style="padding:0;overflow:hidden"><div id="gsimHost" class="simhost"></div>
    <div class="simbar"><span class="lbl">Dias de vitrine</span><input type="range" id="days" data-i="days" min="0" max="14" step="1" value="${days}" aria-label="Dias de vitrine"><output class="mono">${days} d</output><button class="btn sm" data-a="age">${U.aging?'Pausar':'▶ Envelhecer'}</button></div>${p?crProcess(S,m,u,C):''}</div>
   ${p?`<div class="card">${seal(p.perfect,'Equilíbrio atingido · padrão de alta gelateria italiana','Estrutura estável, cristais finos e todos os parâmetros na faixa de '+esc(m.P.n.toLowerCase())+' a '+f1(S.vit)+' °C.')}
    ${pills(p.pills)}
    <div class="g2" style="margin-top:12px;gap:16px"><div><span class="lbl">Mapa de equilíbrio</span>${phaseMap(m,p)}</div>
     <div><span class="lbl">Previsão de vida na vitrine</span><div class="big ${p.shelf>=7?'c-ok':p.shelf>=3?'c-warn':'c-crit'}" style="margin-top:6px">${p.shelf>30?'30+':f0(p.shelf)}<small class="muted" style="font-size:14px"> dias</small></div>
      <p class="note" style="margin:6px 0 0">Dias até o cristal médio passar de 50 µm (crescimento de Ostwald, d³ = d₀³ + K·t). Cristal inicial ${f0(p.d0)} µm; hoje (dia ${days}) ${f0(p.d)} µm. K multiplicado por ${f2(p.fStab)} (estabilizante) × ${f2(p.fShock)} (choque térmico) × ${f2(p.fSerum)} (cinética WLF, Tg′ ${f1(m.tg)} °C)${p.km!==1?' × '+f2(p.km)+' (calibração)':''}. No freezer a ${fT(m.pr.storeT)} °C: ${p.shelfStore>90?'90+':f0(p.shelfStore)} dias.</p></div></div></div>`:''}
  </div></div>
  <div class="card flat"><p class="note" style="margin:0"><b style="color:var(--t2)">Como ler a simulação.</b> Contornos azuis: cristais de gelo, no tamanho e fração calculados (laranja acima de 42 µm, vermelho acima do limiar de 50 µm). Círculos claros: células de ar pelo overrun previsto. Pontos dourados: gordura (ampliada); os que contornam as bolhas são a gordura parcialmente coalescida que sustenta o ar. Quadrados verdes: proteína nas interfaces. Fios violeta: rede de hidrocoloides. Losangos brancos: lactose cristalizada. O movimento é físico: difusão de Stokes-Einstein (proporcional a T/viscosidade e inversa ao tamanho), com a viscosidade da fase não congelada pela equação WLF a partir da Tg′; por isso a cena quase para na vitrine e corre na calda quente. Na linha do processo, cada etapa usa o estado calculado naquela temperatura: gelo pela curva de congelamento, ar pelo overrun da máquina, gordura sólida pelo SFC e desestabilização pelo modelo do motor; na mantecação o gelo nasce na parede fria do cilindro e é raspado para o centro. Com a receita equilibrada a moldura fica verde. Tudo é desenhado a partir do motor de cálculo; a fidelidade ao produto real depende da pesagem, da matéria-prima e da máquina, então valide sempre com um lote-teste.</p></div>
  <div class="chips">${[['atelie','Ateliê criativo'],['gerar','Criar por alvo'],['comparar','Comparar variações'],['sens','Simulação "e se"']].map(([k,n])=>`<button data-a="crSub" data-v="${k}" aria-pressed="${sub===k}">${n}</button>`).join('')}</div>
  ${sub==='atelie'?labAtelie(m,F,sc):sub==='gerar'?labGerar():sub==='comparar'?labComparar(m):labSens(m)}`;}

function crNeutros(m){
 const E=S.nxEdit;const pastT=+S.proc.pastT;const p=neutroModel(E,pastT);U.np=p;const b=p.b;const T=U.nxTest;
 const tot=Object.values(E.parts).reduce((a,x)=>a+(+x||0),0);const avail=Object.keys(NCOMP).filter(k=>!(k in E.parts));
 const fromP=NEUTRO_PRESETS.find(n=>n.id===E.from);
 const grp=[['mestre','Mestres'],['tradicao','Tradições'],['academia','Academia'],['casa','Il Fredolin']].map(([k,t])=>{const L=NEUTRO_PRESETS.filter(n=>(n.kind||'casa')===k);return L.length?`<div style="margin-top:10px"><div class="muted" style="font-size:12px;margin-bottom:4px">${t}</div><div class="chips">${L.map(n=>`<button data-a="nxLoad" data-v="${n.id}" aria-pressed="${E.from===n.id}">${esc(n.name)}</button>`).join('')}</div></div>`:'';}).join('');
 return`<div class="card"><h2>Partir de</h2>${grp}
  <div style="margin-top:10px"><div class="muted" style="font-size:12px;margin-bottom:4px">Seus</div><div class="chips">${NXLIB.map(n=>`<button data-a="nxLoad" data-v="${n.id}">★ ${esc(n.name)}</button>`).join('')}<button data-a="nxNew">Em branco</button></div></div>
  ${fromP&&fromP.best?`<div class="card flat" style="margin-top:12px"><h3 style="margin:0 0 4px">${esc(fromP.name)}</h3><div class="muted" style="font-size:12px">${esc(fromP.src)} · ${f1(fromP.dose)} g/kg</div>
   <p class="note" style="margin:8px 0 4px"><b class="c-ok">Indicado para:</b> ${esc(fromP.best)}</p><p class="note" style="margin:0 0 4px">${esc(fromP.note)}</p><p class="muted" style="font-size:11.5px;margin:0">Fonte: ${esc(fromP.ref)}</p></div>`:''}
  <details style="margin-top:10px"><summary class="t2" style="cursor:pointer;font-size:13px">Estudos promissores (${NEUTRO_STUDIES.length})</summary>${NEUTRO_STUDIES.map(x=>`<div class="kv" style="display:block;padding:8px 0"><b style="color:var(--t1)">${esc(x.n)}</b><div class="muted" style="font-size:12px">${esc(x.where)}</div><p class="note" style="margin:4px 0 0">${esc(x.res)} <span class="c-ok">Onde promete mais:</span> ${esc(x.best)}</p></div>`).join('')}<p class="note">Ainda sem uso consolidado em gelateria; ficam como referência, não como blend pronto.</p></details></div>
 <div class="crgrid">
  <div class="card crleft"><h2>Blend</h2>
   <div class="form" style="margin-bottom:10px;grid-template-columns:repeat(2,minmax(0,1fr))"><label class="field" style="grid-column:1/-1"><span class="lbl">Nome</span><input type="text" id="nx-name" data-i="nxName" value="${esc(E.name)}" maxlength="40"></label>
    <label class="field"><span class="lbl">Dose (g/kg)</span><input type="number" id="nx-dose" data-i="nxDose" value="${E.dose}" step=".5" min="0"></label>
    <label class="field"><span class="lbl">Pasteurização (°C)</span><input type="number" id="nx-past" data-i="proc" data-k="pastT" value="${pastT}" step="1"></label>
    <label class="field" style="grid-column:1/-1"><span class="lbl">Uso</span><select id="nx-dairy" data-c="nxDairy"><option value="1"${E.dairy?' selected':''}>Base láctea (com caseínas)</option><option value="0"${!E.dairy?' selected':''}>Sorbetto / vegano</option></select></label></div>
   <div class="crlist">${Object.keys(E.parts).map(k=>{const nc=NCOMP[k],e=b.eff[k]||0,r=nc.dose,st=NSTYLE[k];const stp=E.parts[k]>=100?10:E.parts[k]>=20?2:1;
    return`<div class="crrow"><span class="nm"><i class="sw" style="background:${st?st.col:'var(--t3)'}"></i>${esc(nc.n)}<small>${f1(b.sh[k]||0)}% do blend · <span class="${r?(e>r[1]*1.15?'c-warn':e<r[0]*.5?'':'c-ok'):''}">${f2(e)}% na mistura</span>${r?' (faixa '+fRg(r)+')':' · veículo'}</small></span><span class="stp"><button data-a="nxStep" data-v="${k}|${-stp}" aria-label="Menos">−</button><input type="number" id="nxg-${k}" data-i="nxG" data-k="${k}" value="${E.parts[k]}" min="0" step="${stp}" aria-label="Gramas de ${esc(nc.n)}"><button data-a="nxStep" data-v="${k}|${stp}" aria-label="Mais">+</button></span><button class="btn del" data-a="nxRm" data-v="${k}" aria-label="Remover">✕</button></div>`;}).join('')}</div>
   <select id="nx-add" data-c="nxAdd" style="margin-top:10px" aria-label="Adicionar componente"><option value="">+ adicionar componente…</option>${avail.map(k=>`<option value="${k}">${esc(NCOMP[k].n)}</option>`).join('')}</select>
   <p class="note">Pote de ${f0(tot)} g rende ${E.dose>0?f1(tot/E.dose):'—'} kg de calda${$cost(` · R$ ${f2(b.costKg)}/kg de blend · R$ ${f2(b.costPerKgMix)} por kg de calda`)}.</p>
   <div class="row"><button class="btn okb sm" data-a="nxSave">Salvar neutro</button><button class="btn sm" data-a="nxApply"${m.empty?' disabled':''}>Salvar e aplicar na receita</button>${E.id&&NXLIB.some(n=>n.id===E.id)?`<button class="btn del" data-a="nxDel">Excluir</button>`:''}</div></div>
  <div class="crcenter">
   <div class="card" style="padding:0;overflow:hidden"><div id="nsimHost" class="simhost"></div>
    <div class="simbar"><span class="muted" style="font-size:12px">${Object.keys(b.eff).filter(k=>NSTYLE[k]).map(k=>`<span style="color:${NSTYLE[k].col}">■</span> ${esc(NCOMP[k].n)}`).join(' · ')}${E.dairy?' · <span style="color:#f0ece4">●</span> caseínas':''} · <span class="c-ice">▪</span> água</span></div></div>
   <div class="card">${seal(p.perfect,'Rede equilibrada · neutro de padrão profissional','Hidratação completa, água imobilizada na faixa ideal e caseínas estáveis.')}
    ${pills(p.pills)}
    <p class="note" style="margin:10px 0 0">Perfil de funções${natTag('stabilizer-function')}</p>
    <div style="margin-top:8px">${NFUN.map(([k,n])=>`<div style="margin-bottom:8px"><div class="row" style="justify-content:space-between"><span class="t2" style="font-size:12.5px">${n}</span><span class="mono" style="font-size:11px">${b.P[k]}</span></div>${rbar(b.P[k],[55,85],0,100)}</div>`).join('')}</div></div>
  </div></div>
 ${hydCard(E,{...S.proc,pastT})}
 ${nxDesignCard(E)}
 <div class="card"><h2>Avaliação do blend</h2>${b.notes.map(n=>findHTML({sev:n.sev,area:'Neutro',title:n.t,why:'',fix:n.fix})).join('')}</div>
 ${nkbCard(E)}
 ${nxCompareCard(E)}
 <div class="card"><div class="row"><h2 style="margin:0">Teste na receita da bancada</h2><span class="sp"></span><button class="btn pri" data-a="nxTest"${m.empty?' disabled':''}>Simular troca</button></div>
  ${T?`<div class="tw" style="margin-top:10px"><table class="tbl"><thead><tr><th>Parâmetro</th><th class="r">Atual</th><th class="r">Com o blend</th></tr></thead><tbody>
   ${[['Índice',x=>x.sc,0],['Estabilizantes (%)',x=>x.m.hydro,2],['Congelada na vitrine (%)',x=>x.m.fzVit,0],['Cristalização',x=>x.m.ci,0],['Derretimento',x=>x.m.melt,0],['Overrun (%)',x=>x.m.ov,0],...(can.cost()?[['Custo (R$/kg)',x=>x.m.costKg,2]]:[])].map(([n,fn,d])=>`<tr><td>${n}</td><td class="r mono">${d===2?f2(fn(T.a)):f0(fn(T.a))}</td><td class="r mono c-ice">${d===2?f2(fn(T.b)):f0(fn(T.b))}</td></tr>`).join('')}</tbody></table></div>`:'<p class="note">Troca os estabilizantes da receita da bancada por este blend na dose indicada e compara.</p>'}</div>
 <div class="card flat"><p class="note" style="margin:0"><b style="color:var(--t2)">Como ler a simulação.</b> Cada goma aparece como cadeia com a forma real da molécula: jataí e guar longas e flexíveis (guar ramificada), xantana rígida, carragena em dupla hélice ligando caseínas, gelatina em tripla hélice, fibra de citros em feixes, inulina e acácia como glóbulos, lecitina e mono-diglicerídeos como tensoativos em gotas de gordura. A quantidade de cadeias segue a dose real na calda; o quanto cada uma se estende segue a cinética de hidratação (temperatura × tempo) do seu processo: abaixo da temperatura de hidratação elas ficam enoveladas. Os pontos azuis fortes são a água imobilizada pela rede; os fracos, água livre que vira gelo. Os cristais nos cantos crescem até o tamanho previsto.</p></div>`;}

/* ---------- LABORATÓRIO DE ESTABILIZAÇÃO (v18.5): ficha técnica com fonte e comparação de blends ---------- */
function nkbSrc(list,refs){return(list||[]).map(r=>{let i=refs.indexOf(r);if(i<0){refs.push(r);i=refs.length-1;}return`<sup class="mono c-ice">[${i+1}]</sup>`;}).join('');}
function nkbRefs(refs){return refs.length?`<ol class="note" style="margin:10px 0 0;padding-left:20px">${refs.map(r=>{const R=NREF[r];return`<li>${esc(R.c)}${R.t==='fabricante'?' <span class="muted">(fabricante)</span>':''}${R.u?` · <a href="${esc(R.u)}" target="_blank" rel="noopener">abrir</a>`:''}</li>`;}).join('')}</ol>`:'';}
function nkbCard(E){const inBlend=Object.keys(E.parts).filter(k=>NKB[k]&&+E.parts[k]>0);const all=Object.keys(NKB);
 const sel=NKB[U.nkbSel]?U.nkbSel:(inBlend[0]||'lbg'),K=NKB[sel],nc=NCOMP[sel],refs=[];
 const row=(lbl,v)=>`<div class="kv" style="display:block;padding:7px 0"><span class="t2" style="font-size:12px">${lbl}</span><div>${v&&v.t?esc(v.t)+nkbSrc(v.src,refs):'<span class="t3" style="font-family:var(--fb);font-style:italic">sem dado registrado</span>'}</div></div>`;
 const syn=NSYN.filter(x=>x.a===sel||x.b===sel);
 return`<div class="card" id="nkb-card"><h2>Ficha técnica dos componentes</h2>
  <p class="note" style="margin:0 0 10px">Só aparece o que uma fonte consultada afirma; o resto fica como "sem dado registrado". Sinergias são descritas, sem coeficiente numérico.</p>
  <div class="chips" role="group" aria-label="Componente">${all.map(k=>`<button data-a="nkbSel" data-v="${k}" aria-pressed="${k===sel}">${inBlend.includes(k)?'● ':''}${esc(NCOMP[k].n)}</button>`).join('')}</div>
  <div style="margin-top:12px"><div class="row" style="gap:8px;align-items:baseline"><h3 style="margin:0">${esc(nc.n)}</h3><span class="chip ${K.nat==='natural'||K.nat==='fermentação'?'ok':'warn'}">${esc(NNAT[K.nat]||K.nat)}</span></div>
   <p class="muted" style="font-size:12px;margin:4px 0 6px">${esc(K.ori)}</p>
   ${row('Hidratação e ativação',K.hyd)}${row('Gelificação',K.gel)}${row('Com leite (caseínas)',K.leite)}${row('Acidez',K.acido)}${row('Cálcio',K.calcio)}${row('Limites de processo',K.lim)}${row('Efeito estrutural',K.ef)}${row('Estrutura química',K.extra)}
   <div class="kv" style="display:block;padding:7px 0"><span class="t2" style="font-size:12px">Sinergias e interações documentadas</span><div>${syn.length?syn.map(x=>`<div>${esc(x.a===sel?(x.b==='leite'?'proteínas do leite':NCOMP[x.b].n):NCOMP[x.a].n)}: ${esc(x.t)}${nkbSrc(x.src,refs)}</div>`).join(''):'<span class="t3" style="font-family:var(--fb);font-style:italic">sem dado registrado</span>'}</div></div>
   <div class="kv" style="display:block;padding:7px 0"><span class="t2" style="font-size:12px">No modelo do app</span><div>${nc.dose?'Dose usual '+fRg(nc.dose)+'% da mistura · ':''}hidratação ${nc.hyd>20?'a '+nc.hyd+' °C':'a frio'} · funções ${NFUN.filter(([k])=>nc.f&&nc.f[k]).map(([k,n])=>n.toLowerCase()+' '+nc.f[k]).join(', ')||'—'}. <span class="muted">Prática do app, sem medição própria.</span></div></div>
   ${nkbRefs(refs)}</div>
  <details style="margin-top:10px"><summary class="t2" style="cursor:pointer;font-size:13px">Outros temas: proteínas, emulsificantes, fibras, maturação (${NKB_TOPICS.length})</summary>${(()=>{const r2=[];const h=NKB_TOPICS.map(x=>`<div class="kv" style="display:block;padding:8px 0"><b style="color:var(--t1)">${esc(x.n)}</b><div class="note" style="margin:2px 0 0">${esc(x.t)}${nkbSrc(x.src,r2)}</div></div>`).join('');return h+nkbRefs(r2);})()}</details></div>`;}
/* blends disponíveis para comparar: o que está no editor, os seus e os de referência */
const nxPool=E=>[{...E,id:'cur',name:(E.name||'Em edição')+' (no editor)',lotId:E.id}].concat(NXLIB.map(n=>({...n,lotId:n.id})),NEUTRO_PRESETS.map(n=>({...n,lotId:n.id})));
function nxCompareRows(list,dairy,pr){return list.map(nx=>{const b=analyzeBlend(nx,dairy);const keys={};for(const k in b.sh)if(NCOMP[k]&&NCOMP[k].dose)keys[k]=b.sh[k];
  const has=k=>(b.eff[k]||0)>0,galacto=has('lbg')||has('guar')||has('tara');
  const floc=dairy&&galacto&&!has('carr')&&!(has('citf')&&b.eff.citf>.1)&&!has('cmc');
  const tMin=Object.keys(keys).length?hydMinT(keys,pr):null;
  return{nx,b,tMin,floc,nonNat:blendNonNat(nx.parts),syn:blendSyn(Object.keys(b.eff),dairy),obs:nx.lotId?blendObserved(nx.lotId,LOTS):null};});}
function nxCompareCard(E){const pool=nxPool(E);let ids=(U.nxCmp||['cur',E.from&&E.from!==E.id?E.from:'nx_goff']).filter(id=>pool.some(n=>n.id===id));U.nxCmp=ids;
 const dairy=U.nxCmpDairy!=null?U.nxCmpDairy:!!E.dairy,pr={...S.proc};const R=nxCompareRows(ids.map(id=>pool.find(n=>n.id===id)),dairy,pr);
 const ob=(r,fn)=>!r.obs||!r.obs.n?'<span class="muted">—</span>':fn(r.obs);
 const rows=[
  ['Dose',r=>f1(r.nx.dose)+' g/kg'],
  ['Hidrocoloides na mistura',r=>f2(r.b.hydro)+'%'],
  ['Pasteurização para hidratar 95%',r=>r.tMin==null?(Object.keys(r.b.sh).some(k=>NCOMP[k]&&NCOMP[k].dose)?'<span class="c-warn">não chega até 95 °C</span>':'—'):(r.tMin<=40?'a frio':'≥ '+r.tMin+' °C')+` <span class="muted">(${fT(pr.pastHold)} ${pr.pastHoldU||'s'})</span>`],
  ...(dairy?[['Separação de soro com leite',r=>r.floc?'<span class="c-warn">risco</span>':'<span class="c-ok">protegido</span>']]:[]),
  ['Origem',r=>r.nonNat.length?'<span class="c-warn">'+esc(r.nonNat.map(k=>NCOMP[k].n).join(', '))+'</span>':'<span class="c-ok">natural</span>'],
  ['Sinergias documentadas',r=>r.syn.length?esc(r.syn.map(x=>x.b==='leite'?'carragena + leite':(NSHORT[x.a]||x.a)+' + '+(NSHORT[x.b]||x.b)).join(', ')):'<span class="muted">nenhuma</span>'],
  ['Anti-recristalização (estimativa)',r=>`<span class="mono">${r.b.P.anti}</span>`],['Corpo (estimativa)',r=>`<span class="mono">${r.b.P.corpo}</span>`],['Resistência ao derretimento (estimativa)',r=>`<span class="mono">${r.b.P.derr}</span>`],
  ...(can.cost()?[['Custo por kg de calda',r=>'R$ '+f2(r.b.costPerKgMix)]]:[]),
  ['Lotes feitos com o blend',r=>r.obs?String(r.obs.n):'<span class="muted">salve o blend</span>'],
  ['Derretido em 10 min (medido)',r=>ob(r,o=>o.melt.n?f0(o.melt.v)+'% <span class="muted">('+o.melt.n+')</span>'+(o.melt.nb?' · '+(o.melt.bias>=0?'+':'')+f0(o.melt.bias)+' vs previsto':''):'<span class="muted">sem medição</span>')],
  ['Overrun medido',r=>ob(r,o=>o.ov.n?f0(o.ov.v)+'% <span class="muted">('+o.ov.n+')</span>':'<span class="muted">sem medição</span>')],
  ['Sensorial "sem gelo" (1–5)',r=>ob(r,o=>o.sens.gelo.n?f1(o.sens.gelo.v)+' <span class="muted">('+o.sens.gelo.n+')</span>':'<span class="muted">sem ficha</span>')],
  ['Gelo percebido no dia',r=>ob(r,o=>o.icy.n?f0(o.icy.v)+' <span class="muted">('+o.icy.n+')</span>':'<span class="muted">não registrado</span>')]];
 return`<div class="card" id="nxcmp-card"><h2>Comparar blends</h2>
  <p class="note" style="margin:0 0 10px">Até 4 blends lado a lado: o que o modelo calcula e o que os seus lotes mediram.</p>
  <div class="chips" role="group" aria-label="Uso">${[[1,'Base láctea'],[0,'Sorbetto / vegano']].map(([v,n])=>`<button data-a="nxCmpUse" data-v="${v}" aria-pressed="${!!v===dairy}">${n}</button>`).join('')}</div>
  <div class="chips" role="group" aria-label="Blends" style="margin-top:8px">${pool.map(n=>`<button data-a="nxCmpT" data-v="${esc(n.id)}" aria-pressed="${ids.includes(n.id)}"${!ids.includes(n.id)&&ids.length>=4?' disabled':''}>${esc(n.name)}</button>`).join('')}</div>
  ${R.length?`<div class="tw" style="margin-top:12px"><table class="tbl" id="nxcmp-tbl"><thead><tr><th></th>${R.map(r=>`<th class="r">${esc(r.nx.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([n,fn])=>`<tr><td class="t2">${n}</td>${R.map(r=>`<td class="r">${fn(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="muted">Escolha os blends.</p>'}
  <p class="note" style="margin:10px 0 0">Funções de 0 a 100: ${natTag('stabilizer-function')||'estimativa prática'}. Os resultados dos lotes são observação, não experimento: os lotes diferem também em receita e processo. Para isolar o efeito do blend, use Lotes → Experimentos com a dose do neutro como fator.</p></div>`;}
