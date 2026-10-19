# Arquitetura de computação científica: decisão (v18.14 · especificação §11–13)

**Decisão: Alternativa A, motor em JavaScript modular com Web Workers.** WebAssembly não entra no app agora.

A especificação pede "a menor arquitetura capaz de executar com rigor os modelos necessários" e proíbe escolher Rust pela reputação. Esta decisão foi tomada com **medições**:
- a mesma bateria de operações roda no Node, no Chromium (normal e com a CPU 4× e 6× mais lenta), no WebKit pelo CI e no próprio aparelho;
- um protótipo real da Alternativa B, o núcleo de transferência de calor compilado para WebAssembly pelo LLVM, foi medido contra o JavaScript.

Dados brutos: `docs/bench/node.json`, `docs/bench/navegadores.json`, `docs/bench/wasm-node.json`.

## 1. O que foi medido

### Bateria do motor (`product/desempenho.js`)

São 12 operações, em duas classes de orçamento (§13):
- **diárias:** rodam a cada toque na bancada e precisam ficar abaixo de 50 ms no aparelho;
- **sob demanda:** rodam num Web Worker, com progresso e cancelamento, e precisam ficar abaixo de 2 s.

Cada valor é a mediana das repetições, e cada repetição muda a receita para não medir o cache. Tempos em ms:

| Operação | Classe | Node | Chromium | Chromium, CPU 4× mais lenta | Chromium, CPU 6× mais lenta |
|---|---|---|---|---|---|
| Análise da receita | diária | 0,4 | 0,2 | 1,1 | 1,4 |
| Análise + laudo | diária | 0,5 | 0,2 | 1,4 | 2,0 |
| Incerteza linear | diária | 0,8 | 0,5 | 2,0 | 2,9 |
| Textura e quenelle | diária | 5,1 | 1,3 | 5,4 | 7,9 |
| Pote saindo do freezer | diária | 5,7 | 1,8 | 4,7 | 7,8 |
| Balancear açúcares | diária | 1,6 | 0,6 | 2,9 | 4,6 |
| Gerar receita por alvo | diária | 2,1 | 0,9 | 3,0 | 7,7 |
| Endurecimento | sob demanda | 9,7 | 1,3 | 2,1 | 8,7 |
| Ciclo completo | sob demanda | 9,3 | 2,8 | 9,8 | 16,2 |
| Oscilação, simulação completa | sob demanda | 24 | 6,2 | 22 | 31 |
| Monte Carlo, 300 sorteios | sob demanda | 91 | 35 | 196 | 245 |
| Alternativas, 60 metas | sob demanda | 114 | 73 | 193 | 285 |

**Na pior simulação (CPU 6× mais lenta), a operação diária mais pesada leva 8 ms, contra um orçamento de 50 ms.** A mais pesada sob demanda leva 0,3 s, contra 2 s.

O Chromium com a CPU 4–6× mais lenta é uma aproximação, não um iPhone. Por isso a página **Ciência do motor → Desempenho deste aparelho** roda a mesma bateria no aparelho real. Os números de iPhone, iPad e Mac entram aqui quando forem medidos. O WebKit (motor do Safari) roda no CI a cada versão, e o resultado aparece nas anotações do workflow.

### Abrir o app e tamanho

| | Valor |
|---|---|
| `index.html` | 972 KB (345 KB com gzip, 274 KB com brotli); era 766 KB na v17.12 |
| Abrir até a primeira tela (Chromium) | 0,5 s; 1,2 s com CPU 4× mais lenta; 1,5 s com CPU 6× mais lenta |
| Memória JavaScript depois da bateria | 11–28 MB (Chromium); 25 MB (Node) |

**Abrir o app custa 100 vezes mais que qualquer operação do motor.** O próximo ganho perceptível está no tamanho e na abertura, não em linguagem compilada.

### Protótipo da Alternativa B (`tools/wasm-proto/`)

O laço de tempo do `heatSim` foi escrito em C, com a mesma discretização, a mesma tabela de propriedades e o mesmo passo, e compilado para WebAssembly pelo clang 18 (o mesmo LLVM do Rust). O arquivo tem 3 KB. Baixar o compilador Rust para WebAssembly estava bloqueado na rede desta sessão; o backend de geração de código é o mesmo, e é ele que define o desempenho do laço numérico.

| Caso | JS da v18.13 | JS da v18.14 | WebAssembly | Diferença numérica |
|---|---|---|---|---|
| Pote 500 mL, 40 min (Node) | 19 ms | 1,9 ms | 0,4 ms | 3,6·10⁻¹⁵ °C |
| Endurecimento 12 h (Node) | 118 ms | 7,1 ms | 1,8 ms | 7,1·10⁻¹⁵ °C |
| Malha fina N = 40 (Node) | 443 ms | 21,5 ms | 5,9 ms | 5,3·10⁻¹⁵ °C |
| Pote / endurecimento / malha (Chromium) | — | 0,3 / 1,4 / 3,9 ms | 0,25 / 1,7 / 5,7 ms | idem |
| Ganho do WebAssembly no **WebKit** (motor do Safari, CI em Linux) | — | — | 6× / 10× / 1,7× | idem |

