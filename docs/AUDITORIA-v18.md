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
| Esquema do banco (RLS) | Ausente do repositório na `main`. Reconstruído do catálogo de produção em 17/10 → `supabase/schema.sql` (ver §5-C) |
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

### 2.3 Riscos de banco e concorrência — **tratados na rodada 3** (§5-C)
Conflito decidido pelo relógio do aparelho, estoque em "último que grava vence", RLS sem auditoria e markup visível a Chef/Sous: ver §5-C. Permanece só o limite natural de revogação offline (documentado em `supabase/README.md`).

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

## 5-B. Segunda rodada (mesma branch)

| Problema | Antes | Agora | Teste |
|---|---|---|---|
| **Backup incompleto** | Exportava só a vitrine principal; set Professionale e lápides ficavam de fora | Todas as coleções (`vits` completa), lápides e `schema: 2`; formato antigo continua aceito | `backup.test.mjs` |
| **Restauração destrutiva** | Cada item importado era gravado como "agora": um backup antigo sobrescrevia na nuvem as edições mais novas da equipe | Plano antes de gravar (`planImport`, função pura): novos, atualizados, **mantidos** (o daqui é igual ou mais novo) e apagados-aqui (só voltam se marcado). Confirmação explícita | `backup.test.mjs`, E2E |
| **Quarentena inacessível ao Sous Chef** | As ações novas não estavam em `ALWAYS_ACT`: Sous recebia "sem acesso" para a própria fila | Liberadas para todos os perfis; restaurar backup só Maestro | `backup.test.mjs` (perfis) |
| **Heurística com cara de medição** | pH, viscosidade, overrun, cristal (µm), estabilidade da textura e Tg′ sem indicação de natureza | Etiqueta "heurístico/semiempírico" com explicação; overrun mostra "calibrado por N lotes" quando houver | `registry.test.mjs` mantém a interface igual ao `model-registry.json` (pegou a viscosidade rotulada acima da classe registrada) |
| Ícone *maskable* fora do cache offline | — | Incluído no `sw.js` | — |
| CI podia passar sem WebKit | Motor ausente era "pulado" | No CI, motor ausente reprova | — |

**Offline real (Chromium):** service worker instalado, rede cortada, recarregar e reabrir em aba nova: app abre e `runTests` passa 24/24 sem rede (`tests/e2e/smoke.mjs`).

**Resultados:** Node 21/21 · Chromium 24 páginas, 24/24 internos, offline OK · CI do commit `d4fca4e`: verde nos dois jobs.

## 5-C. Terceira rodada — banco de dados (autorizada em 17/10/2026)

**Auditoria do esquema real** (catálogo enviado pelo Maestro). O núcleo de segurança está bem construído: RLS ligada nas 4 tabelas; leitura e escrita por perfil via `can_read`/`can_write`; custos isolados em `fin`; autor (`updated_by`) e hora (`srv_at`) gravados pelo servidor; sem exclusão física; trava de "sempre um Maestro". Em `tests/db/policies.sql`, o esquema atual passa em **21 de 29** verificações e falha em **8**:

| Falha no esquema atual | Severidade | Correção (migração 001 + app) |
|---|---|---|
| Convite reivindicável com e-mail não confirmado (2 testes) | Alta **se** "Confirm email" estiver desligado no Auth; nula se ligado | `claim_invites`/`create_workspace` exigem `email_confirmed_at` |
| Gravação com relógio atrasado descartada em silêncio (`return null`); sem versão por registro (2) | Média: perda invisível de edições | Coluna `ver`; app envia `base_ver`; conflito = **409** → quarentena; "Tentar de novo" envia `force`. Depois de um conflito, a versão do servidor vale no aparelho (a do usuário fica na quarentena) |
| Markup visível a Chef (receitas) e Sous (execuções e lotes), inclusive regravado por app antigo (3) | Baixa–média: política de preço | Markup migra para `fin` (`mk:<col>:<id>`); app separa ao gravar; o gatilho do banco retira de qualquer app |
| Sous podia alterar uma baixa de estoque registrada (1) | Baixa | Movimentos de estoque só alteráveis pelo Maestro |

**Estoque por movimentos (app).** A baixa FEFO alterava o saldo dentro da entrada e regravava o registro inteiro. Com isso, duas baixas concorrentes se sobrescreviam e baixar o mesmo lote duas vezes descontava duas vezes. Agora cada baixa é um movimento com id determinístico (lote + ingrediente + entrada), só de inserção. Saldo = entrada − movimentos. Entradas antigas continuam valendo. Testes: `tests/node/stock.test.mjs` (6) e o botão real no navegador (dois toques → uma baixa).

**Evidência:**

