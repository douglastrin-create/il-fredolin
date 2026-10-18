# Casos de referência — previsões condicionais

Gerado por `node tools/validacao.mjs` a partir de `docs/validacao/casos.json` (16 casos). Previsão **sem calibração** pelos lotes. Nenhum caso tem medição ainda: a coluna "Medido" fica vazia até existir um lote real com lote, data e instrumento.

| Caso | Categoria | Serviço ideal (°C) | Congelada (%) | Sólidos (%) | POD (%) | Overrun (%) | Derretido 10 min (%) | Endurecer pote (min) | Colher após espera (°C) | No ponto após (min) | Quenelle (°C) | Medido |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| leite-fiordilatte | Gelato de leite | -12,9 | 71 | 36,4 | 18,0 | 33 | 31 | 196 (470 mL a -18 °C) | -13,8 (10 min) | 13 | -11,4 | — |
| gemas-crema | Gelato com gemas | -12,0 | 73 | 36,3 | 16,5 | 35 | 20 | 183 (470 mL a -18 °C) | -13,6 (10 min) | 16 | -10,8 | — |
| baunilha-fava | Gelato de leite (baunilha) | -12,6 | 72 | 36,6 | 18,1 | 33 | 30 | 193 (470 mL a -18 °C) | -13,8 (10 min) | 14 | -11,2 | — |
| chocolate | Chocolate | -12,6 | 72 | 40,5 | 20,2 | 33 | 24 | 189 (470 mL a -18 °C) | -13,7 (10 min) | 14 | -11,3 | — |
| oleaginosa-pistache | Oleaginosas | -12,2 | 73 | 40,4 | 17,8 | 35 | 15 | 181 (470 mL a -18 °C) | -13,5 (10 min) | 15 | -11,2 | — |
| oleaginosa-avela | Oleaginosas | -12,2 | 73 | 40,7 | 18,2 | 35 | 15 | 181 (470 mL a -18 °C) | -13,5 (10 min) | 15 | -11,3 | — |
| sorbet-morango | Sorbet de fruta | -13,3 | 70 | 30,1 | 26,0 | 15 | 50 | 238 (470 mL a -18 °C) | -14,4 (10 min) | 15 | -10,4 | — |
| vegetal-coco | Sistema vegetal | -12,6 | 72 | 38,2 | 21,4 | 28 | 31 | 197 (470 mL a -18 °C) | -13,8 (10 min) | 14 | -11,0 | — |
| aerado-semifreddo | Produto aerado | -5,9 | 79 | 43,0 | 17,3 | 115 | 10 | 103 (470 mL a -18 °C) | — | — | -5,6 | — |
| aerado-americano | Produto aerado (overrun alto) | -9,5 | 79 | 37,5 | 13,7 | 35 | 20 | 153 (470 mL a -18 °C) | -13,1 (10 min) | 23 | -8,5 | — |
| baixo-acucar | Baixo teor de açúcar | -12,0 | 71 | 35,0 | 15,9 | 30 | 57 | 188 (470 mL a -18 °C) | -13,7 (10 min) | 16 | -10,3 | — |
| nova-granita | Família nova: granita | -5,5 | 70 | 24,0 | 22,6 | 5 | 49 | 197 (500 mL a -18 °C) | — | — | -4,5 | — |
| nova-froyo | Família nova: frozen yogurt | -5,8 | 50 | 33,9 | 17,7 | 38 | 26 | 173 (500 mL a -20 °C) | — | — | -5,6 | — |
| nova-dondurma | Família nova: dondurma | -11,3 | 71 | 37,6 | 20,0 | 19 | 35 | 185 (500 mL a -20 °C) | — | — | -9,3 | — |
| estab-natural-dondoli | Sistema estabilizante natural | -13,3 | 70 | 30,0 | 26,0 | 15 | 50 | 238 (470 mL a -18 °C) | -14,4 (10 min) | 15 | -10,4 | — |
| cardamomo | Gelato de leite (cardamomo) | pendente: Cardamomo não está no banco de ingredientes: sem composição com fonte, o caso fica pendente (não inventar). ||||||||||| — |

Cenários do §49 com previsão: Maestro ~1.100 g; sacarose + dextrose monoidratada; Fior di latte; pote 470 mL; −18 °C; temperagem antes do serviço; Baunilha; Sistemas estabilizantes naturais. Pendentes: Gelato de leite (cardamomo).

"Colher após espera" é a camada de servir depois da espera na cozinha (temperagem); "No ponto após" é quando ela chega à temperatura de serviço ideal da receita.

