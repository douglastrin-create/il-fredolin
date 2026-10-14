/* Il Fredolin · service worker (versão 423fe0b95a)
   Página e arquivos do app: busca na rede quando há conexão (sempre a versão mais nova) e usa a cópia guardada sem internet.
   Dados da equipe (Supabase) nunca passam por aqui: vão direto, com login. */
const CACHE='il-fredolin-423fe0b95a';
const CORE=['./','./index.html','./config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/favicon-64.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('il-fredolin-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const fromNet=(req,key)=>{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),4000);
 return fetch(req,{signal:ctl.signal}).then(r=>{clearTimeout(t);if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(key||req,cp));}return r;});};
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
 if(u.origin===location.origin){
  if(req.mode==='navigate'){e.respondWith(fromNet(req,'./index.html').catch(()=>caches.match('./index.html')));return;}
  e.respondWith(fromNet(req).catch(()=>caches.match(req,{ignoreSearch:true})));return;}
 if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
  e.respondWith(caches.match(req).then(hit=>{const net=fetch(req).then(r=>{caches.open(CACHE).then(c=>c.put(req,r.clone()));return r;}).catch(()=>hit);return hit||net;}));}
});