| Verificação | Resultado |
|---|---|
| `tests/db/run.sh` (Postgres 16 com emulação do `auth` do Supabase) | Atual: 8 falhas · Migrado: **29/29** |
| `tests/db/roundtrip.sh` | Migrar → desfazer devolve esquema e dados idênticos; reaplicar é seguro |
| `tests/integration/run.sh`: código real de sincronização, dois aparelhos, PostgREST 12.2.3 | Banco antigo: app novo detecta o modo e sincroniza · Banco migrado: **6/6**, incluindo **app v17 sincronizando com o banco novo** |
| Node | 27/27 |
| Chromium | 24 páginas, 24/24 internos, baixa de estoque real, PWA offline |

**Erro meu corrigido nesta rodada:** na rodada 1 escrevi que o servidor sobrescrevia sem checar data. O gatilho `records_guard` já descartava gravações mais antigas. O problema real era o descarte **silencioso**.

**Não verificado:** a emulação do `auth` não é o GoTrue do Supabase. O ensaio num projeto Supabase de teste (`supabase/README.md`, passo 2) continua necessário antes de produção.

## 5-D. Implantação (17/10/2026)
| Etapa | Hora | Evidência |
|---|---|---|
| Backup exportado pelo Maestro | ~21:30 | — |
| Migração 001 no Supabase da equipe | 22:05 | `ver` ativa; convites exigem e-mail confirmado; 0 markup fora de `fin` (2 movidos); gatilho ligado |
| Migração 002 | 22:10 | anônimo sem EXECUTE nas 6 funções; `search_path` fixo; Security Advisor: restam 2 avisos (1 intencional, 1 de painel) |
| App v18.0 publicado (`main` = `9d128e1`, avanço direto) | 22:14 | CI verde nos 3 jobs antes do merge; GitHub Pages implantado com o mesmo commit; cache `il-fredolin-d50551d3dc` |

## 5-E. v18.1 — fidelidade científica sem novas medições (branch; publicação a autorizar)

| Entrega | O que faz | Evidência |
|---|---|---|
| **O que medir** (Laudo → nova seção; especificação §30) | Lista as medições que mais aumentariam a confiança nas previsões **desta** receita, com equipamento, procedimento e onde registrar. Ordem: efeito calculado pelo motor quando calculável (ex.: Brix da fruta em °C de serviço), senão a natureza do modelo; dividido pelos lotes que já o corrigiram; ponderado pelo custo de medir | `doe.test.mjs` (morango: Brix em 1º; Brix medido sai da lista; calibrado perde prioridade; laboratório atrás do caseiro) |
| **Experimentos** (Lotes e qualidade → nova aba; §28) | Fatorial 2^k (1–3 fatores) com réplicas, pontos centrais e ordem sorteada reproduzível; fatores de ingrediente mantêm o peso do lote (compensação, com corrida inviável sinalizada); um lote por corrida (o plano viaja no lote e sincroniza); análise por mínimos quadrados com efeitos, erro puro, p (t de Student) e termo próprio de curvatura | `doe.test.mjs` (p contra tabelas; recupera efeitos e interação plantados; curvatura não infla o erro; sem réplicas não inventa erro-padrão) e `tests/e2e/experiments.mjs` (fluxo completo pela interface: 13/13) |
| **pH medido** no lote | Campo novo; conta para a lista de medições | E2E |
| **Etiquetas de natureza** | + quenelle, gelo em volume, derretimento, doçura × temperatura; registro de modelos ganhou `melt` e `ice-volume` | `registry.test.mjs` |

**Correções feitas pelos próprios testes nesta rodada:** (1) o critério inicial de prioridade punha o Brix do morango, maior incerteza calculada, em 10º, por pesos arbitrários; trocado por critério baseado em efeito calculado. (2) A medição de textura recebia a incerteza total, inclusive a parte que vem do Brix das frutas; agora recebe só a parcela do modelo. (3) Sem termo de curvatura, os pontos centrais inflavam o erro residual (0,45 em vez de ~0,04) e enfraqueciam todos os testes de significância. (4) Rótulos: contagem negativa de termos descartados, faixa com duplo sinal, concordância.

**Limites honestos:** a prioridade de "O que medir" é uma ordem transparente, não um cálculo formal de valor da informação. A análise de experimentos vale só para os fatores e a faixa testados. Com poucos graus de liberdade (ex.: 1), o p é frágil.

## 5-F. v18.2 — calibração térmica pelo núcleo do pote

O núcleo medido no endurecimento era registrado e **nunca usado**. Agora ele calibra o coeficiente de troca de calor do freezer (14 W/m²K, estimativa de literatura), que define o tempo de endurecimento.

