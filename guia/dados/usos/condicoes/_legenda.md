# Panorama das condições (dados/usos/condicoes)

Cada arquivo é um objeto `{ "Nome do grupo": {...} }`, com o mesmo nome usado no campo `g` dos usos. Os arquivos são mesclados sobre `dados/usos/condicoes.json` (campos mais novos substituem os antigos).

Campos (todos opcionais, exceto `resumo`):

- `area`: área da página Condições.
- `resumo`: visão geral em um parágrafo.
- `avaliacao`: lista do que avaliar antes de prescrever.
- `nao_farmacologico`: lista de intervenções não farmacológicas.
- `etapas`: lista de `{ "titulo", "texto" }` com a sequência de tratamento.
- `escolha`: lista de `{ "se", "preferir", "evitar" }` para escolher entre os fármacos.
- `populacoes`: lista de `{ "grupo", "texto" }` (gestação, idosos, crianças, comorbidades).
- `duracao`: texto sobre duração do tratamento e retirada.
- `armadilhas`: lista de erros comuns.
- `monitorar`: lista.
- `diretrizes`: texto com as principais referências.

Campos clínicos acrescentados (arquivos 20-clinica-*.json e 30-completa-*.json):

- `criterios`: `{ "fonte", "cid", "itens": [{ "r": "A", "t": "texto", "sub": [..] }], "especificadores": [..], "notas": [..] }`. DSM-5-TR parafraseado e condensado ou, quando a condição não está no DSM, a principal referência (Hunter, TRRIP, ICHD-3, ACR 2016, McKeith 2017 etc.).
- `rastreio`: `{ "perguntas": [..], "sinais": [..], "instrumentos": [..] }`.
- `diferencial`: lista.
- `manejo_diretrizes`: lista de `{ "fonte", "pontos": [..], "linhas": [{ "linha", "texto" }] }`, uma por diretriz.
- `discussao`: lista de `{ "titulo", "texto" }` (parágrafos separados por linha em branco).
- `fases`: lista de `{ "fase", "duracao", "objetivo" }`, exibida como linha do tempo.
- `algoritmo`: lista de `{ "passo", "acao", "se_falha" }`, exibida como fluxograma.
Os arquivos 40-rev-*.json trazem os critérios revisados contra o texto do DSM-5-TR em português.
