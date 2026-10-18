/* ==== 61-sets.js ==== */
/* ===================== SETS: ARTIGIANALE × PROFESSIONALE =====================
   O set é o conjunto de equipamentos onde a receita vai ser feita. A chave no cabeçalho troca o set inteiro:
   mantecadora, saída, endurecimento, armazenamento, forma de servir, maturação (geladeira ou maturador)
   e temperatura de serviço. A receita continua a mesma; o motor recalcula tudo na hora para o set escolhido.
   • Artigianale: o set de casa (Maqp1 Maestro Gelatiere + Panasonic NR-BB53), guardado neste aparelho.
   • Professionale: o laboratório da equipe. Fica guardado na nuvem da equipe (coleção "vit", registro set_pro),
     então todos os aparelhos usam os mesmos equipamentos; Maestro e Chef atualizam quando chegar equipamento novo.
   Campos do set (equipamento) × campos da receita (fruta antes/depois, perda no cozimento, porção, preço). */
const SET_KEYS=['machine','load','preChill','drawT','drawMin','blastT','hardMin','hardAuto','turboMin','storeT','storeFluct','serveFrom','poteMl','ambT','waitMin','equip','matT','matH','coolMin','pastT','pastHold','pastHoldU'];
const SETS={
 art:{n:'Artigianale',sub:'Maestro + Panasonic',proc:Object.assign({},EQUIP.casa_mg_pan.proc,{pastT:85,pastHold:30,pastHoldU:'s'}),vit:-14.5,mat:{fridge:'med',pos:'meio',reads:'',entryT:10,probe:'',fruitIn:0},
  gear:{past:'Panela + termômetro (85 °C)',matur:'Panasonic NR-BB53 (refrigerador)',mant:'Maqp1 Maestro Gelatiere',abat:'Freezer Panasonic com Turbo',vitr:'— (serviço do pote)',frz:'Panasonic NR-BB53 (freezer, Médio)'}},
 pro:{n:'Professionale',sub:'laboratório da equipe',proc:{machine:'horiz',pastT:85,pastHold:30,pastHoldU:'s',coolMin:60,matT:4,matH:8,drawT:-9,drawMin:10,blastT:-35,hardMin:40,hardAuto:0,turboMin:0,storeT:-20,storeFluct:1,serveFrom:'vitrine',poteMl:500,ambT:23,waitMin:10,equip:''},vit:-13,
  mat:{fridge:'maturador',pos:'meio',reads:'',entryT:4,probe:'',fruitIn:0},
  gear:{past:'Pasteurizadora (a definir)',matur:'Maturador com agitação (a definir)',mant:'Mantecadora horizontal (a definir)',abat:'Abatedor −35 °C (a definir)',vitr:'Vitrine −13 °C (a definir)',frz:'Freezer de estoque −20 °C (a definir)'}}};
const GEAR_N=[['past','Pasteurização'],['matur','Maturação'],['mant','Mantecadora'],['abat','Abatimento'],['vitr','Vitrine'],['frz','Armazenamento']];
const plainSet=o=>JSON.parse(JSON.stringify(o));
function setDefaults(k){const d=SETS[k];return{proc:plainSet(d.proc),vit:d.vit,mat:plainSet(d.mat),gear:plainSet(d.gear),at:0};}
const pickSet=p=>{const o={};SET_KEYS.forEach(k=>{if(p&&p[k]!==undefined)o[k]=p[k];});return o;};
/* estado inicial: quem já usava o conjunto de casa começa no Artigianale */
function setsInit(){const old=S.sets&&typeof S.sets==='object'?S.sets:{};const nw={};for(const k of['art','pro']){const d=setDefaults(k);const c=old[k];
  nw[k]=c&&typeof c==='object'?{proc:Object.assign(d.proc,pickSet(c.proc)),vit:isFinite(+c.vit)?+c.vit:d.vit,mat:Object.assign(d.mat,c.mat||{}),gear:Object.assign(d.gear,c.gear||{}),at:+c.at||0}:d;}
 if(S.set!=='art'&&S.set!=='pro')S.set=S.proc&&S.proc.equip==='casa_mg_pan'?'art':'pro';S.sets=nw;
 /* o set ativo nasce do que já estava no processo */
 const cur=S.sets[S.set];if(!cur.at){cur.proc=Object.assign(cur.proc,pickSet(S.proc));cur.vit=+S.vit;if(S.mat)cur.mat=Object.assign(cur.mat,S.mat);cur.at=1;}}