- **Lote:** novo campo "minutos no freezer". É preenchido sozinho quando o lote veio da Produção ao vivo (hora do evento de entrada no freezer).
- **Ajuste:** para cada lote, procura o h que faz a simulação térmica (verificada na rodada 1) chegar ao núcleo medido no mesmo tempo. Bisseção em log h, entre 3 e 80 W/m²K. Os lotes se combinam com encolhimento (prior de 2 lotes), e o resultado é aplicado ao endurecimento.
- **Informatividade:** cada medição é testada contra a precisão de um termômetro de espeto (±0,5 °C). Se esse erro muda h em mais de 60%, ela fica de fora, com o motivo mostrado no lote. Isso acontece quando o núcleo ainda está no patamar de congelamento ou já está em equilíbrio com o freezer. **Achado dos testes:** com saída a −5 °C, medições até ~60 min caem no patamar e não informam; o guia de medição diz isso ao usuário.
- **Desempenho:** ~145 ms por medição nova (Node), uma única vez. O resultado fica num cache no aparelho (hash, ≤300 entradas), e abrir o app não recalcula.
- **Testes:** `calib-thermal.test.mjs` recupera h = 8/14/25 com erro < 3% e descarta 4 tipos de medição sem informação. Também confere a combinação com encolhimento, a aplicação ao endurecimento e a volta ao valor de literatura sem lotes. No E2E, confere o preenchimento pela Produção ao vivo e a persistência do cache.

**Limite:** os dados de teste foram gerados pelo próprio modelo. Isso prova que o ajuste é correto e identificável, não que o modelo representa o seu freezer. Essa validação só virá com medições reais.

## 5-G. v18.3 — famílias de produto (especificação §20–21)

**Auditoria:** os 6 tipos originais eram todos variações de gelato de vitrine: mesma fração congelada no serviço (68–74%) e mesma saída (−11 a −7 °C). O motor comparava o tipo diretamente em 54 pontos, então um tipo novo cairia sempre nas regras de "crema".

**Infraestrutura:** cada perfil traz família, comportamento-base nas regras (`like`), processo (batch, soft, still, molded, scraped), contexto e temperatura de serviço, objetivo de cristal (fino ou grosso) e a origem das faixas (`src`, com `conf` = fonte ou prática). As 54 comparações passam por `tbase()`. Nos 6 tipos originais o resultado é **idêntico**: 24/24 internos e os 88 valores GOLDEN.

**11 famílias novas:**

| Família | Origem das faixas |
|---|---|
| Ice cream americano (premium), Philadelphia | Goff/Guelph (misturas hard-frozen), overrun premium 60–90% (Guelph), 21 CFR 135.110 (≥ 10% gordura) |
| French / frozen custard | 21 CFR 135.110: **1,4% de sólidos de gema** (regra calculada pelos sólidos, não pela gema fresca) |
| Soft serve, frozen yogurt | Goff/Guelph e SDSU Extension; temperatura de extração é **prática** |
| Kulfi | Composição **calculada** da formulação controle de um artigo de 2021. As tabelas do artigo foram descartadas por inconsistência (5% de sólidos totais) |
| Granita, semifreddo, dondurma, paleta de fruta, paleta cremosa | **Prática** (sem fonte primária de composição). O app avisa isso no laudo |

**Comportamentos por processo:**
- Fora da mantecadora, o overrun é o da família, e a calibração pelos lotes é separada por família.
- Granita: cristais grandes não são defeito; "sem estabilizante" não é aviso; o horizonte de textura não se aplica.
- Regras próprias: gema de custard, Philadelphia sem gema, frozen yogurt com iogurte, avisos de processo e aviso de faixa de prática.
- Trocar o tipo ajusta a temperatura de serviço. O seletor é agrupado por família e o laudo mostra um cartão com processo, serviço, overrun e a origem das faixas.

**Consequência real exposta:** o americano premium (overrun 60–90%) acusa overrun baixo na Maestro Gelatiere (máximo 35%). É um limite da máquina, não um defeito.

**Robustez corrigida no caminho:** um lote sem previsões derrubava a página de Lotes inteira (9 acessos diretos). Agora aparece "—".

**Testes:** `families.test.mjs` (8, com uma receita de exemplo por família feita de ingredientes da base, balanceador incluído) e E2E com as 24 páginas × 17 tipos = 408 combinações sem erro. Também o seletor agrupado e a temperatura de serviço do soft serve. Node 45/45.

**Fontes consultadas:** Goff, *Ice Cream Technology e-book* (Univ. de Guelph), capítulos "Suggested mixes for ice cream" e "Formulation considerations"; 21 CFR § 135.110 (Cornell LII); SDSU Extension, "Soft serve frozen desserts and frozen yogurts: real and perceived differences"; "Preparation of Kulfi with incorporation of pineapple pulp" (phytojournal, 2021).

