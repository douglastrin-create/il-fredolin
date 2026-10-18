/* v18.10 · salvar arquivo (download) é tela: saiu da camada de dados */
async function saveFile(name,data){try{const d=window.claude&&typeof window.claude.use==='function'?await claude.use('downloads'):null;if(d){await d.save({filename:name,data});toast('Arquivo pronto');return;}}catch(e){if(e&&e.code==='declined')return;}
 /* fora do artefato: download comum do navegador */
 try{if(APP_MODE==='app'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/octet-stream'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);toast('Arquivo pronto');return;}}catch(e){}
 U.exp=data;render();}
