# Il Fredolin · Auditoria v18 (Fases 0, 1 e 3 parcial)

**Branch:** `audit/next-gen-v18` · **Referência auditada:** `main` @ `52f99f0` (v17.12.1, 15/10/2026 18:18 −03)
**Data:** 17/10/2026 · **Produção (GitHub Pages / `main`):** não alterada.

Este documento separa três coisas que a especificação pede para não misturar:
**o que foi medido** (com o teste que reproduz), **o que foi lido no código** e **o que continua sem verificação**.

---

## 1. Linha de base (Fase 0)

| Item | Estado em `52f99f0` |
|---|---|
| Arquivos | `index.html` (766.467 B, 5.447 linhas), `config.js`, `sw.js`, `manifest.webmanifest`, `icons/`, `LEIAME.md` |
| Dependências de execução | **Nenhuma biblioteca externa.** Só Google Fonts (opcional, com cache) e o Supabase da equipe via `fetch` |
| Estrutura | O `index.html` já é a concatenação de **24 módulos** com marcadores `/* ==== NN-nome.js ==== */` (01-util … 70-app). O motor (01→33) é extraído em tempo de execução para um Web Worker (`workerSrc`) |
| Funções citadas na especificação | **33 de 33 existem** (fpdNorrish … masterIndex) |
| Bateria interna `runTests` | **24/24** em Node (1,85 s) e **24/24** no Chromium |
| Regressão `GOLDEN` | 88 valores de 8 bases. As entradas `mas0…masN` **não são testadas**: as receitas dos mestres ficam só no Supabase e o código público carrega 0 mestres |
| Esquema do banco (RLS) | `LEIAME.md` cita `supabase/schema.sql`, **mas o arquivo não está no repositório**. As políticas de segurança não puderam ser auditadas |
| Armazenamento local | `localStorage` (biblioteca, lotes, ingredientes, neutros, estoque, execução, vitrine, lápides, fila de envio, sessão) |

## 2. Integridade dos dados — defeitos confirmados e corrigidos

### 2.1 Perda silenciosa na fila de sincronização (crítico) — **corrigido**
`SUPA_BACKEND.flush`: quando um lote era recusado (400/401/403/409), o app reenviava item a item e **todo item que falhasse saía da fila**, com qualquer erro que não fosse "sem rede" — inclusive **sessão vencida (401)** e **falha passageira do servidor (5xx)**. Consequência em cadeia: `pending()` passava a 0, e o aviso "alterações não enviadas serão perdidas" ao sair da conta **não aparecia**.

- **Evidência:** `tests/node/regression-main.test.mjs` roda o código de `52f99f0` com um 503 no envio individual: a fila é esvaziada e `pending()` = 0.
- **Correção:** `sbPermanent()` classifica o erro. Passageiro (sem rede, 401, 429, 5xx) → para e mantém a fila; o reenvio é idempotente (upsert por `workspace_id,col,id`). Definitivo (400, 403, 404, 409, 413, 422) → **quarentena persistente** (`fredolin_app_rejected`), visível em *Conta e sincronização* com **Tentar de novo / Exportar JSON / Descartar** (descartar pede confirmação). `pending()` inclui a quarentena. Edição nova do mesmo registro substitui a versão da quarentena. Troca de perfil preserva fila e quarentena (`reset(true)`).
- **Testes:** `tests/node/sync.test.mjs` (6 cenários).

### 2.2 Falha de gravação local engolida (alto) — **corrigido**
`LS.set` tinha `catch(e){}`: com a cota do Safari cheia (ou modo privado), biblioteca, lotes **e a própria fila de envio** podiam deixar de ser gravados sem aviso.
- **Correção:** `LS.set` devolve `true/false`, registra chaves que falharam em `LS.bad`, mostra aviso (no máximo a cada 30 s) e um cartão permanente em *Conta e sincronização* até a gravação voltar a funcionar.
- **Teste:** cota simulada de 200 B em `sync.test.mjs`.

### 2.3 Riscos confirmados, ainda **não** corrigidos (próxima rodada)
| Risco | Onde | Por que não foi corrigido agora |
|---|---|---|
| Conflito decidido pelo relógio do aparelho (`updatedAt = Date.now()`) | `STORE.put`, `SUPA_BACKEND.apply` | Exige versão por registro no banco (coluna/trigger), ou seja, mudança de esquema — precisa da sua autorização e do `schema.sql` |
| Estoque e lotes em "último que grava vence" no registro inteiro | coleção `inv` | Duas baixas simultâneas de estoque em aparelhos diferentes podem se sobrepor. Solução correta: lançamentos (movimentos) somados, não saldo sobrescrito — também mexe no banco |
| RLS, isolamento por espaço e separação de custos (`fin`) | servidor | Sem o `schema.sql` não há como verificar. A interface esconde custos do Chef/Sous, mas isso só vale se a RLS também bloquear |
| Revogação offline | `AUTH` | Por natureza não é instantânea sem rede; falta uma política explícita (ex.: validade máxima do acesso offline) |