## 5-H. v18.4 — design inverso: alternativas e compromissos (especificação §26–27)

**Auditoria do gerador existente** (Creator → Criar por alvo): mínimos quadrados não negativos com massa e congelamento na vitrine como restrições rígidas, e POD, gordura, MSNF e sólidos como metas flexíveis. As metas que não cabem são liberadas e listadas. Três defeitos encontrados:

| Defeito | Efeito | Correção |
|---|---|---|
| Famílias novas (v18.3) caíam nos ingredientes do gelato de leite (erro introduzido na v18.3; o teste interno só percorria os 6 tipos antigos) | Granita gerada com leite e creme; frozen yogurt sem iogurte | Ingredientes por família (`genVars`). Gema mínima automática no custard, iogurte ≥ 15% no frozen yogurt. Metas padrão pelo meio da faixa (`genDef`). O teste interno agora percorre os 17 tipos, na temperatura de serviço de cada processo |
| "Sem açúcar" não chegava à doçura: só eritritol e inulina, POD ≈ 6 contra meta 14–19 | A receita saía pouco doce e o aviso só citava "doçura" | Sucralose entra entre as variáveis. Doses abaixo de 0,3 g não são mais cortadas para edulcorante de alta intensidade (fica em centésimos de grama: 0,13–0,21 g/kg) |
| Base láctea com sólidos fora da faixa da família não gerava aviso | Ex.: semifreddo com 100 g de pasta de pistache saía com 55% de sólidos sem aviso | Vira aviso com a faixa da família |

**Etapa 3 · Alternativas e compromissos:** em vez de uma receita só, o motor percorre uma grade de metas dentro da faixa da família, com os mesmos ingredientes fixos:
- base láctea: POD (5 níveis) × gordura (4) × MSNF (3), 60 combinações;
- base sem leite: POD × sólidos, 15 combinações.

Cada ponto vira receita pelo mesmo `generate()`. Fica só o que respeita o congelamento e as faixas da família. Depois saem as receitas superadas em todos os critérios marcados (fronteira de Pareto), e opções iguais dentro da tolerância contam como uma.

Critérios disponíveis:

| Critério | Natureza |
|---|---|
| Menor custo (só Maestro, com os preços informados) | Conta de composição |
| Menos açúcar (g/100 g) | Conta de composição |
| Menos calorias | Conta de composição |
| Mais corpo (sólidos) | Conta de composição |
| Mais gordura | Conta de composição |
| Derrete mais devagar | Estimativa heurística |
| Cristais mais finos | Estimativa heurística |

A tela diz quantas combinações foram testadas, quantas ficaram viáveis e quantas não são superadas. Marca com ★ a melhor em cada critério. No celular mostra até 8 opções (as melhores de cada critério e as demais espaçadas), com "Mostrar todas". "Usar esta" põe as metas no formulário e gera a receita pelo caminho normal, inclusive no modo pote.

**O que a fronteira mostra de verdade:**
- Em sorbetto, paleta de fruta, vegano e gastronômico, com os critérios açúcar/corpo/derretimento, sai **uma opção só**. Com esses ingredientes as metas não têm folga, e a tela diz isso em vez de inventar alternativas.
- Na granita, açúcar e sólidos andam juntos: a fronteira é a própria escolha de doçura.

**Tempo:** 4–190 ms por tipo (60 combinações). Roda depois de um clique, sem travar a tela.

**Testes:**
- `inverse.test.mjs` (8): ingredientes por família, gema e iogurte mínimos, sucralose, aviso de sólidos, `paretoFront` com dominância e empate, fronteira sem opção dominada em 5 famílias com recálculo idêntico, preço próprio mudando o custo, tempo.
- E2E com 9 verificações novas: marcar critério, listar, limite de 8 e "Mostrar todas", sem rolagem horizontal a 390 px, "Usar esta" gerando a mesma receita, botão desativado com um critério.
- Node 53/53.

**Limite conhecido:** no "sem açúcar" o gerador chega ao corpo com até ~16% de inulina. É tecnicamente possível, mas é muita fibra por porção. Reduzir isso pede alulose ou polidextrose entre as variáveis, o que muda a doçura e o PAC; ficou para uma rodada própria.

## 5-I. v18.5 — laboratório de estabilização (especificação §22–23)

**Auditoria do laboratório de neutros existente:** já tinha 16 componentes, 9 blends de mestres/tradições/academia com fonte, 4 estudos promissores, cinética de hidratação por temperatura e tempo, simulação de partículas, desenho de blend por objetivo e teste na receita. Problemas:

