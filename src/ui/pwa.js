/* ==== 68-pwa.js ==== */
/* ===================== IL FREDOLIN · APLICATIVO INSTALÁVEL =====================
   Service worker: guarda o app para funcionar sem internet e busca a versão nova quando há conexão. */
if(APP_MODE==='app'&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
 /* v17.7.1 · atualização: o app procura versão nova ao abrir, ao voltar para a tela e a cada 20 min; quando ela chega, avisa e recarrega com um toque */
 const hadCtl=!!navigator.serviceWorker.controller;let shown=false;
 const offerReload=()=>{if(shown)return;shown=true;try{const e=document.getElementById('toast');if(!e){location.reload();return;}
  e.innerHTML='<span>Nova versão do Il Fredolin disponível</span><button data-a="appReload">Atualizar agora</button>';e.hidden=false;clearTimeout(tt);}catch(x){location.reload();}};
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtl)offerReload();});
 window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
  const up=()=>{try{reg.update();}catch(e){}};document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')up();});setInterval(up,20*60*1000);
  if(reg.waiting&&hadCtl)offerReload();}).catch(()=>{});});}

