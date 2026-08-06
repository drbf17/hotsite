# Plano de Execução — Hotsite SuperApp

> Baseado em `plano-hotsite-superapp.md`. Este documento quebra a spec em fases, tarefas, estrutura de arquivos e ordem de execução para implementação direta (HTML/CSS/JS puro, sem build, rodando em `file://`).

---

## 0. Sequenciamento geral

Ordem escolhida por dependência técnica, não pela ordem do sitemap: primeiro a fundação (tokens/estrutura), depois a peça de maior risco (hero), depois o padrão que se repete mais (cards), depois o que depende dos cards (detalhe), por fim as seções simples e o polimento.

```
Fase 0  Setup de projeto
Fase 1  Design tokens & sistema base
Fase 2  Hero — cena espacial          ← maior risco/esforço
Fase 3  Cards Antes/Depois
Fase 4  Páginas de detalhe            ← depende da Fase 3
Fase 5  Seções finais (Resultados, Posicionamento, CTA)
Fase 6  Responsividade & acessibilidade
Fase 7  QA final & entrega
```

**Estimativa total: ~8–12 dias úteis (1 dev).**

---

## 1. Estrutura de arquivos

```
/hotsite
  index.html
  /css
    reset.css
    tokens.css        # cores (60/30/10), spacing, tipografia, radius
    layout.css         # containers, grid, breakpoints
    components.css      # botões, badges, wrappers de seção
    hero.css
    cards.css
    detail.css
    animations.css      # keyframes reutilizáveis
  /js
    main.js           # bootstrap, listeners globais
    hero-scene.js       # animação da cena espacial
    cards.js         # hover/tap reveal
    detail-view.js       # transição e navegação de detalhe
    router.js         # hash-based, sem servidor
    utils.js
  /assets
    /svg
      rockets/        # variações de foguete por insígnia
      station/         # módulos da estação (partes independentes)
      icons/          # lock, ota, docking-flash, etc.
    /fonts            # .woff2 locais
    /img             # se houver rasters (evitar CDN)
```

**Nota técnica importante:** rodando via `file://`, `fetch()` de SVGs externos é bloqueado por CORS em vários navegadores (Chrome em especial). Preferir **SVG inline no HTML** (ou `<img src="...svg">`/`background-image`, que funcionam em `file://`) em vez de carregar via `fetch`/`XMLHttpRequest`. Isso afeta diretamente como a Fase 2 e 3 devem ser implementadas — decidir isso antes de produzir os assets.

---

## Fase 0 — Setup de projeto *(0,5 dia)*

- [ ] Criar estrutura de pastas acima
- [ ] `index.html` esqueleto semântico com todas as seções (`<section id="hero">`, `#cards`, `#detail` overlay, `#results`, `#positioning`, `#cta`)
- [ ] `reset.css` mínimo
- [ ] Definir breakpoints (mobile / tablet / desktop) em `layout.css`
- [ ] Baixar e referenciar fonte(s) localmente (`.woff2` + `@font-face`), sem link para Google Fonts

**Critério de aceite:** abrir `index.html` direto no navegador (duplo clique) e ver a estrutura básica sem erros de console.

---

## Fase 1 — Design tokens & sistema base *(0,5–1 dia)*

- [ ] `tokens.css` com custom properties: paleta 60% branco / 30% azul / 10% laranja (variações de tom dentro de cada cor), escala de espaçamento, escala tipográfica, radius, sombras
- [ ] Componentes base reutilizáveis: botão primário/secundário, badge (para selos "OTA"/"rápido"), wrapper de seção com padding padrão
- [ ] Grid/container base para as seções de cards e conteúdo

**Critério de aceite:** paleta e componentes base visíveis numa página de teste/estilo antes de aplicar no conteúdo real.

---

## Fase 2 — Hero: cena espacial *(2–3 dias)*

Maior risco técnico do projeto — decompor em sub-tarefas incrementais e testáveis isoladamente.

- [ ] 2.1 Fundo estrelado com parallax leve (mousemove + scroll listener, `transform: translate` em camadas)
- [ ] 2.2 Produzir/organizar SVGs de foguete (4–6 variações de cor/insígnia)
- [ ] 2.3 Animação de subida dessincronizada — CSS keyframes com `animation-delay` distintos por foguete (evitar JS pesado se CSS resolver)
- [ ] 2.4 SVG da estação espacial dividido em módulos que aparecem progressivamente (um por foguete acoplado)
- [ ] 2.5 Lógica de "docking": ao foguete completar a subida, disparar troca de estado + flash/selo de conexão (via `animationend` listener)
- [ ] 2.6 Estado idle pós-montagem: luzes piscando, painéis girando devagar, antena "transmitindo" — todos `animation: infinite` em CSS
- [ ] 2.7 Entrada do headline (fade + translate) sincronizada com o fim da montagem
- [ ] 2.8 Efeito de "câmera se afastando" no scroll — `IntersectionObserver` ou listener de scroll com `transform: scale/translate`
- [ ] 2.9 Fallback para `prefers-reduced-motion`: versão estática ou animações reduzidas

**Decisão já tomada na spec:** SVG + CSS/JS puro, não Three.js (incompatível com premissa "sem build/sem servidor").

**Critério de aceite:** sequência de montagem roda uma vez, assenta em estado idle, não recomeça em loop completo; funciona com `prefers-reduced-motion` ativado.

---