| Problema | Por que importa |
|---|---|
| Notas de função 0–5 e doses usuais sem fonte nem etiqueta | Pareciam medição; são prática de formulação |
| Hidratação, compatibilidade e limites só implícitos | A tela não dizia de onde vinha o dado nem o que faltava |
| Duas "sinergias" sem fonte (jataí + guar, tara + jataí) | Viravam afirmação científica |
| "Inulina acima de 4% causa desconforto" | Número sem fonte |
| Nenhuma ligação entre blend e lotes medidos | Não dava para comparar blends autorais pelo resultado real |

**Ficha técnica por componente (`NKB`):** origem e natureza (natural, fermentação, modificado, processado, animal), hidratação/ativação, gelificação, comportamento com leite, acidez e cálcio, limites de processo, efeito estrutural, estrutura química. Cada fato cita a fonte (número e link); campo sem fonte fica **"sem dado registrado"** (ex.: hidratação da xantana, tudo da lecitina, tempo mínimo de maturação). Conclusões do app ficam marcadas como **"Inferência do app"** (ex.: calda de sorbetto, ≈ 28–35 °Bx, não chega aos 60 °Bx que a pectina HM exige para gelificar: ali ela só engrossa). Fichas de fabricante aparecem como "(fabricante)".

**Sinergias (`NSYN`):** 9 interações, todas descritivas e com fonte. **Não existe coeficiente numérico de sinergia**; o perfil de funções continua aditivo, declarado no registro de modelos (`stabilizer-function`, heurístico, com etiqueta na tela). As duas combinações sem fonte agora dizem que são prática de formulação.

**Temas sem componente próprio** (com o que se sabe e o que falta): proteínas funcionais, gema, polissorbato 80 (fora do banco: o laboratório não exige sintéticos), fibras solúveis além da inulina, maturação. O amido de mandioca entrou como conhecimento (gelatiniza ≈ 59 °C, 10–15 °C abaixo do milho; forma pasta, não gel; xantana reduz a separação de água no congela-descongela), não como componente: mexeria em ~15 pontos do motor que tratam amido de forma especial, sem medição que justifique.

**Comparar blends (até 4):** o blend em edição, os seus e os de referência. Modelo: dose, hidrocoloides na mistura, pasteurização mínima para hidratar 95% no seu patamar, risco de soro em base láctea, origem (com os não naturais destacados), sinergias documentadas presentes, perfil de funções (estimativa), custo (só Maestro). **Lotes feitos com o blend:** derretimento em 10 min medido e desvio contra o previsto, overrun, ficha sensorial "sem gelo", dia em que o gelo apareceu. A tela avisa que é observação, não experimento, e indica Experimentos (DoE) para isolar o efeito.

**Inulina:** o texto cita Bonnema et al. (2010): adultos saudáveis toleraram bem até 10 g/dia de inulina nativa e 5 g/dia de oligofrutose. Regra nova no laudo, "fibra fermentável por porção": aviso quando uma porção passa do tolerado num dia, informação a partir da metade. Isso torna visível o limite do "sem açúcar" registrado na v18.4 (≈ 15 g de inulina por porção de 90 g na receita gerada).

**Gerador do sem açúcar refeito** (corrige o limite da v18.4). Antes, eritritol e inulina entravam livres e os sólidos não eram meta: o gerador ia para 40% de sólidos com ~16% de inulina (≈ 14 g por porção) ou para 9,5% de eritritol, e o próprio laudo acusava sólidos, fibra, eritritol e viscosidade. Agora o eritritol fica fixo em 4,5% (o laudo avisa acima de 6%: recristaliza a frio), alulose e fibra solúvel de milho completam PAC e corpo, e os sólidos viram meta (em vez de resultado). Em 32, 35 e 38% de sólidos, a −11 e −13 °C: meta atingida, sem inulina, e o laudo sem aviso de fibra, eritritol ou sólidos; resta "armazenamento longe da transição vítrea", comum a todo sem açúcar. A fronteira de alternativas do sem açúcar agora varia os sólidos.

**Correção minha:** na primeira versão desta seção (e na mensagem de entrega) eu disse que polidextrose não estava no banco. Está: polidextrose e fibra solúvel de milho são ingredientes de receita (composição de ficha típica, sem fonte primária). O tema da ficha foi corrigido.

**Fontes consultadas nesta rodada:** Goff (Guelph), caps. Stabilizers e Emulsifiers; Bahram Parvar et al. (2013, J. Agr. Sci. Tech.); Patel (INFLIBNET); Goycoolea et al. (1995); Bonnema et al. (2010); Srijunthongsiri & Pongsawatmanit (2006); SupplySide (amido de mandioca); fichas de fabricante Colony Gums (tara), Sosa (pectinas), JRS (fibra de citros). Os estudos de Nottingham (2017) e Ankara (2021), que já estavam no app, passaram a ser citados nas fichas.

