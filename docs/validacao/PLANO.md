# Plano de validação experimental (v18.17 · §46–49)

**Situação hoje: nenhum modelo do app está validado com medição real.** Os métodos de comparação estão prontos e testados:
- validação deixa-um-fora (8 grandezas);
- cobertura da faixa de 90%;
- calibração do freezer pelo núcleo do pote;
- calibração do resfriamento pela calda;
- ponte física × percepção;
- triângulo e ANOVA do painel.

O que falta são os lotes medidos. Este plano ordena as medições pelo que mais aumenta a confiança por esforço, usando equipamento de cozinha sempre que possível.

## Regras

- Cada medição é registrada no lote, com data e instrumento. O teste `validation.test.mjs` recusa medição de referência sem lote, data e instrumento.
- Status por grandeza:
  - **sem dados**;
  - **evidência inicial** (1–4 lotes);
  - **avaliado** (≥ 5);
  - **dentro da tolerância** (erro fora-da-amostra ≤ tolerância registrada).
- Nenhum status promove um modelo a "validado". Isso exige um conjunto independente e revisado.
- A validação vale só no escopo medido (família, processo, faixa de temperatura).

## Ordem sugerida

| # | Medição | Instrumento | O que confere | Mínimo para concluir | Onde registrar |
|---|---|---|---|---|---|
| 1 | Temperatura da camada de servir aos 10 e 15 min fora do freezer (pote de ~470 mL a −18 °C) | Termômetro de espeto | Temperagem (heat-transfer) e o ponto de serviço | 5 lotes | Lote → textura e temperatura avaliada |
| 2 | Núcleo do pote depois de N min no freezer (fora do patamar de congelamento) | Termômetro de espeto | Endurecimento; calibra o h do freezer | 3–5 lotes | Lote → núcleo e minutos |
| 3 | Overrun pelo copo (mesmo copo cheio de calda e de gelato) | Balança de 0,1 g | Overrun (heurístico + calibração) | 5 lotes por máquina | Lote → copos |
| 4 | Derretido em 10 min a ~20 °C | Balança e peneira | Derretimento (heurístico) | 5 lotes | Lote → derretido em 10 min |
| 5 | °Brix da calda | Refratômetro | Composição; testa a hipótese de que proteínas e sais elevam a leitura em base láctea | 5 lotes | Lote → Brix |
| 6 | Calda na geladeira: temperatura depois de N min ("6,5@90") e depois de 45 min no banho de gelo | Termômetro | Resfriamento e maturação (gêmeo do ciclo) | 3 medições | Maturação → calda medida |
| 7 | Textura na vitrine (−2 a +2) numa temperatura medida | Colher + termômetro | Fração congelada; **cobertura da faixa de 90%** | 10 lotes com textura ideal | Lote → textura |
| 8 | Painel: ponto ideal e aceitação; perfil por escala | 3+ provadores | Preferência da casa; física × percepção | 5 lotes avaliados | Painel cego |
| 9 | pH da calda | pHmetro calibrado | pH (heurístico) | 5 lotes | Lote → pH |
| 10 | Cristal médio ao microscópio a −15 °C (≥ 300 cristais) | Microscópio com estágio frio | Índice de cristal; distribuição hipotética | 5 lotes | Lote → cristal medido |
| 11 | Viscosidade da calda a 2–8 °C, ≥ 2 taxas | Viscosímetro | Viscosidade (heurístico); comportamento não newtoniano | 5 lotes | Lote → viscosidade |

## Casos de referência (§49)

Os 16 casos de `docs/validacao/casos.json` fixam receita e processo:
- Maestro Gelatiere com 1.100 g;
- sacarose e dextrose monoidratada;
- pote de 470 mL a −18 °C;
- 10 min de temperagem.

`node tools/validacao.mjs` recalcula as previsões condicionais (`PREVISOES.md`), que nunca ficam velhas. **Cardamomo continua pendente:** não está no banco de ingredientes, e a composição não foi inventada.

## Comparações da literatura já registradas (não são validação)

- **Cristais:** previsões dentro das faixas publicadas (20–35 µm na saída da produtora; 35–45 µm depois do endurecimento).
- **Recristalização a −5 °C:** ~30 µm no primeiro dia no motor contra 42 µm/dia relatados (Donhowe e Hartel, 1996, via fonte secundária). Mesma ordem de grandeza.
- **Composição:** leite, creme e leite em pó conferidos contra a USDA, com uma diferença registrada (proteína do leite em pó, −1,2 g).