O achado que decide:
- **A maior parte da lentidão era do jeito como o JavaScript estava escrito, não da linguagem.** O laço criava um objeto e somava a camada de servir com `reduce` a cada passo.
- Reescrito com vetores tipados e sem alocação por passo, o `heatSim` ficou 3 a 20× mais rápido, com resultado **idêntico byte a byte** em todos os casos de referência (teste `perf.test.mjs`).
- Depois disso, o WebAssembly ganha ~1,3× contra o mesmo laço isolado no Node e **nada no Chromium** (0,7 a 1,8×, dentro do ruído).
- **No WebKit, o motor do Safari, o WebAssembly ganha de verdade: 6× no pote, 10× no endurecimento e 1,7× na malha fina** (CI em Linux, relógio com resolução de 1 ms, medição em lote). É o motor do iPhone, então é ali que a decisão se resolve.
- Mesmo no WebKit, os tempos absolutos já estão muito abaixo do orçamento: o pote inteiro (análise + simulação) leva 1 ms, o ciclo completo 1,5 ms e o Monte Carlo 14 ms. Ganhar 6× em 1 ms não muda nada que você perceba.
- Dentro do motor completo, o `heatSim` em JavaScript fica ~3× mais lento que o mesmo laço isolado. São muitos pontos de chamada com funções diferentes, e o compilador JIT gera código mais genérico; o WebAssembly não sofre esse efeito.

## 2. Comparação das três arquiteturas (§11)

| Critério | A · JavaScript modular + Workers | B · Híbrida (JS + Rust/Wasm nos solucionadores) | C · Núcleo compilado |
|---|---|---|---|
| Desempenho medido | Dentro do orçamento em todas as operações, com folga de 6× nas diárias | Núcleo térmico: ~1× no Chromium, 1,7–10× no WebKit; ganho absoluto < 1–10 ms | Não medido além do núcleo; o resto do motor é lógica de regras, onde Wasm não ganha |
| Precisão numérica | Double (IEEE 754) | Mesmo double; diferença de 10⁻¹⁵ °C | Idem |
| Memória | 11–28 MB | + memória linear do Wasm (pequena) | Idem |
| Latência de inicialização | 0,5–1,5 s, dominada pelo tamanho do script | + compilar e instanciar o Wasm (3 KB, desprezível) | Núcleo inteiro em Wasm: módulo maior e ponte JS↔Wasm em cada chamada |
| Tamanho | 972 KB | +3 KB por núcleo | Reescrita de ~2.000 linhas |
| Safari e Chrome | Funciona hoje nos dois (CI com WebKit) | Wasm funciona nos dois | Idem, mas depuração no Safari é pior |
| GitHub Pages | Arquivo único, sem build no servidor | Precisa de toolchain no CI e de servir `.wasm` com o tipo certo; o cache offline precisa incluir o binário | Idem, mais pesado |
| Testes | Node testa o mesmo código que vai para produção | Duas implementações a manter iguais (o teste de equivalência existe: `perf.test.mjs`) | Tudo testado via ponte |
| Manutenção | Uma linguagem | Duas linguagens e um compilador | Duas, com o motor longe da interface |
| Custo de implementação | Zero (já existe) | Médio por núcleo portado | Alto (reescrita) |
| Segurança | Sem dependência externa | Binário gerado no CI: precisa de build reprodutível | Idem |
| Capacidade de expansão | Workers para paralelismo; tetos conhecidos (ver gatilhos) | Melhor para solucionadores 2-D/3-D e MCMC longos | Idem |

## 3. Quando reabrir a decisão (gatilhos medidos)

Vale portar um núcleo para WebAssembly quando **todas** estas condições forem verdadeiras:
1. Uma operação passa do orçamento no aparelho real (medido em "Desempenho deste aparelho"), mesmo já otimizada em JavaScript (vetores tipados, sem alocação no laço, no Web Worker).
2. O custo está num laço numérico denso (não em regras, objetos ou textos).
3. Um protótipo mostra ganho de pelo menos 3× **no navegador do aparelho**, não só no Node.

Hoje a condição 3 já vale no WebKit para o núcleo térmico, mas a condição 1 não: nenhuma operação chega perto do orçamento. Por isso a decisão continua sendo a Alternativa A. A página "Desempenho deste aparelho" também roda a comparação JavaScript × WebAssembly no próprio aparelho, quando há internet para baixar o protótipo. O número do iPhone real confirma ou derruba esta conclusão.