**Testes:** `stabilization.test.mjs` (7: toda ficha cita fonte registrada; campos sem fonte continuam vazios; sinergias só entre pares presentes e sem coeficiente; notas citam a fonte; origem natural × não natural; resultados observados com médias, desvio e lotes de outro blend ignorados; regra da inulina). E2E com 12 verificações novas, incluindo lote medido na comparação e 390 px sem rolagem horizontal. Node 61/61.

## 5-J. v18.6 — reestruturação modular progressiva (especificação §50)

**Decisão:** separar o código-fonte em módulos sem mudar o app em produção. O código vive em `src/` (57 módulos em `core`, `product`, `data`, `security`, `ui`, `tests`, `shell`), e `tools/build.mjs` monta o `index.html`. O arquivo continua único (offline, GitHub Pages sem build, Web Worker extraído do mesmo trecho). Separei nos limites que já existiam (marcadores e cabeçalhos de seção), e **a montagem reproduziu a v18.5 byte a byte** (sha `78fdf962b04e`) antes de qualquer mudança; a única diferença da v18.6 no arquivo publicado é o número da versão.

**Não fiz:** módulos ES com `import`/`export` nem empacotador. Mudariam o Web Worker e o cache offline sem ganho imediato; ficam como último passo, se valer a pena (spec: "não transforme modularização em reescrita").

**Regras entre camadas** (`tools/layers.mjs`): o núcleo não usa produto, dados, segurança nem interface; produto não usa dados, segurança nem interface; dados e segurança não usam interface. A análise achou **74 usos cruzados**: 51 eram arquivos na camada errada ou nomes locais iguais a globais (ex.: `S` é soluto na curva de congelamento e estado da tela). Corrigi movendo arquivos (perfis e processo-padrão para o núcleo; armazenamento local separado da interface; tela de equipe separada da entrada; sensibilidade para produto). **Restam 23 dívidas reais**, registradas com motivo: a sincronização chama `render()` e telas de conflito; o motor lê a preferência de dextrose da tela; a quenelle consulta o banco de defeitos; o gerador usa as metas padrão das bases. Dependência nova falha o CI; dívida paga também, até sair da lista.

**Contratos de dados** (`docs/ARQUITETURA.md` e `tests/node/contracts.test.mjs`): entrada do motor (linha `{id, g}` em gramas; estado `{tipo, vit °C, recipe, proc}`), saída (unidade e faixa física de sol, gordura, MSNF, água, congelada, POD, serviço, overrun, derretimento, cristais, viscosidade, custo, nutrição), perfis de tipo, e versões de todos os formatos persistidos (app, backup schema 2, registro na nuvem, registro de modelos, manifesto, dívidas, chaves locais).

**Testes:** `arch.test.mjs` (6: index.html = montagem de src/; 27 marcadores únicos; trecho do Web Worker só com núcleo e produto; camadas = dívidas registradas; verificador ignora comentários, textos e locais; todas as camadas presentes) e `contracts.test.mjs` (4). CI ganhou duas etapas: montagem confere e camadas sem dependência nova. Node 71/71.

## 5-K. v18.7 — PWA confiável (especificação §45)

**Auditoria do service worker publicado:**

| # | Problema | Consequência |
|---|---|---|
| 1 | Nome do cache fixo (`d50551d3dc`) desde a v17; o `sw.js` não mudava entre publicações | O navegador nunca instalava service worker novo: o aviso "Nova versão disponível" nunca aparecia e o cache não era versionado nem limpo por versão. A página nova chegava só porque a navegação busca na rede primeiro |
| 2 | Qualquer resposta 200 da página era gravada como cópia offline, sem conferir o conteúdo | Uma página inesperada (portal de Wi-Fi em http, página trocada, versão intermediária) podia virar a cópia offline |
| 3 | Na navegação, erro do servidor (404/500, ex.: durante uma publicação) era mostrado em vez da cópia guardada | O app "sumia" mesmo estando guardado no aparelho |
| 4 | Nenhum diagnóstico | Não dava para saber se o aparelho tinha tudo para abrir offline |
| 5 | Sem pedido de armazenamento persistente | O navegador pode apagar dados e cache quando falta espaço |

