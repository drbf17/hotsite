# Plano de Execução — V1 (Página Inicial: Hero + Cards)

> Recorte de escopo do `plano-hotsite-superapp.md`, focado apenas na página inicial. Substitui o `plano-execucao.md` anterior como guia de trabalho imediato.

---

## Escopo da V1

**Dentro do escopo:**
- Hero (cena espacial, versão simplificada)
- Seção "Antes e Depois" com os 6 cards temáticos

**Fora do escopo da V1** (backlog para V2):
- Páginas de detalhe por card
- Seção de Resultados/Impacto
- Seção de Posicionamento
- CTA final
- Sequência animada de decolagem/docking dos foguetes
- Efeito de zoom-out no scroll saindo do hero

**Restrição inegociável:** 100% local. Sem imagens externas, sem CDN, sem fontes online, sem chamadas de rede de nenhum tipo. Tudo dentro da pasta do projeto; o site deve abrir dando duplo clique no `index.html` (`file://`) em qualquer navegador instalado, sem servidor.

---

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Ilustrações (foguetes, estação, ícones) | SVG detalhado/ilustrativo, escrito em código (inline no HTML), sem arquivo externo |
| Copy (headline, textos dos cards) | Redigido a partir do briefing as-is/to-be da spec original |
| Animação do hero | Versão **simplificada**: estação já montada, **foguetes (mini-apps) presentes e estáticos** acoplados à estação, cena "viva" em idle (luzes, painel, antena) — sem sequência de lançamento/docking animada |
| Cards | Os 6 cards temáticos com hover reveal (Opção A) + 1 card de destaque com micro-animação narrativa (Opção C) |
| Tipografia | Fontes de sistema (`system-ui`/`-apple-system`/`Segoe UI`/`Roboto`), sem arquivo de fonte |
| Prioridade de layout | Desktop-first, com adaptação responsiva para mobile |

**Nota sobre a atualização do escopo do hero:** mesmo na versão simplificada, os foguetes devem estar visíveis desde o primeiro frame, já acoplados à estação (não surgem depois via animação) — isso mantém a leitura imediata da metáfora "mini-apps conectados à plataforma" sem exigir a coreografia completa de subida/docking, que fica para V2.

---

## Estrutura de arquivos (V1)

```
/hotsite
  index.html
  /css
    reset.css
    tokens.css        # paleta 60/30/10, spacing, tipografia, radius
    layout.css         # containers, grid, breakpoints (desktop-first)
    components.css      # botões, badges, wrappers de seção
    hero.css
    cards.css
    animations.css      # keyframes reutilizáveis (idle station, hover reveal, destaque)
  /js
    main.js           # bootstrap, listeners globais
    hero-scene.js       # parallax do fundo + estado idle da estação
    cards.js         # hover/tap reveal + card de destaque
    utils.js
  /assets
    /svg
      rockets/         # ilustrações estáticas dos foguetes (4-6 variações de insígnia)
      station/         # módulos da estação já montada
      icons/          # bloqueio, ota, flash de docking, painel solar, antena
```

Sem `/fonts` (fontes de sistema) e sem `/img` externo — todas as ilustrações são SVG inline ou referenciadas localmente em `/assets/svg`.

---

## Estimativas em horas de trabalho (não dias corridos)

| Fase | Estimativa |
|---|---|
| Fase 0 — Setup | 2–3h |
| Fase 1 — Tokens & sistema base | 2–3h |
| Fase 2 — Hero simplificado | 5–7h |
| Fase 3 — Cards Antes/Depois | 6–9h |
| Fase 4 — Responsividade & acessibilidade | 3–4h |
| Fase 5 — QA final | 1–2h |
| **Total V1** | **~19–28h de trabalho** |

---

## Fase 0 — Setup do projeto *(2–3h)*

- [ ] Criar estrutura de pastas acima
- [ ] `index.html` esqueleto semântico com as duas seções da V1 (`<section id="hero">`, `<section id="cards">`)
- [ ] `reset.css` mínimo
- [ ] Breakpoints desktop-first em `layout.css` (base = desktop, `max-width` media queries reduzem para tablet/mobile)

**Critério de aceite:** abrir `index.html` via duplo clique, estrutura básica visível, sem erros de console.

---

## Fase 1 — Design tokens & sistema base *(2–3h)*