/* aplica o set ativo no estado (processo + temperatura de serviço + maturação) */
function setApply(){const c=S.sets[S.set];Object.assign(S.proc,plainSet(c.proc));if(S.proc.serveFrom!=='pote')S.vit=c.vit;S.mat=plainSet(c.mat);}
/* espelha o que o usuário ajusta no processo para o set ativo */
function setMirror(){const c=S.sets&&S.sets[S.set];if(!c)return;c.proc=pickSet(S.proc);c.vit=+S.vit;if(S.mat)c.mat=plainSet(S.mat);}
function setSwitch(k){if(!SETS[k]||k===S.set)return;setMirror();S.set=k;setApply();U.bal=null;U.atEx=null;if(typeof LIVE!=='undefined'){LIVE.key=null;LIVE.res=null;}}
/* nuvem da equipe: o set Professionale é um registro compartilhado */
let _setPush={last:null,t:null};
function setsAfterRender(){if(!S.sets)return;setMirror();
 if(S.set!=='pro'||!(ROLE==='maestro'||ROLE==='chef'))return;const c=S.sets.pro;const js=JSON.stringify({proc:c.proc,vit:c.vit,mat:c.mat,gear:c.gear});
 if(_setPush.last===null){_setPush.last=js;return;}if(js===_setPush.last)return;_setPush.last=js;clearTimeout(_setPush.t);
 _setPush.t=setTimeout(()=>{try{STORE.put('vit',{id:'set_pro',kind:'set',cfg:JSON.parse(js)});}catch(e){}},1500);}
function setsFromCloud(){const r=(VITS||[]).find(v=>v.id==='set_pro'&&v.cfg);if(!r||!S.sets)return;const c=S.sets.pro;if((r.updatedAt||0)<=(c.at||0))return;
 const cf=r.cfg;c.proc=Object.assign(setDefaults('pro').proc,pickSet(cf.proc));if(isFinite(+cf.vit))c.vit=+cf.vit;c.mat=Object.assign(setDefaults('pro').mat,cf.mat||{});c.gear=Object.assign(setDefaults('pro').gear,cf.gear||{});c.at=r.updatedAt;
 _setPush.last=JSON.stringify({proc:c.proc,vit:c.vit,mat:c.mat,gear:c.gear});if(S.set==='pro')setApply();}
/* carregar receita (biblioteca, mestres, execução, lotes) não troca o equipamento: o set ativo prevalece */
const SET_LOADERS=['load','preset','master','execRun','histLoad','lotBench','varToBench','genToBench','sensApply','cmpLoad','libVar'];
function setsWrap(A){SET_LOADERS.forEach(k=>{const f=A[k];if(typeof f!=='function')return;A[k]=function(...a){const r=f.apply(this,a);if(S.sets&&S.sets[S.set]){setApply();render();}return r;};});}
function setSwitchHTML(v){if(ROLE==='sous')return'';const cur=S.set||'art';
 return`<div class="setsw${v?' '+v:''}" role="radiogroup" aria-label="Set de equipamentos">${['art','pro'].map(k=>`<button role="radio" data-a="setSw" data-v="${k}" aria-checked="${cur===k}" title="${esc(SETS[k].n+' · '+SETS[k].sub)}"><b>${SETS[k].n}</b><small>${SETS[k].sub}</small></button>`).join('')}</div>`;}
/* a mesma receita nos dois sets, com o melhor balanceamento de cada um */
let _SETCMP={key:null,res:null};
function setCompare(){if(!S.sets||!S.sets.art||!S.sets.pro||!(S.recipe||[]).length)return null;const key=JSON.stringify([S.recipe,S.tipo,S.sets.art,S.sets.pro,S.brix,ING_VER]);if(_SETCMP.key===key)return _SETCMP.res;
 if(typeof requestAnimationFrame==='function'&&!setCompare.now){if(_SETCMP.pend!==key){_SETCMP.pend=key;clearTimeout(_SETCMP.t);_SETCMP.t=setTimeout(()=>{if(_SETCMP.pend!==key)return;setCompare.now=1;try{setCompare();}finally{setCompare.now=0;}render();},500);}return _SETCMP.res||'pending';}
 const res=['art','pro'].map(k=>{const c=S.sets[k];const st={...S,proc:Object.assign({},PROC0,S.proc,plainSet(c.proc)),vit:c.vit,mat:c.mat};const s2=stReal(st);const m=analyze(s2);if(m.empty)return null;const F=diagnose(s2,m);
  /* balanceador clássico (rápido); o do laboratório roda só no set ativo, pelo cartão de balanceamento ao vivo */
  let b=null;try{b=balance(s2);}catch(e){}
  const s3=b&&b.ok?{...s2,recipe:b.newRecipe}:null;const m3=s3?analyze(s3):null;
  return{k,serve:s2.vit,sc:score(s2,m,F).total,q:fineScore(s2,m,F),d:m.crystal,shelf:st.proc.serveFrom==='vitrine'?m.shelfVit:m.shelfStore,b,q3:m3?fineScore(s3,m3,diagnose(s3,m3)):null};});
 _SETCMP={key,res};return res;}