**O que mudou:**
- **Cache versionado por hash.** O `sw.js` é gerado pelo build com o SHA-256 do `index.html` (`src/sw/sw.js` é o modelo). Cada publicação gera um service worker novo.
- **Instalação conferida, tudo ou nada.** O service worker baixa os 8 arquivos do núcleo e só aceita o `index.html` se o hash bater. Se o GitHub Pages ainda entrega a página anterior (propagação), a instalação falha, a versão anterior segue funcionando offline e o navegador tenta depois. O cache antigo só é apagado quando o novo está completo.
- **Só entra no cache o que foi conferido:** a página só substitui a cópia se tiver o hash desta versão; resposta de erro ou de outro endereço nunca entra.
- **Erro do servidor na navegação mostra a cópia guardada.**
- **Cartão "Funcionamento offline"** (Conta e sincronização, todos os perfis): service worker ativo e versão, arquivos guardados (8 de 8), página confere pelo SHA-256, versões antigas no aparelho, armazenamento persistente, espaço usado, data do último backup exportado; botão "Baixar de novo e conferir" quando falta algo.
- **Armazenamento persistente** pedido uma vez por aparelho (o navegador pode recusar; o cartão mostra).

**Migração:** testada a partir do `sw.js` e do `index.html` publicados (v18.6, cache `d50551d3dc`): o service worker novo instala, assume, apaga o cache antigo e o app abre a v18.7 offline. Os dados (localStorage e nuvem) não passam pelo service worker e não são tocados.

**Bug encontrado nos testes e corrigido:** um service worker antigo ainda terminando pedidos recriava o próprio cache logo depois de apagado. Agora ele só grava se o cache dele ainda existe, e o service worker novo limpa versões antigas também depois da navegação e no diagnóstico.

**Testes:** `tests/e2e/pwa.mjs` (15 verificações; Chromium completo; no WebKit, motor do Safari, tudo menos as recargas com rede desligada simulada, que o Playwright não suporta nesse motor — lá elas viram verificação online. A instalação conferida por SHA-256, a atualização, a recusa com página antiga e a migração passaram no WebKit): migração do service worker publicado; instalação conferida; cache versionado; erro 500 mostra a cópia; página inesperada online não substitui a cópia offline; sw novo com página antiga no servidor é recusado sem deixar cache parcial; atualização normal assume, guarda tudo e apaga a anterior; fechar e reabrir offline abre a versão nova; cartão de diagnóstico na tela. `arch.test.mjs` confere que o `sw.js` é o gerado, com hash e versão certos e todos os arquivos existentes. Node 72/72.

## 5-L. v18.8 — ciência verificável (especificação §46–49)

**Registro de modelos @2** (`docs/model-registry.json`, embutido no app pelo build). Os 21 modelos agora têm todos os campos do §46:
- nome, versão, equação **conferida contra o código**, parâmetros com unidade e fonte (ou "sem fonte"), saídas com unidade;
- hipóteses, onde vale, origem dos dados, método numérico;
- tolerância usada como critério de aceite, incerteza, calibração;
- verificação de software e verificação matemática, cada uma apontando para um teste que existe (o teste confere);
- validação.

Campo não estabelecido fica `null` e aparece como "não estabelecido". Ao conferir as equações, duas que eu tinha escrito de memória (doçura percebida e viscosidade) estavam imprecisas e foram corrigidas antes de entrar.

**Três níveis (§47)**, página nova **Analisar → Ciência do motor**:

| Nível | Situação hoje |
|---|---|
| Verificação de software | 12 dos 21 modelos têm teste específico |
| Verificação matemática | 3 dos 21: curva de congelamento (monotonia, inversão, continuidade), fração congelada (Cg′), transferência de calor (convergência de malha e concordância com o método da entalpia). Os demais são fórmulas fechadas ou não têm propriedade testável registrada |
| Validação científica | Calculada dos seus lotes medidos; nenhum modelo é declarado validado |

**Validação deixa-um-fora** (`core/calibration/validacao.js`):
- Cada lote medido é previsto com a calibração feita **sem ele**, para não conferir o modelo com o mesmo dado que o ajustou. O erro sem calibração também aparece.
- Grandezas: overrun, derretido em 10 min, °Brix, pH, núcleo do pote e textura na vitrine.
- Resultado por grandeza e por tipo de produto (§48: validar só no escopo em que há dados).
- Status: sem dados → evidência inicial (1–4 lotes) → avaliado (≥ 5) → dentro da tolerância (erro fora-da-amostra ≤ tolerância registrada).
- **Nenhum status promove um modelo a "validado" (classe V):** isso exige conjunto independente versionado e revisão.

As etiquetas de natureza na tela (heurístico, semiempírico…) agora abrem a ficha do modelo.

**Casos de referência (§48–49)** em `docs/validacao/casos.json`, 16 casos:
- gelato de leite, gemas, baunilha, chocolate, duas oleaginosas, sorbet, vegetal;
- dois aerados, baixo açúcar, três famílias novas;
- estabilizante natural (Dondoli).

