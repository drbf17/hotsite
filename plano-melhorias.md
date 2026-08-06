# Plano de Execução — Melhorias (`melhorias.md`)

> Plano para aplicar as 3 melhorias solicitadas: expandir Antes/Depois de 6 para 12 cards, criar seção de Resultados, criar seção de Posicionamento. Site atual (V1) já está em `index.html` com hero + 6 cards funcionando.

---

## Escopo das melhorias

1. **Antes e Depois**: 6 → **12 cards**, com o texto canônico fornecido em `melhorias.md` (substitui o copy atual)
2. **Nova seção "Resultados"**: 4 destaques (time to market, esforço, qualidade, foco no domínio)
3. **Nova seção "Posicionamento"**: frase-âncora + parágrafo explicando a plataforma

Continuam fora de escopo (backlog V2, conforme `plano-execucao-v1.md`): páginas de detalhe por card, CTA final, animação de decolagem/docking, zoom-out no scroll.

---

## 1. Mapeamento de conteúdo — Antes/Depois (12 temas)

As duas listas do `melhorias.md` (as-is e to-be) têm 12 itens cada, na **mesma ordem temática** — pareei item a item. 6 já existem no site (criados na V1, mas com copy livre); vou realinhar o texto deles para a redação canônica do briefing. 6 são novos e precisam de card + ícone.

| # | Tema | Status | As-is (fonte) | To-be (fonte) |
|---|---|---|---|---|
| 1 | Arquitetura: app por linha vs. mini-apps | Existe — realinhar copy | App por linha de negócio ou app único com módulos, cronograma comum gera conflitos/atrasos/rollback | App único com mini-apps e CI/CD independente, no ritmo de cada linha de negócio |
| 2 | Velocidade de lançamento (OTA) — **card destaque** | Existe — realinhar copy | Nativo rápido mas preso à loja, ou web lento | Carregamento rápido, fluido, OTA sem depender da loja |
| 3 | Infraestrutura própria vs. plataforma | Existe — realinhar copy | Cada app cria sua própria infra, interpretando padrões e segurança | Plataforma fornece toda a infra; time foca no produto |
| 4 | Design System | Existe — realinhar copy | Padrões visuais/UX variam entre produtos | Design System consistente, qualidade e uniformidade |
| 5 | Cross-platform | Existe — realinhar copy | Esforço duplicado Android/iOS | Desenvolve uma vez, roda nos dois |
| 6 | **Novo:** Dependências | **Criar** | Conflitos de dependências nas plataformas mobile | SDK da plataforma gerencia dependências e garante harmonia |
| 7 | **Novo:** Complexidade de dev mobile | **Criar** | Desenvolvimento mobile complexo | Plataforma abstrai a complexidade do desenvolvimento mobile |
| 8 | **Novo:** Infra de backend | **Criar** | Preocupação com infraestrutura de backend | Plataforma abstrai a complexidade da infra de backend |
| 9 | **Novo:** Gates de qualidade | **Criar** | Necessidade de interpretar/aplicar normas de qualidade sozinho | Gates de qualidade padronizados em todo o processo |
| 10 | Observabilidade | Existe — realinhar copy | Esforço da vertical para implementar observabilidade | Plataforma fornece observabilidade de forma simples |
| 11 | **Novo:** Direcionamento por dado | **Criar** | Direcionamento pela percepção dos gestores (dificuldade de coletar dado) | Direcionamento pelo feedback do usuário, sem esforço adicional |
| 12 | **Novo:** Escalabilidade | **Criar** | Escalabilidade limitada por falta de pessoal especializado ou centralização em time único | Alta escalabilidade: verticais usam a plataforma e mantêm independência |

**Ordem final dos 12 cards no site:** exatamente a ordem da tabela acima (1→12), a mesma ordem do `melhorias.md`. O card 2 (OTA) continua sendo o **card de destaque** com a micro-animação em loop.

---

## 2. Ajustes técnicos na seção de cards

- Grid atual (`cards.css`) é `repeat(3, 1fr)` para 6 cards (2 linhas). Com 12, vira **4 linhas de 3** no desktop — o CSS grid já suporta isso automaticamente, sem mudança estrutural, só mais `<article class="card">` no HTML
- Cada novo card precisa de: badge Antes/Depois, título, descrição curta (título+descrição sintetizados a partir da frase longa do briefing, no mesmo padrão dos 6 existentes), e um par de ícones SVG inline (before/after), seguindo o mesmo estilo de linha (`.icon-stroke`/`.icon-fill`) já usado
- Título da seção/heading não muda de estrutura, só o conteúdo por trás fica mais denso — vale revisar o `subtitle` do heading (hoje: "Passe o mouse — ou toque — em cada card...") para ver se ainda cabe bem com 12 itens (mantenho, ainda é válido)
- Página fica mais longa — nenhuma mudança de mecânica necessária (scroll normal), mas vale revisitar o `IntersectionObserver` de `#cards` (`in-view`) para garantir que o loop do card de destaque não dispare antes de aparecer na tela (já está correto, ativa quando a seção entra no viewport)

