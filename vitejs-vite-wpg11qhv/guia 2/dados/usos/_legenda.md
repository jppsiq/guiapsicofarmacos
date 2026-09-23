# Usos clínicos (dados/usos)

Cada arquivo é um objeto `{ "id-do-farmaco": [usos] }`. Quando um fármaco aparece aqui, esta lista substitui o campo `indicacoes` da ficha.

Campos de cada uso:

- `g`: grupo (condição padronizada; é o que agrupa a página "Condições").
- `c`: condição como aparece na ficha.
- `s`: `a` (aprovado pela Anvisa) ou `o` (fora de bula).
- `e`: evidência. `A` alta (metanálises ou vários ECR consistentes), `B` moderada (ECR limitados ou resultados mistos), `C` baixa (estudos pequenos, abertos ou séries de casos), `D` relatos ou opinião de especialistas.
- `p`: papel. `1` primeira linha, `2` segunda linha, `P` potencialização ou associação, `A` alternativa, `U` casos refratários ou último recurso, `S` sintomático ou adjuvante, `X` não recomendado (evidência negativa ou risco desproporcional).
- `d`: dose usual nessa indicação (opcional).
- `t`: discussão clínica.

`condicoes.json` traz um panorama de cada condição, exibido no topo da página correspondente.
