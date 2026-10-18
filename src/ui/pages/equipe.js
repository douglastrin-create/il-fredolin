function pgEquipe(){if(APP_MODE!=='app')return'';if(!U.team&&!U.teamBusy&&!U.teamErr)loadTeam();
 const I=U.invite||{email:'',role:'sous',name:''};const T=U.team||[];
 const roleSel=(id,val,attrs)=>`<select id="${id}" ${attrs}>${['maestro','chef','sous'].map(r=>`<option value="${r}"${r===val?' selected':''}>${ROLE_N[r]}</option>`).join('')}</select>`;
 return`<div class="pg"><div><h1>Equipe</h1><p class="lead">Quem entra no Il Fredolin e o que cada um pode fazer. O acesso é garantido pelo servidor: mesmo que alguém tente, o banco recusa o que o perfil não permite.</p></div>
 <div class="g3 roles">
  <div class="card flat"><h3>Maestro</h3><p class="note">Acesso total: receitas, laboratório, aprovação, custos, preços, estoque, backup e equipe.</p></div>
  <div class="card flat"><h3>Chef</h3><p class="note">Laboratório de criação: Bancada, Creator, neutros, ingredientes, biblioteca dos mestres; aprova receitas para execução. Não vê custos nem a equipe.</p></div>
  <div class="card flat"><h3>Sous Chef</h3><p class="note">Execução: vê só as receitas aprovadas (biblioteca Il Fredolin), a ficha de produção, alérgenos e defeitos; registra lotes e dá baixa no estoque. Não edita receitas.</p></div></div>
 <div class="card"><h2>Convidar</h2><div class="form">
  <label class="field" style="grid-column:span 2"><span class="lbl">E-mail da pessoa</span><input type="email" id="inv-email" data-i="invite" data-k="email" value="${esc(I.email)}" autocapitalize="off" placeholder="nome@exemplo.com"></label>
  <label class="field"><span class="lbl">Nome (opcional)</span><input type="text" id="inv-name" data-i="invite" data-k="name" value="${esc(I.name)}" maxlength="40"></label>
  <label class="field"><span class="lbl">Perfil</span>${roleSel('inv-role',I.role,'data-c="inviteRole"')}</label></div>
  <div class="row" style="margin-top:10px"><button class="btn okb" data-a="memInvite">Convidar</button></div>
  <p class="note">Depois do convite, a pessoa abre o app, toca em <b>Primeiro acesso</b> e cria a senha com este mesmo e-mail. Ela entra direto no perfil escolhido.</p></div>
 <div class="card"><div class="row"><h2 style="margin:0">Membros</h2><span class="sp"></span><button class="btn sm" data-a="teamReload">Atualizar</button></div>
  ${U.teamErr?`<p class="c-crit">${esc(U.teamErr)}</p>`:''}${U.teamBusy&&!T.length?'<p class="muted">Carregando…</p>':''}
  ${T.map(m=>{const me=m.email===ME.email;return`<div class="kv member"><span><b style="color:var(--t1)">${esc(m.name||m.email)}</b>${me?' <span class="chip">você</span>':''}<br><span class="muted" style="font-size:12px">${esc(m.email)} · ${m.user_id?'ativo':'convite pendente'}</span></span>
   <span class="row" style="justify-content:flex-end">${roleSel('mr-'+m.email.replace(/[^a-z0-9]/g,'_'),m.role,'data-c="memRole" data-k="'+esc(m.email)+'" aria-label="Perfil de '+esc(m.email)+'"')}
   ${me?'':U.memDel===m.email?`<button class="btn del" data-a="memDelYes" data-v="${esc(m.email)}">Remover</button><button class="btn sm" data-a="memDelNo">Cancelar</button>`:`<button class="btn del" data-a="memDel" data-v="${esc(m.email)}" aria-label="Remover ${esc(m.email)}">✕</button>`}</span></div>`;}).join('')}
 </div></div>`;}
/* conta (na página Conta e sincronização) */
function accountCard(pend){return`<div class="card"><div class="row"><div style="flex:1;min-width:200px"><h2 style="margin:0 0 4px">${esc(ME.email)}</h2><p class="t2" style="margin:0;font-size:13px">${ROLE_N[ROLE]} · ${esc(ME.wsName||'Il Fredolin')}</p></div>
 ${U.logoutAsk?`<span class="c-warn" style="font-size:12.5px">${pend} alteração(ões) ainda não enviada(s) ou recusada(s) serão perdidas. Exporte um backup antes.</span><button class="btn del" data-a="logoutYes">Sair mesmo assim</button><button class="btn sm" data-a="logoutNo">Cancelar</button>`:`<button class="btn" data-a="logout">Sair</button>`}</div>
 <p class="note">Ao sair, os dados deste aparelho são apagados (ficam na nuvem da equipe). Use isso em aparelhos compartilhados da produção.</p></div>${storageWarn()}${rejectedCard()}`;}