function setCompareCard(m){if(m.empty||ROLE==='sous')return'';const R=setCompare();if(R==='pending')return'<div class="card"><h2>Esta receita nos dois sets</h2><p class="note" style="margin:0">Calculando…</p></div>';if(!R||R.some(x=>!x))return'';
 return`<div class="card"><h2>Esta receita nos dois sets</h2>${R.map(x=>{const on=x.k===S.set;const ch=x.b&&x.b.ok?x.b.prop.map((p,i)=>({id:p.id,a:x.b.cur[i],g:p.g})).filter(p=>Math.abs(p.g-p.a)>=1):[];
  return`<div class="setcmp${on?' on':''}"><div class="row" style="justify-content:space-between"><b>${SETS[x.k].n}</b>${on?'<span class="chip ok">ativo</span>':`<button class="btn sm" data-a="setSw" data-v="${x.k}">Usar</button>`}</div>
   <div class="kv"><span>Serviço</span><span class="mono">${fT(Math.round(x.serve*10)/10)} °C</span></div><div class="kv"><span>Índice · fino</span><span class="mono">${x.sc} · ${f1(x.q)}</span></div>
   <div class="kv"><span>Cristal · vida ${x.k&&S.sets[x.k].proc.serveFrom==='vitrine'?'na vitrine':'no freezer'}</span><span class="mono">${f0(x.d)} µm · ${x.shelf>30?'30+':f0(x.shelf)} d</span></div>
   <p class="note" style="margin:4px 0 0">${ch.length?'Melhor balanceamento: '+ch.map(p=>esc(ING_BY[p.id]?ING_BY[p.id].n.split(' (')[0]:p.id)+' '+f0(p.a)+'→'+f0(p.g)+' g').join(' · ')+(x.q3!=null?' (fino '+f1(x.q3)+')':''):'Já no melhor ponto para este set.'}</p></div>`;}).join('')}</div>`;}
function setGearCard(){const k=S.set||'art',c=S.sets&&S.sets[k];if(!c)return'';const ed=k==='art'?can.edit():(ROLE==='maestro'||ROLE==='chef');
 return`<div class="card"><div class="row"><h2 style="margin:0">Set ${SETS[k].n}</h2><span class="sp"></span>${setSwitchHTML()}</div>
  <p class="note">${k==='pro'?'Equipamentos do laboratório da equipe. Fica salvo na nuvem da equipe: quando chegar um equipamento novo, atualize aqui e nos campos abaixo (mantecadora, saída, abatedor, vitrine, maturador) e todos os aparelhos passam a balancear para ele.':'Equipamentos de casa. Fica salvo neste aparelho.'}</p>
  <div class="form" style="grid-template-columns:repeat(3,minmax(0,1fr))">${GEAR_N.map(([g,n])=>`<label class="field"><span class="lbl">${n}</span><input type="text" id="gear-${g}" data-i="gear" data-k="${g}" value="${esc(c.gear[g]||'')}" maxlength="60"${ed?'':' readonly'}></label>`).join('')}</div></div>`;}
const SET_ACT={setSw:v=>{if(!SETS[v])return;setSwitch(v);render();toast('Set '+SETS[v].n+': processo e balanceamento recalculados');}};
const SET_INP={gear:(v,t)=>{const k=t.dataset.k;if(!GEAR_N.some(g=>g[0]===k))return;const c=S.sets&&S.sets[S.set];if(!c)return;if(S.set==='pro'&&!(ROLE==='maestro'||ROLE==='chef'))return;c.gear[k]=String(v).slice(0,60);render();}};

/* v17.7 · um só cartão de balanceamento: proposta ao vivo para o set ativo + a mesma receita no outro set (antes eram dois cartões) */
function setOtherLine(){if(ROLE==='sous')return'';const R=setCompare();if(R==='pending')return'<p class="note" style="margin:10px 0 0">Comparando com o outro set…</p>';if(!R||R.some(x=>!x))return'';
 const o=R.find(x=>x.k!==(S.set||'art'));if(!o)return'';const ch=o.b&&o.b.ok?o.b.prop.map((p,i)=>({id:p.id,a:o.b.cur[i],g:p.g})).filter(p=>Math.abs(p.g-p.a)>=1):[];
 const vida=S.sets[o.k]&&S.sets[o.k].proc.serveFrom==='vitrine'?'na vitrine':'no freezer';
 return`<div class="setcmp" style="margin-top:12px"><div class="row" style="justify-content:space-between"><b>No set ${SETS[o.k].n}</b><button class="btn sm" data-a="setSw" data-v="${o.k}">Usar este set</button></div>
  <p class="note" style="margin:4px 0 0">Serviço ${fT(Math.round(o.serve*10)/10)} °C · índice ${o.sc} (fino ${f1(o.q)}) · cristal ${f0(o.d)} µm · vida ${vida} ${o.shelf>30?'30+':f0(o.shelf)} d. ${ch.length?'Balanceado para ele: '+ch.map(p=>esc(ING_BY[p.id]?ING_BY[p.id].n.split(' (')[0]:p.id)+' '+f0(p.a)+'→'+f0(p.g)+' g').join(' · ')+(o.q3!=null?' (fino '+f1(o.q3)+')':'')+'.':'Já no melhor ponto para ele.'}</p></div>`;}
function balanceCard(m){const h=liveBalCard(m);if(!h)return'';const k=h.lastIndexOf('</div>');return h.slice(0,k)+setOtherLine()+h.slice(k);}