## 3. Credibilidade científica dos modelos (Fase 1)

Classes: **D** determinístico/balanço · **M** mecanístico · **SE** semiempírico · **H** heurístico · **I** ilustrativo · **C** ajustável pelos lotes. Nenhum modelo do app está **validado experimentalmente** neste momento: não há conjunto de medições independentes versionado.

| Grandeza / função | Classe | O que foi verificado | Limite principal |
|---|---|---|---|
| Composição, sólidos, PAC, POD, balanço de massa (`analyzeRaw`) | D | Teste interno: 313 ingredientes somam 98–100,6% | Dados de composição sem fonte e incerteza por ingrediente |
| Depressão do ponto de congelamento (`fpdSE`) | SE | Tabela Goff–Hartel ≤ 180 g/100 g água; acima, Norrish (K = −6,47) + Clausius–Clapeyron, emenda contínua. **Medido:** monotônica, invertível, sem salto em 180 g | ΔHf constante (ignora ΔCp gelo–água) na fase muito concentrada; equivalência de sacarose para todos os solutos |
| Sais do leite (Leighton 2,37·MSNF/água) | SE | Leite integral → −0,56 °C (literatura ≈ −0,52 °C) | Sais de outras fontes e ácidos não entram |
| Fração congelada, água não congelável (Cg′ = 400 g) | M (sobre SE) | **Medido:** cresce com o frio e para no Cg′ | Cg′ único da sacarose para todas as misturas |
| Simulação térmica `heatSim` (pote, endurecimento) | M reduzido | **Medido:** erro de energia ≤ 0,7%; malha N = 10 vs 40: < 1%; concorda com referência independente por entalpia (194 vs 195 min) | Ver §3.1 |
| Viscosidade (`mixViscosity`) | SE/H | Krieger–Dougherty com expoente coerente (−[η]φm = −1,6) | Coeficientes da fase sérica e `VISK` dos hidrocoloides sem fonte medida |
| Overrun (`ovModel`) | H + C | Soma de incrementos por processo, limitada ao teto da máquina; corrigida pelos lotes medidos | Não é previsão física de aeração |
| Desestabilização da gordura | H | Combinação linear | Sem dado de tamanho de glóbulo |
| Tamanho de cristal (`m.crystal`) | **H** | É um **índice 0–100 convertido em µm** (28 + 0,6·(100 − índice)) | Mostrado em µm, o que sugere medição. Ver §3.2 |
| Recristalização / horizonte de textura (`shelfVit`) | SE sobre H | Forma d³ ∝ t (amadurecimento de Ostwald) + WLF com constantes universais | Constante de taxa 9000 µm³/dia não calibrada; parte de um cristal heurístico |
| Tg′ da fase concentrada | SE | Média ponderada de Tg′ dos solutos | Não é Gordon–Taylor/Couchman–Karasz |
| pH (`chemistry`) | H | Fonte ácida dominante diluída × tampão do leite | Não resolve equilíbrio ácido-base; ignora pKa e sais. Indicador, não medição |
| Doçura percebida por temperatura, aroma | H | — | Sem painel sensorial que sustente os coeficientes |
| Textura na colher, quenelle (`quenelleModel`) | SE + H + C | Fração de gelo em volume (base física) + coesão heurística | Coeficientes ajustados por lotes, sem validação independente |
| Mantecadora (`maqEnergy`/`maqPlan`) | M simples + C | Balanço de energia correto (sensível + latente 334 kJ/kg) | Capacidade líquida constante, deduzida do ciclo do próprio usuário; `batchMax: 2000` g sem fonte |
| Incerteza (`uncertainty`) | H | Perturba grupos de ingredientes um a um, soma quadrática + 0,4 °C fixo, faixa ±1,65 σ | Ignora correlações; cobertura de 90% **nunca foi verificada** contra medições |
| Calibração "bayesiana" (`fitCalibration`) | C | É a **média posterior de um modelo normal–normal com razão de variâncias fixa** (equivale a 3 lotes de prior em zero) | Não estima variância nem dá intervalo posterior; transformações (−0,8, /3,5, −1,2, −3) são heurísticas |

### 3.1 A suspeita sobre o `heatSim` não se confirmou
A especificação apontava inconsistência entre recipiente cilíndrico e discretização esférica. O código usa uma esfera com o **mesmo raio** de um pote cilíndrico com altura = diâmetro: isso preserva a razão volume/área (r/3) e a distância do centro à superfície, que são o que governam o tempo de troca térmica. A esfera tem 2/3 do volume do pote, o que não afeta temperaturas (grandeza intensiva). Numericamente o esquema conserva energia e converge (teste `engine.test.mjs`). **O limite real é de modelo, não de numérica:** h = 10/14 W/m²K estimados, sem parede e tampa do pote, sem contato com a prateleira, potes reais raramente têm H = D. O próximo ganho vem de **medir** o centro do pote (termômetro de espeto) e calibrar h — não de refinar a malha.