- [ ] `tokens.css`: custom properties para paleta 60% branco / 30% azul / 10% laranja (com variações de tom), escala de espaçamento, escala tipográfica (system fonts), radius, sombras
- [ ] Componentes base: botão, badge (selo "OTA"/"rápido"), wrapper de seção

**Critério de aceite:** tokens aplicados de forma consistente, visíveis numa seção de teste antes de entrar no conteúdo real.

---

## Fase 2 — Hero simplificado com foguetes estáticos *(5–7h)*

- [ ] 2.1 Fundo estrelado com parallax leve (mousemove + scroll listener, `transform: translate` em camadas)
- [ ] 2.2 Ilustração SVG detalhada da estação **já montada**, com módulos distintos
- [ ] 2.3 Foguetes (mini-apps) estáticos acoplados à estação, cada um com cor/insígnia diferente — visíveis desde o load
- [ ] 2.4 Estado idle: luzes piscando, painel solar girando devagar, antena "transmitindo" (`animation: infinite` em CSS)
- [ ] 2.5 Entrada do headline (fade + translate) após um pequeno delay, cena já "assentada" desde o início
- [ ] 2.6 `prefers-reduced-motion`: remove piscar/rotação/parallax, mantém composição estática

**Fora do escopo desta fase (V2):** animação de subida/decolagem dos foguetes, lógica de docking em tempo real, zoom-out no scroll.

**Critério de aceite:** cena carrega com estação e foguetes visíveis, idle roda em loop suave, headline aparece, tudo funciona com `prefers-reduced-motion` ativado.

---

## Fase 3 — Cards Antes/Depois *(6–9h)*

- [ ] 3.1 Markup dos 6 cards temáticos (arquitetura, velocidade de lançamento, infraestrutura, consistência visual, complexidade mobile, observabilidade)
- [ ] 3.2 Copy de cada card redigido a partir do as-is/to-be do briefing
- [ ] 3.3 CSS hover reveal: crossfade "antes" → "depois" (~300–400ms) + leve movimento
- [ ] 3.4 Suporte a tap em mobile (classe toggle via JS, sem depender de `:hover`)
- [ ] 3.5 Ícones/ilustrações SVG inline por card (bloqueio vs. livre, torre de controle vs. OTA)
- [ ] 3.6 Card de destaque (deploy/OTA) com micro-animação narrativa em loop (2–3s)
- [ ] 3.7 Acessibilidade: cards focáveis via teclado (`tabindex`, `:focus-visible`), `aria-label` descritivo

**Critério de aceite:** os 6 cards alternam estado de forma independente, sem jank, funcionam via tap em mobile emulado/real.

---

## Fase 4 — Responsividade & acessibilidade *(3–4h)*

- [ ] Adaptar hero e cards para tablet/mobile a partir da base desktop
- [ ] Checar contraste de cores (WCAG AA), principalmente laranja sobre branco/azul
- [ ] Animações do hero/cards disparando via `IntersectionObserver` apenas quando visíveis
- [ ] Validar `file://` direto em pelo menos 2 navegadores instalados, sem erros de CORS/path

**Critério de aceite:** layout sem quebras em mobile/tablet/desktop, sem erros de console em nenhum navegador testado.

---

## Fase 5 — QA final & entrega V1 *(1–2h)*

- [ ] Checklist de aceite de todas as fases
- [ ] Teste cross-browser (Chrome, Safari, Firefox) abrindo `index.html` por duplo clique
- [ ] Revisão de copy contra o briefing
- [ ] Empacotar pasta final (`/hotsite` completa) para entrega

---

## Estimativa total V1

**~19–28h de trabalho** (1 dev), consideravelmente menor que o plano completo por excluir páginas de detalhe, seções finais e a coreografia de lançamento do hero.

---

## Backlog para V2 (não entra agora)

- Sequência animada de decolagem + docking dos foguetes no hero
- Zoom-out no scroll ao sair do hero
- Páginas de detalhe por card (transição "zoom in" a partir do card clicado)
- Seção de Resultados/Impacto
- Seção de Posicionamento (frase-âncora)
- CTA final

---

## Próximo passo imediato

Iniciar pela **Fase 0 + Fase 1** (setup e tokens) e seguir direto para a **Fase 2** (hero simplificado), já que os foguetes estáticos e a estação idle são a peça central de impacto visual da V1.