---

## 3. Nova seção "Resultados"

**Conteúdo (4 itens, do briefing):**
1. Menor time to market
2. Menor esforço para gerar valor
3. Maior qualidade
4. Foco no domínio do negócio

**Estrutura proposta:**
- Section heading no mesmo padrão das outras (`eyebrow` + `title` + `subtitle` curto)
- 4 "tiles" de destaque em grid horizontal (4 colunas desktop → 2 → 1 no mobile), cada um com: ícone simples (seta pra baixo/cima, engrenagem, selo de qualidade, alvo — a definir por item), o texto do briefing como título curto, e uma linha de apoio opcional (1 frase, redigida a partir do contexto do projeto para não ficar só um bullet solto)
- Reaproveita os tokens/badges já existentes (paleta 60/30/10), sem necessidade de novo componente visual do zero

**Novo arquivo:** `css/results.css` (ou incorporar em `components.css`, a decidir na implementação)

---

## 4. Nova seção "Posicionamento"

**Conteúdo (do briefing):**
- Frase-âncora: **"A plataforma é o produto que suporta todos os produtos"**
- Parágrafo de apoio: sobre a escolha histórica entre "enfrentar o desafio mobile sozinho" ou "delegar a um time de canal", e como a plataforma resolve isso oferecendo os dois (independência + suporte)

**Estrutura proposta:**
- Seção com tratamento visual diferente das demais (fundo levemente azulado, tom "pausa" na leitura, seguindo a regra de que o azul é a cor de identidade/estrutura) — separa visualmente Cards/Resultados de uma seção mais "declarativa"
- Frase-âncora em tipografia grande (maior que os headings de seção), texto de apoio abaixo, centralizado, largura de leitura limitada (~40-50 caracteres por linha)
- Sem cards/ícones aqui — é uma seção de respiro e afirmação de posicionamento, propositalmente mais simples

**Novo arquivo:** `css/positioning.css`

---

## 5. Sitemap atualizado da página

```
1. Hero (já existe)
2. Antes e Depois — 12 cards (expandido)
3. Resultados — novo
4. Posicionamento — novo
```

CTA final segue fora de escopo por enquanto (não mencionado em `melhorias.md`).

---

## 6. Fases de execução (estimativa em horas)

| Fase | Descrição | Estimativa |
|---|---|---|
| A | Realinhar copy dos 6 cards existentes com o texto canônico do briefing | 1–1,5h |
| B | Criar os 6 cards novos (copy + ícones SVG before/after + markup) | 3–4h |
| C | Ajustar grid/CSS de cards para 12 itens e revisar responsividade (3→2→1 colunas) | 0,5h |
| D | Construir seção "Resultados" (markup + CSS + 4 ícones) | 1,5–2h |
| E | Construir seção "Posicionamento" (markup + CSS + copy) | 1–1,5h |
| F | Revisão geral: ordem de seções, scroll, contraste, teste em `file://` | 1h |
| **Total** | | **~8–10,5h** |

**Ordem de execução recomendada:** A → C (ajustar grid antes de encher com os novos, evita retrabalho visual) → B → D → E → F.

---

## Observações / decisões já tomadas para essa implementação

- Os textos originais do briefing são frases longas e corridas — vou sintetizá-los em **título curto + descrição de 1-2 frases** por card/tile, no mesmo padrão editorial já usado nos 6 cards da V1 (mesma decisão tomada anteriormente: "redigir a partir do briefing")
- Nenhuma mudança na mecânica de interação dos cards (hover reveal + card de destaque em loop) — só crescem em quantidade
- Resultados e Posicionamento seguem o sistema de design já implementado (tokens, paleta 60/30/10, componentes de badge/heading) — sem novas dependências ou bibliotecas

---

## Próximo passo

Após validação deste plano, seguir a ordem de fases (A→F) e pedir teste visual ao final de cada incremento perceptível: (1) 12 cards realinhados/completos, (2) seção Resultados, (3) seção Posicionamento — conforme combinado anteriormente.