function storageWarn(){const k=Object.keys(LS.bad||{});return k.length?`<div class="card"><h2 class="c-crit">Gravação neste aparelho falhou</h2><p class="note">O navegador recusou gravar ${k.length} conjunto(s) de dados (${esc(k.join(', '))}), em geral por falta de espaço. O que já foi enviado à nuvem está seguro; o resto pode se perder ao fechar o app. Exporte um backup agora.</p></div>`:'';}
/* quarentena: alterações que o servidor recusou de forma definitiva (permissão, dado inválido). Continuam neste aparelho. */
function rejectedCard(){const R=SUPA_BACKEND.rejected||[];if(!R.length)return'';const why=s=>s===403?'sem permissão':s===400||s===422?'dado recusado':s===409?'editado em outro aparelho':s===413?'registro grande demais':'recusado ('+s+')';
 return`<div class="card"><h2>Alterações recusadas pelo servidor <span class="chip">${R.length}</span></h2>
 <p class="note">Elas continuam guardadas neste aparelho e não foram apagadas. Reenvie (por exemplo, depois de o Maestro ajustar seu perfil) ou exporte para não perder nada.</p>
 ${R.slice(0,8).map(q=>`<div class="kv"><span>${esc(q.row.col)} · ${esc(String(q.row.id).slice(0,40))}</span><span class="c-warn">${why(q.status)}</span></div>`).join('')}${R.length>8?`<p class="muted">… e mais ${R.length-8}.</p>`:''}
 <div class="row"><button class="btn pri" data-a="rejRetry">Tentar enviar de novo</button><button class="btn" data-a="rejExport">Exportar (JSON)</button>${U.rejDrop?`<button class="btn del" data-a="rejDropYes">Descartar de vez</button><button class="btn sm" data-a="rejDropNo">Cancelar</button>`:`<button class="btn del" data-a="rejDrop">Descartar…</button>`}</div></div>`;}

const TEAM_ACT={
 authGo:()=>AUTH.go(),
 authMode:v=>{AUTH.mode=v;AUTH.err='';AUTH.msg='';renderNow();},
 authRetry:async()=>{AUTH.err='';AUTH.state='loading';renderNow();await AUTH.membership();},
 logout:async()=>{if(APP_MODE!=='app')return;if(AUTH.state!=='ready'){await AUTH.signOut();return;}
  if(SUPA_BACKEND.pending()){await SUPA_BACKEND.sync();if(SUPA_BACKEND.pending()){U.logoutAsk=true;S.page='dados';render();return;}}await AUTH.signOut();},
 logoutYes:()=>AUTH.signOut(),logoutNo:()=>{U.logoutAsk=false;render();},
 rejRetry:()=>{const n=SUPA_BACKEND.retryRejected();toast(n+' alteração(ões) de volta à fila de envio');render();},
 rejExport:()=>saveFile('il-fredolin-recusadas-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(SUPA_BACKEND.rejected,null,1)),
 rejDrop:()=>{U.rejDrop=true;render();},rejDropNo:()=>{U.rejDrop=false;render();},
 rejDropYes:()=>{const n=SUPA_BACKEND.dropRejected();U.rejDrop=false;toast(n+' alteração(ões) descartada(s) da quarentena');render();},
 teamReload:()=>{U.team=null;U.teamErr='';render();},
 memInvite:async()=>{const I=U.invite||{};const email=String(I.email||'').trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return toast('Digite um e-mail válido.');
  try{await SB.req('POST','/rest/v1/members',{workspace_id:ME.ws,email,role:I.role||'sous',name:(I.name||'').trim()||null},{headers:{Prefer:'return=minimal'}});U.invite={email:'',role:I.role||'sous',name:''};U.team=null;render();toast('Convite criado para '+email);}
  catch(e){toast(e.message);}},
 memDel:v=>{U.memDel=v;render();},memDelNo:()=>{U.memDel=null;render();},
 memDelYes:async v=>{try{await SB.req('DELETE','/rest/v1/members?workspace_id=eq.'+ME.ws+'&email=eq.'+encodeURIComponent(v),null,{headers:{Prefer:'return=minimal'}});U.memDel=null;U.team=null;render();toast('Acesso removido');}catch(e){toast(e.message);}}
};
const TEAM_INP={auth:(v,t)=>{AUTH.f[t.dataset.k]=v;},invite:(v,t)=>{U.invite=U.invite||{email:'',role:'sous',name:''};U.invite[t.dataset.k]=v;}};
const TEAM_CHG={inviteRole:t=>{U.invite=U.invite||{email:'',role:'sous',name:''};U.invite.role=t.value;},
 memRole:t=>{const email=t.dataset.k,role=t.value;SB.req('PATCH','/rest/v1/members?workspace_id=eq.'+ME.ws+'&email=eq.'+encodeURIComponent(email),{role},{headers:{Prefer:'return=minimal'}})
  .then(()=>{toast(email+' agora é '+ROLE_N[role]);U.team=null;render();if(email===ME.email)AUTH.recheck();}).catch(e=>{toast(e.message);U.team=null;render();});return false;}};

