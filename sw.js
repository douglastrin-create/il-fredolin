/* Il Fredolin · service worker (v18.7) — GERADO por tools/build.mjs a partir de src/sw/sw.js. Não edite o sw.js da raiz.
   Página e arquivos do app: busca na rede quando há conexão e usa a cópia guardada sem internet.
   Dados da equipe (Supabase) nunca passam por aqui: vão direto, com login.

   Integridade (§45 da especificação):
   · cache versionado: o nome do cache leva o hash do index.html desta versão; cada publicação gera um sw.js novo,
     o navegador instala, guarda a versão nova inteira e só então apaga a anterior;
   · atualização sem corrupção: na instalação o index.html baixado precisa ter exatamente o hash esperado (SHA-256).
     Se o servidor ainda entrega a versão anterior (propagação do GitHub Pages) ou uma página qualquer, a instalação
     falha e a versão anterior continua funcionando offline; o navegador tenta de novo depois;
   · só entra no cache o que foi conferido: uma resposta de erro, de outro endereço ou com conteúdo diferente nunca
     substitui a cópia guardada;
   · erro do servidor (404/500 durante uma publicação) mostra a cópia guardada, não a página de erro;
   · diagnóstico e reparo: o app pergunta o que está guardado (mensagem 'diag') e pode pedir para baixar de novo ('repair'). */
