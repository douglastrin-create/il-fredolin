/* ---------- componentes ---------- */
function rbar(v,r,min,max){if(!r)return'';const sc=x=>clamp((x-min)/(max-min)*100,0,100);const inside=v>=r[0]&&v<=r[1];const col=inside?'var(--ok)':(v<r[0]-(r[1]-r[0])*.5||v>r[1]+(r[1]-r[0])*.5)?'var(--crit)':'var(--warn)';
 return`<div class="rb" aria-hidden="true"><div class="band" style="left:${sc(r[0])}%;width:${sc(r[1])-sc(r[0])}%"></div><div class="pin" style="left:${sc(v)}%;background:${col}"></div></div>`;}
const stCls=(v,r)=>!r?'':v>=r[0]&&v<=r[1]?'c-ok':(v<r[0]-(r[1]-r[0])*.5||v>r[1]+(r[1]-r[0])*.5)?'c-crit':'c-warn';
function ring(v,size=96){const r=size/2-7,c=2*Math.PI*r,col={ok:'var(--ok)',warn:'var(--warn)',crit:'var(--crit)'}[scoreCls(v)];
 return`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Índice ${v} de 100"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c*v/100} ${c}" transform="rotate(-90 ${size/2} ${size/2})"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="${col}" style="font:800 ${size*.3}px var(--fd)">${v}</text></svg>`;}
function dexPickHTML(d){const nm=id=>id==='dextrosem'?'monoidratada':'anidra';const c=d.conv;
 return`<div class="row" style="gap:6px;align-items:center;margin:8px 0 4px;font-size:12.5px"><span class="t2">Sua dextrose:</span><button class="btn sm${d.pref==='dextrosem'?' okb':''}" data-a="dexForm" data-v="mono">Monoidratada</button><button class="btn sm${d.pref==='dextrose'?' okb':''}" data-a="dexForm" data-v="anid">Anidra</button></div>`+
 (c?`<div class="note" style="margin:4px 0 6px">Esta receita está com ${f1(c.g)} g de dextrose ${nm(c.from)}, e as sugestões seguem a forma da receita. Se no laboratório você pesa ${nm(c.to)}, converta antes: ${f1(c.g)} g ${nm(c.from)} = ${f1(c.g2)} g ${nm(c.to)} (mesma glicose, mesmo PAC).</div><div class="row acts"><button class="btn sm" data-a="dexConv" data-v="${c.from}:${c.to}">Converter para ${f1(c.g2)} g de dextrose ${nm(c.to)}</button></div>`:'');}
function findHTML(f){return`<div class="find"><div class="bar ${f.sev}"></div><div><div class="area">${SEVN[f.sev]} · ${esc(f.area)}</div><h3>${esc(f.title)}</h3>${f.why?`<p>${esc(f.why)}</p>`:''}${f.fix?`<div class="fix"><b>Solução</b>${esc(f.fix)}</div>`:''}${f.acts&&f.acts.length?`${f.dexPick?dexPickHTML(f.dexPick):''}<div class="row acts">${f.acts.map(x=>`<button class="btn sm okb" data-a="applyAct" data-v="${esc(x.ops.map(o=>o.join(':')).join(';'))}">Aplicar: ${esc(x.t)}</button>`).join('')}</div>`:''}</div></div>`;}
function fieldNum(id,label,val,step,hint,attrs=''){return`<label class="field"><span class="lbl">${label}</span><input type="number" id="${id}" data-i="proc" data-k="${id.slice(2)}" value="${val}" step="${step}" ${attrs}>${hint?`<span class="hint">${hint}</span>`:''}</label>`;}