Candidatos prováveis: condução 2-D/3-D no pote (tampa, parede, prateleira), inferência por MCMC com mais de 10⁵ avaliações e otimização multiobjetivo com o motor completo em cada ponto. O protótipo `tools/wasm-proto/` fica no repositório como ponto de partida e como teste de equivalência numérica. Ele não é carregado pelo app.

## 4. Métodos numéricos em uso (§12)

| Problema | Método | Tolerância e convergência | Verificação |
|---|---|---|---|
| Condução no pote (aquecer, endurecer) | Diferenças finitas explícitas em esfera, capacidade aparente com calor latente; passo adaptativo = 0,45·C/G (limite de estabilidade) | Erro de energia ≤ 0,7%; malha N = 10 contra N = 40: < 1% | `engine.test.mjs` (convergência e método da entalpia), `perf.test.mjs` |
| Oscilação do freezer | Solução periódica exata (variáveis complexas), propriedades na temperatura do freezer | Contra a simulação não linear: ≤ 0,02 °C (24 casos, máx. 0,007 °C) | `cycle.test.mjs` |
| Resfriamento da calda | Newton em forma fechada | Exato | `cycle.test.mjs` |
| Ajuste do h do freezer | Bisseção em log h, 10 iterações (largura final ≈ 0,3% de h) | Medição descartada se ±0,5 °C muda h > 60% | `calib-thermal.test.mjs` |
| Curva de congelamento | Tabela Goff–Hartel interpolada + Norrish/Clausius–Clapeyron emendada | Monotônica, invertível, contínua na emenda | `engine.test.mjs` |
| Gerador por alvo | Mínimos quadrados não negativos (Lawson–Hanson) com restrições como linhas de peso alto | Metas que não cabem são liberadas e listadas | `inverse.test.mjs`, `runTests` |
| Balanceador | Sistema 3×3 iterado; NNLS pequeno | No modo pote, até 4 iterações (para quando a temperatura muda < 0,05 °C) | `families.test.mjs` |
| Alternativas | Grade de metas + filtro de Pareto | Empates dentro da tolerância contam como uma opção | `inverse.test.mjs` |
| Incerteza | Linear (perturbação por grupo, quadratura) e Monte Carlo (semente fixa) | Erro-padrão do percentil 5% ≈ 0,12σ com 300 sorteios (≈ 0,06 °C) e 0,05σ com 2000 | `uncertainty.test.mjs` |
| Calibração | Média posterior normal–normal (encolhimento) | Validação deixa-um-fora | `validation.test.mjs` |
| Experimentos | Mínimos quadrados, t de Student, termo de curvatura | p conferido contra tabelas | `doe.test.mjs` |

**Avaliados e não adotados agora:**
- **Solucionadores implícitos (problemas rígidos).** O passo explícito já roda em milissegundos. O caso mais caro (oscilação de 24 h) virou solução exata.
- **ODE e DAE gerais.** Nenhum modelo atual é um sistema rígido de equações. Cristalização e hidratação na maturação usam forma fechada.
- **Bibliotecas numéricas externas.** O app é um arquivo único offline, sem empacotador. Os algoritmos usados são pequenos e verificados por testes de propriedade, e uma biblioteca acrescentaria tamanho sem resolver um problema medido. Reavaliar junto com os gatilhos da seção 3.
- **MCMC, inferência bayesiana completa e modelos substitutos.** Ainda não há dados medidos que sustentem a inferência; com poucos lotes, o encolhimento normal–normal é adequado.

## 5. Execução adaptativa (§13)

| Requisito | Como está |
|---|---|
| Cálculos cotidianos instantâneos | Todos abaixo de 8 ms mesmo com a CPU 6× mais lenta |
| Tarefas pesadas assíncronas, com progresso e cancelamento | Executor `runJob` (`ui/tarefas.js`): Web Worker com o mesmo motor, progresso e cancelamento (encerra o worker sem deixar estado pela metade). Usado no Monte Carlo e na medição do aparelho. O índice dos mestres já usava worker |
| Níveis de resolução justificáveis | Monte Carlo com 300 sorteios (padrão) ou 2000 ("alta resolução"), mostrando o tempo estimado no próprio aparelho. Mesma semente: o resultado se repete |
| iPhone, iPad, Mac | A medição no aparelho diz quanto cada operação custa ali. Não há corte automático de resolução por tipo de aparelho: o resultado científico não muda com o aparelho, só o tempo |
| WebGPU e SIMD | Não usados: nada hoje precisa, e seriam aceleração opcional, nunca dependência |

**Bug encontrado pelo teste ponta a ponta nesta versão:** o gerador aleatório com semente do Monte Carlo (`mulberry32`) estava em `core/experiments/doe.js`, fora do trecho que vai para o Web Worker. O Monte Carlo no worker falhava. Ele foi para `core/util.js`, e um teste agora confere que tudo de que as tarefas do worker precisam está dentro do trecho.