O processo do §49 vale para todos: Maestro com 1.100 g, sacarose e dextrose monoidratada, pote de 470 mL a −18 °C, 10 min de temperagem.

Só receita e processo ficam guardados. As previsões condicionais são recalculadas pelo motor atual (`node tools/validacao.mjs` → `docs/validacao/PREVISOES.md`), para nunca ficarem velhas. Medições ficam `null` até existir um lote real, e o teste recusa medição sem lote, data e instrumento.

**Cardamomo ficou pendente:** não está no banco de ingredientes, e a composição não foi inventada.

**O que os casos mostram (previsão, não medição):** com pote de 470 mL vindo de −18 °C, depois de 10 min na cozinha a camada de servir ainda está a −13,6 a −14,4 °C. Ela só chega ao ponto ideal de cada receita depois de ~13–16 min nas cremas. É um bom primeiro experimento: medir a temperatura da colher aos 10 e aos 15 min.

**Hipótese registrada, sem correção aplicada:** o °Brix previsto soma só açúcares e solutos dissolvidos. O refratômetro também responde a proteínas e sais do leite, então em base láctea a leitura pode sair acima do previsto. A validação vai mostrar.

**Defeito da v18.7 (publicada) encontrado pelo CI e corrigido nesta versão.** Na troca de versão, o service worker antigo ainda termina a última navegação que atendeu. A limpeza adiada dele (3 s) apagava qualquer cache que não fosse o seu, inclusive o da versão nova, que já tinha assumido. O aparelho ficava com a cópia offline da versão anterior e o diagnóstico acusaria cache incompleto. Os dados não foram afetados: não passam pelo cache.

Correção na v18.8:
1. **Autorreparo:** depois de cada abertura online, o service worker confere o próprio cache e, se sumiu ou ficou incompleto, baixa de novo e confere o hash.
2. **Limpeza segura:** cada cache guarda quando foi montado (`./__sw_meta`), e a limpeza só apaga versões **mais antigas**. Isso protege todas as próximas trocas.

Na passagem v18.7 → v18.8 o defeito ainda acontece uma vez, porque é o código da v18.7 que roda. O autorreparo da v18.8 recompõe o cache na abertura seguinte com internet. Os testes cobrem a migração real a partir da v18.7 publicada (Chromium e WebKit) e o autorreparo com o cache apagado.

**Testes:**
- `validation.test.mjs` (7): campos do §46 em todo modelo; toda verificação citada existe; registro embutido igual ao de `docs/`; deixa-um-fora nunca usa o próprio lote (conta conferida à mão); status por quantidade e tolerância; ponta a ponta de lotes a calibração a validação; casos cobrem todas as famílias pedidas, medição só com origem, previsões finitas e lote escalado para a carga.
- E2E com 8 verificações novas: etiqueta abre a ficha, 21 fichas, três níveis, contagem por grandeza, status, ficha com equação e tolerância, 390 px.
- Node 79/79.

## 6. Para publicar (requer sua autorização)
1. Conferir a execução do workflow *Testes* na branch (inclui WebKit e o job *banco*).
1b. Aplicar a migração 001 seguindo `supabase/README.md` (ensaio num projeto de teste primeiro). A ordem entre banco e app é indiferente.
2. Testar no iPhone pela URL da branch ou após merge: abrir, trabalhar offline, fechar e reabrir.
3. Atualizar a versão no `sw.js` (`CACHE='il-fredolin-…'`) junto com o merge.
4. Fazer o merge em `main`.

## 7. Próximas fases, em ordem de prioridade (seção 53 da especificação)
1. ~~Banco: schema.sql e auditoria de RLS~~ — feito (§5-C).
2. ~~Conflitos e estoque~~ — feito (§5-C); falta aplicar a migração 001 no Supabase.
3. **Backup automático** periódico (o manual já está completo e a restauração é segura) antes de migrar `localStorage` → IndexedDB.
4. ~~Rótulos de natureza do resultado~~ — feito para 6 grandezas; estender a textura/quenelle, derretimento e incerteza.
5. **Medições de baixo custo** que mais reduzem incerteza: temperatura do centro do pote no endurecimento e na espera (calibra h), overrun por copo, temperatura de extração da Maestro.
6. ~~Novas famílias, design inverso, DoE~~ — feitos (§5-E, §5-G, §5-H).

## 8. Limitações desta auditoria
- RLS e funções do banco não auditadas (esquema ausente do repositório).
- Nada foi testado em Safari/iOS real neste ambiente.
- Receitas dos mestres não foram testadas (ficam só no Supabase).
- A auditoria das 1.100 linhas do motor foi feita por leitura das funções listadas e por teste das propriedades físicas; os ~35 defeitos do diagnóstico e os geradores de receita não foram revisados um a um.
