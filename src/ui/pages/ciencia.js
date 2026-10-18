/* ===================== CIÊNCIA DO MOTOR (v18.8 · §46–48) =====================
   Ficha de cada modelo (equação, parâmetros com unidade e fonte, hipóteses, validade, método, tolerância, incerteza,
   calibração, verificação e validação) e os três níveis de avaliação, com a validação calculada dos seus lotes.
   O registro vem de docs/model-registry.json, embutido pelo build. Campo null aparece como "não estabelecido". */
const MODEL_REGISTRY=/*__MODEL_REGISTRY__*/null;
const SCI_CLS={D:'determinístico',M:'mecanístico',SE:'semiempírico',H:'heurístico',C:'calibrável',V:'validado'};
const SCI_ST={'sem dados':'muted','evidência inicial':'warn','avaliado':'info','dentro da tolerância':'ok'};
const sciNone='<span class="t3" style="font-style:italic">não estabelecido</span>';
function sciVal(){const k=CAL.ver+':'+LOTS.length;if(U.sciVal&&U.sciVal.k===k)return U.sciVal.v;const v=validateLOO(CAL.res||[]);U.sciVal={k,v};return v;}
function sciModelCard(M,V){const open=U.sciOpen===M.id;const vq=Object.entries(VAL_Q).filter(([,q])=>q.model===M.id).map(([k])=>k);
 const lst=a=>a&&a.length?`<ul style="margin:2px 0 0;padding-left:18px">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:sciNone;
 const row=(n,v)=>`<div class="kv" style="display:block;padding:6px 0"><span class="t2" style="font-size:12px">${n}</span><div>${v}</div></div>`;
 const txt=v=>v==null||v===''?sciNone:esc(String(v));
 const sw=(M.verification&&M.verification.software)||[],ma=(M.verification&&M.verification.math)||[];
 const vst=vq.map(q=>V[q]&&V[q].all.status).filter(Boolean);
 return`<details class="card" id="sci-${esc(M.id)}"${open?' open':''}><summary style="cursor:pointer;list-style:none"><div class="row" style="gap:6px;align-items:baseline"><b>${esc(M.name||M.id)}</b>${M.class.map(c=>`<span class="chip ${c==='H'?'warn':c==='M'||c==='D'?'ok':'info'}">${SCI_CLS[c]||c}</span>`).join('')}<span class="sp"></span>${vst.map(s=>`<span class="chip ${SCI_ST[s]||''}">${esc(s)}</span>`).join('')}</div></summary>
  ${row('Equação',txt(M.equation))}
  ${row('Parâmetros',M.parameters&&M.parameters.length?`<ul style="margin:2px 0 0;padding-left:18px">${M.parameters.map(p=>`<li><span class="mono">${esc(p.n)}</span>${p.v!==''&&p.v!=null?' = '+esc(String(p.v)):''}${p.unit?' <span class="muted">('+esc(p.unit)+')</span>':''} · ${p.src?esc(p.src):'<span class="c-warn">sem fonte</span>'}</li>`).join('')}</ul>`:sciNone)}
  ${row('Saídas e unidades',M.outputs&&M.outputs.length?M.outputs.map(o=>`<span class="mono">${esc(o.k)}</span> <span class="muted">${esc(o.unit)}</span>`).join(' · '):sciNone)}
  ${row('Hipóteses',lst(M.hypotheses))}
  ${row('Onde vale',txt(M.validity))}${row('Origem dos dados',txt(M.dataOrigin))}${row('Método numérico',txt(M.method))}
  ${row('Tolerância para validação',M.tolerance?Object.entries(M.tolerance).map(([k,v])=>esc(k)+' ±'+esc(String(v[0]))+' '+esc(v[1])).join('; '):sciNone)}
  ${row('Incerteza',txt(M.uncertainty))}${row('Calibração',txt(M.calibration))}
  ${row('Limites conhecidos',txt(M.limits))}
  ${row('Verificação de software',sw.length?lst(sw):'<span class="c-warn">nenhum teste específico</span>')}
  ${row('Verificação matemática',ma.length?lst(ma):'<span class="muted">nenhuma (fórmula fechada ou sem propriedade testável registrada)</span>')}
  ${row('Validação com os seus lotes',vq.length?vq.map(q=>sciValLine(q,V[q])).join(''):'<span class="muted">grandeza sem medição prevista no lote</span>')}
  <p class="muted" style="font-size:11.5px;margin:8px 0 0">Versão do modelo: ${esc(M.version||'?')} · id <span class="mono">${esc(M.id)}</span></p></details>`;}
function sciValLine(q,R){if(!R)return'';const a=R.all,f2_=v=>v==null?'—':f1(v);
 return`<div style="margin:2px 0 6px"><b>${esc(R.n)}</b> · ${a.n} lote(s) · ${a.n?`erro fora-da-amostra ${f2_(a.loo.rmse)} ${esc(R.u)} (tolerância ${f1(R.tol)})${R.cal?` · sem calibração ${f2_(a.raw.rmse)}`:''}`:'nenhuma medição'} <span class="chip ${SCI_ST[a.status]||''}">${esc(a.status)}</span>
  ${Object.keys(R.fam).length>1||(Object.keys(R.fam).length===1&&a.n)?`<div class="muted" style="font-size:12px">${Object.entries(R.fam).map(([t,s])=>`${esc((PROF[t]||{}).n||t)}: ${s.n} · ${s.n?f1(s.loo.rmse)+' '+esc(R.u):''} (${esc(s.status)})`).join(' · ')}</div>`:''}</div>`;}
function pgCiencia(){const R=MODEL_REGISTRY;if(!R)return`<div class="pg"><h1>Ciência do motor</h1><p class="c-crit">Registro de modelos não embutido nesta versão.</p></div>`;
 const V=sciVal();const ms=R.models;
 const nSw=ms.filter(m=>m.verification&&m.verification.software.length).length,nMa=ms.filter(m=>m.verification&&m.verification.math.length).length;
 const vq=Object.keys(VAL_Q),nMeas=vq.reduce((a,q)=>a+V[q].all.n,0),nOk=vq.filter(q=>V[q].all.status==='dentro da tolerância').length;
 const byCls={};ms.forEach(m=>{const w=['H','SE','M','D'].find(c=>m.class.includes(c))||m.class[0];byCls[w]=(byCls[w]||0)+1;});
 return`<div class="pg"><div><h1>Ciência do motor</h1><p class="lead">De onde vem cada resultado, o que o modelo supõe, onde vale e o quanto já foi conferido com as suas medições.</p></div>
 <div class="card"><h2>Três níveis de avaliação</h2>
  <div class="kv"><span>1 · Verificação de software <span class="muted">(o programa executa o algoritmo certo)</span></span><span>${nSw} de ${ms.length} modelos com teste específico</span></div>
  <div class="kv"><span>2 · Verificação matemática <span class="muted">(conservação, estabilidade, convergência)</span></span><span>${nMa} de ${ms.length}</span></div>
  <div class="kv"><span>3 · Validação científica <span class="muted">(previsão × medição independente)</span></span><span>${nMeas} medição(ões) em ${vq.length} grandezas · ${nOk} dentro da tolerância</span></div>
  <p class="note" style="margin:10px 0 0">Os três são necessários e não se substituem: testes aprovados não são validação experimental. Nenhum modelo do app é classificado como validado — isso exige um conjunto de medições independente e revisado.</p>
  <p class="note" style="margin:6px 0 0">Natureza dos ${ms.length} modelos: ${Object.entries(byCls).map(([c,n])=>n+' '+SCI_CLS[c]+(n>1?'s':'')).join(' · ')}.</p></div>
 <div class="card" id="sci-val"><h2>Validação com os seus lotes</h2>
  <p class="note" style="margin:0 0 10px">Cada lote medido é previsto com a calibração feita <b>sem ele</b> (validação cruzada deixa-um-fora), para não conferir o modelo com o mesmo dado que o ajustou. Status: ${Object.entries(R.validationPolicy.statuses).map(([k,v])=>`<b>${esc(k)}</b> = ${esc(v)}`).join('; ')}.</p>
  <div class="tw"><table class="tbl"><thead><tr><th>Grandeza</th><th class="r">Lotes</th><th class="r">Erro fora-da-amostra</th><th class="r">Tolerância</th><th class="r">Status</th></tr></thead><tbody>
  ${vq.map(q=>{const r=V[q],a=r.all;return`<tr><td>${esc(r.n)}</td><td class="r mono">${a.n}</td><td class="r mono">${a.n?f1(a.loo.rmse)+' '+esc(r.u)+(Math.abs(a.loo.bias)>=.05?' <span class="muted">(viés '+(a.loo.bias>0?'+':'')+f1(a.loo.bias)+')</span>':''):'—'}</td><td class="r mono">±${f1(r.tol)}</td><td class="r"><span class="chip ${SCI_ST[a.status]||''}">${esc(a.status)}</span></td></tr>`;}).join('')}
  </tbody></table></div>
  ${nMeas?'':`<p class="note" style="margin:10px 0 0">Ainda não há lotes medidos. Registre em Lotes e qualidade: overrun pelo copo, derretido em 10 min, °Brix e pH da mistura, núcleo do pote no freezer e textura na vitrine. O laudo mostra "O que medir" em ordem de prioridade.</p>`}</div>
 <h2 style="margin:18px 0 8px">Modelos (${ms.length})</h2>
 ${ms.map(m=>sciModelCard(m,V)).join('')}
 <p class="muted" style="font-size:11.5px">Registro <span class="mono">${esc(R.schema)}</span> · auditado em ${esc(R.auditedCommit||'?')}. ${esc(R.validationNote||'')}</p></div>`;}