## Fase 3 — Cards Antes/Depois *(1–2 dias)*

- [ ] 3.1 Markup dos 6 cards temáticos (arquitetura, velocidade de lançamento, infraestrutura, consistência visual, complexidade mobile, observabilidade)
- [ ] 3.2 CSS hover reveal: crossfade "antes" → "depois" (~300–400ms) + leve movimento
- [ ] 3.3 Suporte a tap em mobile: classe toggle via JS (sem depender de `:hover`)
- [ ] 3.4 Ícones/ilustrações SVG inline por card (bloqueio vs. livre, torre de controle vs. OTA)
- [ ] 3.5 Card de destaque (deploy/OTA) com micro-animação narrativa em loop (2–3s) — a peça "wow" da seção
- [ ] 3.6 Acessibilidade: cards focáveis via teclado (`tabindex`, `:focus-visible`), `aria-label` descrevendo antes/depois

**Critério de aceite:** os 6 cards alternam estado de forma independente, sem jank, e funcionam via tap em um dispositivo mobile real ou emulado.

---

## Fase 4 — Páginas de detalhe *(1–2 dias)*

Depende da Fase 3 estar com os cards finalizados (a transição usa a posição do card de origem).

- [ ] 4.1 Markup das 6 seções de detalhe, ocultas por padrão (`display:none` + `aria-hidden="true"`)
- [ ] 4.2 `router.js`: navegação hash-based (`#detalhe/deploy`) — funciona em `file://`, permite voltar/avançar do navegador e estado "bookmarkável"
- [ ] 4.3 Transição "zoom in": capturar `getBoundingClientRect()` do card clicado e animar a entrada do painel de detalhe a partir dessa posição/tamanho (equivalente vanilla ao `layoutId` do Framer Motion mencionado na spec original)
- [ ] 4.4 Estrutura de conteúdo por detalhe: topo (antes/depois ampliado) → corpo (2–3 blocos curtos) → diagrama opcional (SVG reaproveitando o estilo visual do docking do hero) → rodapé (nav próximo/anterior + voltar)
- [ ] 4.5 Transição de saída (zoom out) simétrica à entrada

**Critério de aceite:** clicar em qualquer card abre o detalhe correspondente com a transição de zoom, navegação entre temas funciona, voltar retorna à posição correta na página principal.

---

## Fase 5 — Seções finais *(1 dia)*

- [ ] 5.1 Resultados/Impacto — métricas simples (time to market, esforço, qualidade, foco em domínio)
- [ ] 5.2 Posicionamento — frase-âncora em destaque tipográfico ("A plataforma é o produto que suporta todos os produtos")
- [ ] 5.3 CTA — contato / documentação / agendamento

**Critério de aceite:** seções presentes, seguindo os tokens de design da Fase 1, sem CSS ad-hoc fora do sistema.

---

## Fase 6 — Responsividade & acessibilidade *(1–2 dias)*

- [ ] Testar em mobile, tablet, desktop (breakpoints da Fase 0)
- [ ] `prefers-reduced-motion` cobrindo hero, cards e transições de detalhe
- [ ] Contraste de cores WCAG AA (checar principalmente o laranja sobre branco/azul)
- [ ] Performance: animações do hero/cards só disparam quando a seção está na viewport (`IntersectionObserver`), evitando custo com a página toda renderizada de uma vez
- [ ] Validar execução via `file://` direto (sem servidor local) em pelo menos 2 navegadores — checar consoles por erros de CORS/path relativo

**Critério de aceite:** navegação fluida em mobile real, sem erros de console, sem quebra de layout em nenhum breakpoint testado.

---

## Fase 7 — QA final & entrega *(0,5 dia)*

- [ ] Checklist de aceite geral (todas as fases acima)
- [ ] Teste cross-browser: Chrome, Safari, Firefox — todos abrindo `index.html` via duplo clique
- [ ] Revisão de conteúdo (copy) contra o briefing original
- [ ] Empacotar pasta final para entrega (zip ou pasta compartilhada)

---

## Riscos técnicos e decisões já resolvidas

| Risco | Decisão |
|---|---|
| `fetch()` de SVG bloqueado por CORS em `file://` | Usar SVG inline ou `<img src>`/`background-image`, nunca `fetch` |
| Cena 3D (Three.js) incompatível com premissa "sem build" | Confirmado: SVG 2D + CSS/JS, sem Three.js |
| Sem bundler → paths relativos frágeis | Manter estrutura de pastas fixa (`/css`, `/js`, `/assets`) e nunca usar paths absolutos |
| Fontes externas (Google Fonts) exigem internet | Fontes `.woff2` salvas localmente |
| Excesso de animação pode pesar em mobile | Ativar animações via `IntersectionObserver`, respeitar `prefers-reduced-motion` |

---

## Assets a produzir antes/durante a Fase 2–3

- 4–6 variações de foguete (SVG, cores/insígnias distintas)
- Estação espacial dividida em módulos independentes (SVG, um módulo por foguete)
- Ícones: bloqueio/torre de controle, selo OTA, flash de docking, antena, painel solar
- Iconografia de apoio para os 6 cards (arquitetura, velocidade, infraestrutura, design system, cross-platform, observabilidade)

---

## Próximo passo imediato

Iniciar pela **Fase 0 + Fase 1** (setup e tokens) — são pré-requisito de tudo e rápidas de concluir, liberando o terreno para atacar o hero (Fase 2) com o sistema de design já pronto.
