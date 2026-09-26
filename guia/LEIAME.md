# Guia de Psicofármacos: projeto editável

## Estrutura

- `dist/guia-psicofarmacos.html`: aplicação completa em um único arquivo. Abre com dois cliques e funciona sem internet (as fontes da web são opcionais).
- `dados/`: todo o conteúdo clínico, em JSON.
  - `farmacos/*.json`: uma lista de fichas por arquivo (antidepressivos, antipsicóticos etc.).
  - `classes.json`: classes, cores, diagramas de sinapse e notas que valem para toda a classe.
  - `equivalencias.json`: tabelas de equivalência de dose.
  - `trocas.json`: guia de trocas. `especificos` traz particularidades de pares; `retirada_ap` define os grupos de retirada de antipsicóticos orais do Stahl (imediata, 1 semana, 3 a 4 semanas, clozapina, convencionais); `sedativos_ap` lista destinos que exigem titulação mais lenta; `lai` traz, para cada injetável, início, cobertura oral, transição a partir de outro depósito e passagem para o oral (aba Antipsicóticos de depósito).
  - `interacoes-pares.json`: interações específicas usadas pelo verificador. Seletores: `id:`, `classe:`, `subclasse:`, `marcador:`, `grupo:`.
  - `farmacos-clinicos.json`: fármacos não psiquiátricos e substâncias (ids começando com `x-`) que entram no verificador e no cruzamento automático de cada ficha.
  - `usos/*.json`: usos clínicos de cada fármaco (aprovados e fora de bula) com papel na conduta, grau de evidência, dose e discussão; substituem o campo `indicacoes` das fichas e alimentam a página Condições. `usos/condicoes.json` e `usos/condicoes/*.json` trazem o panorama de cada condição (avaliação, abordagem não farmacológica, sequência de tratamento, como escolher, populações especiais, duração, armadilhas, monitorização, diretrizes); `usos/discussoes.json` completa discussões de usos. Ver `usos/_legenda.md` e `usos/condicoes/_legenda.md`. `usos/ajustes/*.json` traz correções dos usos revisadas contra as diretrizes (lista de `{ f, g, c?, set | remove | add, motivo }`), aplicadas no build depois dos usos.
  - `motor/farmacocinetica.json`: vias de eliminação de cada psicofármaco com o peso de cada via (principal, parcial, menor), inibição e indução (forte, moderada, fraca) de CYP, UGT e P-gp, eliminação renal e vias com metabólito ativo. É a base das regras farmacocinéticas do verificador.
  - `motor/farmacodinamica.json`: ajustes do perfil (0 a 3) e marcadores extras usados pelas regras farmacodinâmicas.
  - `stahl/*.json`: camada do guia de prescrição (Stahl's Prescriber's Guide, 6.ª ed., 2017), um objeto por id com sintomas-alvo, resposta ao tratamento, potencialização, exames, dicas de dose, mecanismo e manejo dos efeitos adversos, populações especiais, suspensão e troca, vantagens, desvantagens e pérolas. Aparece nas fichas com a etiqueta "Stahl". Texto parafraseado e condensado; onde o critério é só dos EUA, isso está indicado.
  - `psicoeducacao/*.json`: fichas de psicoeducação para pacientes e famílias, por condição (`{ "Condição": [ { id, titulo, subtitulo, publico, figura, blocos, ajuda, fonte } ] }`). Tipos de bloco: texto, lista, passos, checklist, fazer (faça e evite), semaforo, mitos, tabela (com `linhas_vazias` para diários), destaque, anotar. Figuras disponíveis: janela-sono, ciclo-ansiedade, ciclo-toc, ciclo-compulsao, ciclo-panico, humor-bipolar, curva-remedio, onda-fissura, escada-exposicao, respiracao, reducao-gradual, semaforo, rotina-dia. Aparecem na página de cada condição e em Psicoeducação; imprimem em A4 pelo arquivo offline.
  - `complementos/*.json`: camada clínica mesclada às fichas no build (resumo, quando escolher, quando evitar, comparações, pérolas e erros extras, marcadores e textos de risco de interação).
  - `meta.json`: texto da página Sobre e data de revisão.
- `src/`: código da interface (não precisa mexer para editar conteúdo).
- `build.mjs`: gera o arquivo final a partir dos dados.

## Como editar

1. Abra o JSON da classe e altere o texto da ficha.
2. No terminal, dentro da pasta do projeto: `node build.mjs` (requer Node.js 18 ou superior).
3. O build valida identificadores, classes, gravidades e níveis. Se houver erro, ele aponta o arquivo e o fármaco. Use `node build.mjs -v` para ver também os avisos.
4. Abra de novo `dist/guia-psicofarmacos.html`.

## Valores permitidos

- `gravidade`: contraindicada, grave, moderada, leve.
- `populacoes.*.nivel`: preferencial, aceitavel, cautela, evitar, contraindicado.
- `indicacoes.*.status`: anvisa, off_label.
- `comercializacao`: disponivel, restrito, nao_comercializado.
- `perfil`: 0 a 3 para sedacao, peso, metabolico, sexual, anticolinergico, hipotensao, qt, eps, prolactina, serotoninergico, convulsao, sangramento, depressao_respiratoria, dependencia, insonia. Esses números alimentam filtros, radar e verificador de interações.
- `farmacocinetica.cyp`: `substrato` (vias principais), `substrato_menor`, `inibe` e `induz` com força forte, moderado ou fraco.
- `aparencia.formato`: redondo, oblongo, oval, capsula, losango, triangular, pentagonal, quadrado, gotas, solucao, ampola, seringa, adesivo, spray, goma, pastilha, sublingual. Sem `cor`, o desenho sai neutro e tracejado.
- Texto entre `**asteriscos**` aparece em negrito.
- `marcadores` usados pelo motor: imao_irreversivel, imao_reversivel, inibidor_mao_outro, simpaticomimetico, agonista_opioide, antagonista_opioide, antagonista_d2, agonista_dopaminergico, colinergico, triptano, alcool, aine, anticoagulante, betabloqueador, eleva_litio, reduz_litio, hiponatremia, hipocalemia, bradicardia, mielotoxico, janela_estreita, substrato_sensivel, contraceptivo, carbapenemico, indutor_forte, inibidor_3a4_forte, inibidor_1a2_forte, inibidor_2d6_forte.
- `efeito_aumento` e `efeito_reducao`: frase curta exibida quando outro fármaco eleva ou reduz os níveis deste.
- Pares em `interacoes-pares.json` aceitam listas no seletor (`id:a,b,c`), `canal` (mecanismo exibido no verificador) e `pk: true` quando descrevem interação farmacocinética; nesse caso substituem o alerta farmacocinético automático do mesmo par.