### 3.2 Vida útil × validade — **corrigido nos rótulos**
O horizonte de textura (cristais até ~50 µm) aparecia como **"Vida útil prevista"** no laudo e **"Validade prevista / Passou da validade"** na Produção ao vivo. No Brasil, "validade" é prazo sanitário e legal. O número vem de um modelo heurístico de cristais e **não diz nada sobre segurança microbiológica**. Agora: *"Estabilidade da textura (estimativa)"*, *"Textura estável por ~…"*, *"Passou do horizonte de textura previsto · não é validade sanitária"*, com nota explicando a diferença. Os cálculos e alertas continuam iguais.

## 4. Arquitetura de computação (Fase 2 — conclusão preliminar)

Medição em Node 22 (`analyze` sem cache, receita Fiordilatte):

| Operação | Tempo |
|---|---|
| `analyze` (análise completa) | 0,30 ms |
| Incerteza | 0,6 ms |
| Pote saindo do freezer (`poteModel`) | 9 ms |
| Endurecimento até −18 °C no centro (`hardenModel`) | 14 ms |

Num iPhone espera-se algo como 2–4× isso: ainda abaixo de 60 ms. **Recomendação: Alternativa A** (motor modular em JavaScript/TypeScript, Web Workers para simulações), mantendo o empacotamento num único arquivo para o GitHub Pages. Rust/WebAssembly só se justifica quando surgir um modelo com custo real (ex.: transferência de calor 2-D/3-D, inferência por MCMC com > 10⁵ avaliações, otimização multiobjetivo pesada). Hoje adicionaria toolchain, tamanho e risco no Safari sem ganho mensurável. Benchmarks em aparelhos reais (iPhone, iPad, Mac) ainda precisam ser feitos.

## 5. O que foi entregue nesta rodada

| Arquivo | Mudança |
|---|---|
| `index.html` | Fila de sincronização com quarentena; `LS.set` com detecção de falha; cartões de aviso; rótulos de textura × validade. Nenhuma função removida, nenhum cálculo alterado (GOLDEN idêntico) |
| `tests/node/harness.mjs` | Extrai os módulos reais do `index.html` pelos marcadores e os roda em Node |
| `tests/node/engine.test.mjs` | `runTests` + propriedades da curva de congelamento + conservação/convergência térmica contra referência por entalpia |
| `tests/node/sync.test.mjs` | 7 cenários de fila, recusa, quarentena, troca de perfil e cota cheia |
| `tests/node/regression-main.test.mjs` | Reproduz a perda de dados na v17.12.1 (remover após o merge) |
| `tests/e2e/smoke.mjs` | App no navegador: 24 páginas desenhadas, 24/24 testes internos, telas novas presentes |
| `.github/workflows/testes.yml` | CI em toda branch que não seja `main`: Node + Chromium + **WebKit** |
| `docs/model-registry.json` | Registro máquina-legível da classe, fonte e limite de cada modelo |

**Resultados locais:** Node 12/12 testes (motor 4, sincronização 7, regressão 1) · Chromium: 24 páginas sem erro, 24/24 internos · WebKit: **não executado aqui** (download bloqueado no ambiente); roda no CI do GitHub.

## 6. Para publicar (requer sua autorização)
1. Conferir a execução do workflow *Testes* na branch (inclui WebKit).
2. Testar no iPhone pela URL da branch ou após merge: abrir, trabalhar offline, fechar e reabrir.
3. Atualizar a versão no `sw.js` (`CACHE='il-fredolin-…'`) junto com o merge.
4. Fazer o merge em `main`.

## 7. Próximas fases, em ordem de prioridade (seção 53 da especificação)
1. **Banco:** versionar `supabase/schema.sql` no repositório e auditar RLS (custos `fin`, isolamento por espaço, perfis).
2. **Conflitos:** versão por registro no servidor; estoque por movimentos em vez de saldo.
3. **Backup:** exportação completa automática e restauração testada antes de migrar `localStorage` → IndexedDB.
4. **Rótulos de natureza do resultado** na interface (medido · calculado · estimado · heurístico), lendo `docs/model-registry.json`.
5. **Medições de baixo custo** que mais reduzem incerteza: temperatura do centro do pote no endurecimento e na espera (calibra h), overrun por copo, temperatura de extração da Maestro.
6. Só então: novas famílias, design inverso, DoE.

## 8. Limitações desta auditoria
- RLS e funções do banco não auditadas (esquema ausente do repositório).
- Nada foi testado em Safari/iOS real neste ambiente.
- Receitas dos mestres não foram testadas (ficam só no Supabase).
- A auditoria das 1.100 linhas do motor foi feita por leitura das funções listadas e por teste das propriedades físicas; os ~35 defeitos do diagnóstico e os geradores de receita não foram revisados um a um.
