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