/* ---------- utilidades de receita e gráficos ---------- */
const VCOL=['var(--ice)','var(--gold)','var(--ok)','var(--info)','var(--crit)'];
const stOf=(rec,tipo,vit)=>({tipo:tipo||S.tipo,vit:vit!=null?vit:S.vit,recipe:rec,proc:S.proc,brix:S.brix,costs:S.costs});
const ingOpts=(sel,filter)=>{const cats=[...new Set(ING.map(i=>i.cat))];return cats.map(c=>{const L=ING.filter(i=>i.cat===c&&i.id!=='nx_tmp'&&(!filter||filter(i)));return L.length?`<optgroup label="${esc(c)}">${L.map(i=>`<option value="${i.id}"${i.id===sel?' selected':''}>${esc(i.n)}</option>`).join('')}</optgroup>`:'';}).join('');};
const stabFilter=i=>i.cat==='Estabilizantes'||i.cat==='Meus neutros';
const recFromPairs=r=>r.map(([id,g])=>({id,g:Math.round(g*10)/10}));
function loadRecipe(name,tipo,vit,rec){S.execId=null;S.libId=null;S.name=name;S.tipo=tipo;S.vit=vit;S.recipe=rec.map(r=>({id:r.id,g:Math.round(r.g*10)/10}));S.brix={};S.comps=[];S.compBal=false;S.page='bancada';U.bal=null;normalizeState();}
const addVariant=(name,recipe)=>{if(S.lab.variants.length>=4)S.lab.variants.shift();S.lab.variants.push({name:name.slice(0,30),recipe:JSON.parse(JSON.stringify(recipe))});};
function miniCurves(list){/* list: [{name,m,col}] */
 const TM=Math.min(-25,Math.floor((+S.vit-2)/5)*5),W=640,H=230,L=40,R=12,Tp=12,B=30,tx=t=>L+(-t)/(-TM)*(W-L-R),ty=p=>Tp+(100-p)/100*(H-Tp-B);let g='';
 for(let p=0;p<=100;p+=25)g+=`<line x1="${L}" x2="${W-R}" y1="${ty(p)}" y2="${ty(p)}" stroke="var(--line)"/><text x="${L-6}" y="${ty(p)+4}" text-anchor="end" fill="var(--t3)" font-size="10">${p}%</text>`;
 for(let t=0;t>=TM;t-=5)g+=`<text x="${tx(t)}" y="${H-B+16}" text-anchor="middle" fill="var(--t3)" font-size="10">${t}°</text>`;
 const P=PROF[S.tipo];g+=`<rect x="${L}" y="${ty(P.fz[1])}" width="${W-L-R}" height="${ty(P.fz[0])-ty(P.fz[1])}" fill="rgba(110,231,183,.1)"/><line x1="${tx(S.vit)}" x2="${tx(S.vit)}" y1="${Tp}" y2="${H-B}" stroke="var(--t3)" stroke-dasharray="3 3"/>`;
 list.forEach(({m,col})=>{if(m.empty)return;let d='';for(let t=0;t>=TM;t-=.5)d+=(t===0?'M':'L')+tx(t).toFixed(1)+','+ty(m.fz(t)).toFixed(1);g+=`<path d="${d}" fill="none" stroke="${col}" stroke-width="2.2"/>`;});
 return`<div class="tw"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:460px;height:auto" role="img" aria-label="Curvas de congelamento comparadas">${g}</svg></div><div class="row note" style="gap:14px">${list.map(({name,col})=>`<span><span style="color:${col}">━</span> ${esc(name)}</span>`).join('')}<span>┆ vitrine ${f1(S.vit)} °C</span></div>`;}
const today=()=>new Date().toISOString().slice(0,10);
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const setPath=(o,p,v)=>{const ks=p.split('.');let a=o;ks.slice(0,-1).forEach(k=>{a[k]=a[k]||{};a=a[k];});a[ks[ks.length-1]]=v;};
function recipeSources(){const out=[{key:'cur',name:'Receita da bancada · '+(S.name||''),tipo:S.tipo,recipe:S.recipe}];
 LIB.forEach(l=>out.push({key:'lib:'+l.id,name:l.name,tipo:l.st.tipo,recipe:l.st.recipe}));
 PRESETS.forEach((p,k)=>out.push({key:'pre:'+k,name:'Base · '+p.name,tipo:p.tipo,recipe:recFromPairs(p.recipe)}));
 MASTERS.forEach((p,k)=>out.push({key:'mas:'+k,name:p.a+' · '+p.name,tipo:p.tipo,recipe:recFromPairs(p.recipe)}));return out;}
const srcByKey=k=>recipeSources().find(x=>x.key===k);
function radar(series,size=230){const ax=[['doce','Doçura'],['cremoso','Cremosidade'],['gelo','Sem gelo'],['corpo','Corpo'],['sabor','Sabor'],['derr','Derretimento'],['visual','Aparência']];const c=size/2,R=size/2-34;
 const pt=(i,v)=>{const a=-Math.PI/2+i/ax.length*2*Math.PI;return[c+Math.cos(a)*R*v/5,c+Math.sin(a)*R*v/5];};let g='';
 [1,2,3,4,5].forEach(v=>g+=`<polygon points="${ax.map((_,i)=>pt(i,v).join(',')).join(' ')}" fill="none" stroke="var(--line)"/>`);
 ax.forEach(([k,n],i)=>{const[x,y]=pt(i,5.9);g+=`<line x1="${c}" y1="${c}" x2="${pt(i,5)[0]}" y2="${pt(i,5)[1]}" stroke="var(--line)"/><text x="${x}" y="${y+3}" text-anchor="middle" fill="var(--t3)" font-size="9.5">${n}</text>`;});
 series.forEach(({v,col})=>{g+=`<polygon points="${ax.map(([k],i)=>pt(i,+v[k]||0).join(',')).join(' ')}" fill="${col}" fill-opacity=".15" stroke="${col}" stroke-width="2"/>`;});
 return`<svg viewBox="0 0 ${size} ${size}" style="width:100%;max-width:${size+40}px;height:auto" role="img" aria-label="Perfil sensorial">${g}</svg>`;}

/* cabeçalho e navegação: ver 45-shell.js */