const VERSION='v18.14';
const INDEX_SHA='96f388162008405f541a2caf808c3d21b039ab67033406e7b19bfc922b5fdfbe';
const CACHE='il-fredolin-'+INDEX_SHA.slice(0,12);
const CORE=['./index.html','./config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/favicon-64.png','./icons/icon-maskable-512.png'];
const hex=buf=>Array.from(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');
const sha256=async buf=>hex(await crypto.subtle.digest('SHA-256',buf));
const sameOrigin=r=>{try{return new URL(r.url).origin===location.origin;}catch(e){return false;}};
/* resposta utilizável: 200, do próprio endereço (redirecionamento para outro site não serve) */
const usable=r=>!!r&&r.ok&&r.type!=='opaque'&&(!r.url||sameOrigin(r));
/* baixa e confere um arquivo do núcleo; o index.html precisa ter o hash desta versão */
async function fetchVerified(u){
 const r=await fetch(new Request(u,{cache:'reload',credentials:'same-origin'}));
 if(!usable(r))throw new Error(u+': resposta '+r.status);
 const buf=await r.clone().arrayBuffer();
 if(u==='./index.html'){const h=await sha256(buf);if(h!==INDEX_SHA)throw new Error('index.html com conteúdo diferente desta versão ('+h.slice(0,12)+' ≠ '+INDEX_SHA.slice(0,12)+')');}
 if(!buf.byteLength)throw new Error(u+': vazio');
 return r;}
/* guarda tudo ou nada: se um arquivo falhar, nada desta versão entra e a anterior continua */
/* cada cache guarda quando foi montado ('./__sw_meta'): a limpeza só apaga versões MAIS ANTIGAS que a própria.
   (v18.8: o service worker da v18.7 apagava qualquer cache que não fosse o dele, inclusive o da versão nova
   que já tinha assumido, se ainda terminava uma navegação. Ver selfHeal.) */
const META='./__sw_meta';
async function precache(){const got=[];for(const u of CORE)got.push([u,await fetchVerified(u)]);
 const c=await caches.open(CACHE);for(const [u,r] of got)await c.put(u,r);await c.put('./',(await c.match('./index.html')).clone());
 await c.put(META,new Response(JSON.stringify({ver:VERSION,sha:INDEX_SHA,at:Date.now()}),{headers:{'Content-Type':'application/json'}}));}
async function metaOf(name){try{const r=await (await caches.open(name)).match(META);return r?await r.json():null;}catch(e){return null;}}
async function complete(){if(!await caches.has(CACHE))return false;const c=await caches.open(CACHE);for(const u of CORE)if(!await c.match(u))return false;return true;}
/* autorreparo: se o cache desta versão sumiu ou ficou incompleto (ex.: apagado por um service worker antigo), baixa e confere de novo */
async function selfHeal(){if(await complete())return true;try{await precache();return true;}catch(e){return false;}}
self.addEventListener('install',e=>{e.waitUntil(precache().then(()=>self.skipWaiting()));});
/* apaga as versões antigas só se a desta estiver completa. Roda na ativação e de novo depois (navegação, diagnóstico):
   um service worker antigo ainda terminando pedidos pode recriar o próprio cache logo depois da ativação */
async function cleanup(){if(!await complete())return;const me=await metaOf(CACHE);const myAt=me&&me.at||0;
 const ks=(await caches.keys()).filter(k=>k.startsWith('il-fredolin-')&&k!==CACHE);
 for(const k of ks){const o=await metaOf(k);if(!o||o.at<myAt)await caches.delete(k);}}
self.addEventListener('activate',e=>{e.waitUntil(cleanup().then(()=>self.clients.claim()));});
/* procura no cache desta versão e, se faltar, em versões anteriores ainda guardadas */
async function fromCache(req){const own=await caches.open(CACHE);const hit=await own.match(req,{ignoreSearch:true});if(hit)return hit;return caches.match(req,{ignoreSearch:true});}
/* grava só se o cache desta versão ainda existe: um service worker antigo terminando pedidos não recria o cache apagado */
const putIfLive=async(k,r)=>{if(await caches.has(CACHE))await (await caches.open(CACHE)).put(k,r);};
/* rede com prazo; uma cópia nova só substitui a guardada se for exatamente a desta versão (index) ou uma resposta válida (demais) */
async function fromNet(req,key){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),4000);
 try{const r=await fetch(new Request(req.url,{cache:'no-cache',credentials:'same-origin'}),{signal:ctl.signal});clearTimeout(t);
  if(!usable(r))throw new Error('resposta '+r.status);
  const k=key||req;const isIndex=k==='./index.html';
  const cp=r.clone();(async()=>{try{if(isIndex){const h=await sha256(await cp.clone().arrayBuffer());if(h!==INDEX_SHA)return;}
   await putIfLive(k,cp);}catch(e){}})();
  return r;}
 catch(e){clearTimeout(t);throw e;}}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
 if(u.origin===location.origin){
  if(req.mode==='navigate'){e.waitUntil(new Promise(r=>setTimeout(r,3000)).then(selfHeal).then(ok=>ok&&cleanup()).catch(()=>{}));e.respondWith(fromNet(req,'./index.html').catch(async()=>(await fromCache('./index.html'))||(await fromCache('./'))||Response.error()));return;}
  if(u.pathname.endsWith('/sw.js'))return;
  e.respondWith(fromNet(req).catch(async()=>(await fromCache(req))||Response.error()));return;}
 if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
  e.respondWith(caches.match(req).then(hit=>{const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))putIfLive(req,r.clone()).catch(()=>{});return r;}).catch(()=>hit);return hit||net;}));}
});
/* diagnóstico e reparo pedidos pelo app */
self.addEventListener('message',e=>{const d=e.data||{};const port=e.ports&&e.ports[0];const reply=x=>{try{port?port.postMessage(x):e.source&&e.source.postMessage(x);}catch(err){}};
 if(d.type==='diag')e.waitUntil((async()=>{await cleanup().catch(()=>{});const c=await caches.open(CACHE);const have=[],miss=[];for(const u of CORE)((await c.match(u))?have:miss).push(u);
  let indexOk=false;try{const r=await c.match('./index.html');indexOk=!!r&&(await sha256(await r.arrayBuffer()))===INDEX_SHA;}catch(err){}
  const others=(await caches.keys()).filter(k=>k.startsWith('il-fredolin-')&&k!==CACHE);
  reply({type:'diag',version:VERSION,cache:CACHE,have,miss,indexOk,others});})());
 if(d.type==='repair')e.waitUntil(precache().then(()=>reply({type:'repair',ok:true})).catch(err=>reply({type:'repair',ok:false,msg:String(err&&err.message||err)})));
});
