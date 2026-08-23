---
spec_id: "hero-lateral-travelling-photos"
title: "Hero: substituir cena SVG por foto com travelling lateral (mudanca-para-negocio & template-driven-ui)"

actors:
  - name: "Visitante do hotsite (desktop/mobile, qualquer navegador moderno)"
    auth: "nenhuma — site estático público, sem login, sem sessão"

happy_path:
  - step: "Visitante abre presentations/mudanca-para-negocio/index.html (ou template-driven-ui/index.html)"
  - step: "A seção #hero renderiza usando a foto de referência do respectivo pacote (resources/mudanca-negocio.jpeg e resources/template-driven-ui.jpeg) como visual principal, no lugar da cena SVG (.hero__scene) e do starfield (.hero__starfield) atuais"
  - step: "A foto está enquadrada maior que o viewport do hero e desliza lateralmente de forma contínua e automática (efeito travelling), em loop, sem depender de mouse ou scroll"
  - step: "O overlay .hero__scrim continua aplicado sobre a foto para manter o contraste do texto (eyebrow, headline, subheadline, scroll-cue)"
  - step: "Visitante com prefers-reduced-motion ativado vê a mesma foto em enquadramento estático central, sem o pan"

acceptance_criteria:
  - given: "Usuário sem prefers-reduced-motion abre a presentation mudanca-para-negocio"
    when: "a seção #hero termina de carregar"
    then: "a foto resources/mudanca-negocio.jpeg (copiada para presentations/mudanca-para-negocio/assets/) é exibida preenchendo o hero e se desloca lateralmente em loop contínuo via CSS, sem SVG de estação/foguetes e sem starfield de estrelas"
  - given: "Usuário sem prefers-reduced-motion abre a presentation template-driven-ui"
    when: "a seção #hero termina de carregar"
    then: "a foto resources/template-driven-ui.jpeg (copiada para presentations/template-driven-ui/assets/) é exibida preenchendo o hero e se desloca lateralmente em loop contínuo via CSS, sem SVG de estação e sem starfield de estrelas"
  - given: "Usuário com prefers-reduced-motion: reduce ativado no SO/navegador"
    when: "abre qualquer uma das duas presentations"
    then: "a foto aparece estática, centralizada, sem nenhuma animação de translação (mesmo padrão hoje aplicado ao starfield via Hotsite.utils.prefersReducedMotion())"
  - given: "A foto está posicionada atrás do texto do hero (eyebrow/headline/subheadline/scroll-cue)"
    when: "o travelling lateral está em andamento"
    then: "o contraste de texto permanece dentro do padrão de acessibilidade já usado no hero (.hero__scrim não removido nem enfraquecido)"
  - given: "A tela é redimensionada para breakpoints mobile (<=640px, conforme tokens.css)"
    when: "o hero é renderizado"
    then: "a foto continua cobrindo o hero sem gerar barras vazias nas laterais/topo/base durante todo o ciclo do pan (crop suficiente em todas as larguras suportadas)"
  - given: "A página termina de carregar (incluindo a nova imagem)"
    when: "medido o layout"
    then: "não há layout shift causado pela troca de SVG por foto (dimensões do #hero reservadas via CSS antes do load da imagem, como já ocorre hoje)"

nfrs:
  - metric: "duração de um ciclo do pan lateral (ida, ou ida+volta se for ping-pong)"
    value: "20s por trecho (40s ida+volta) # DRAFT — PO unconfirmed, ancorado em animações CSS lentas típicas de hero cinemagraph; ajustar se parecer rápido/lento demais"
  - metric: "peso de cada arquivo de imagem do hero após otimização"
    value: "≤400KB por imagem # DRAFT — PO unconfirmed; imagens de origem já pesam ~270KB cada, então provavelmente não precisam de reprocessamento"
  - metric: "cumulative layout shift (CLS) causado pela troca de hero"
    value: "0 (sem shift mensurável)"
  - metric: "comportamento sob prefers-reduced-motion"
    value: "pan desabilitado, 0 animações de transform disparadas — reaproveita Hotsite.utils.prefersReducedMotion() já presente em cada bundle"

out_of_scope:
  - "Variante do travelling vinculada a scroll ou a movimento do mouse (o PO optou explicitamente por pan automático contínuo, não interativo)"
  - "Efeito de zoom/Ken Burns (escala) — o pedido é estritamente translação lateral, sem scale"
  - "Manter o starfield de estrelas geradas por JS como camada extra — foi decidido remover, não sobrepor"
  - "Alterações no texto/copy do hero (eyebrow, headline, subheadline) em qualquer uma das duas presentations"
  - "Qualquer outra presentation além de mudanca-para-negocio e template-driven-ui"
  - "Novas seções, CTAs ou reestruturação de layout fora da área do hero"
  - "Uso de vídeo como fundo do hero (fora do escopo; video.js já é usado em outra seção da presentation mudanca-para-negocio e não é afetado)"

dependencies:
  - "Hotsite.utils.prefersReducedMotion() — já existe em cada bundle (js/utils.js), reaproveitado sem mudança de contrato"
  - "Assets de imagem estáticos copiados de resources/*.jpeg para presentations/<slug>/assets/ — bundled no próprio pacote, sem CDN/serviço externo, então não há modo de falha de rede em runtime a tratar # DRAFT-note — spec-judge: perguntas sobre 'lento/erro/indisponível' não se aplicam a um asset estático local; sinalizando isso explicitamente em vez de deixar em branco"

existing_figma: ""

data_touched:
  - field: "nenhum dado de usuário é lido ou gravado — mudança é puramente de asset estático e CSS/JS de apresentação"
    pii: false
    classification: "public"

repo_boundaries:
  enabled: false
---

# Problem Statement

As duas presentations `mudanca-para-negocio` e `template-driven-ui` usam hoje uma cena hero 100% desenhada em SVG (foguetes/estação acoplando) com um starfield de estrelas geradas via JS e parallax por mouse. O pedido é elevar a qualidade visual do hero substituindo essa cena por uma foto de referência já produzida para cada presentation (`resources/mudanca-negocio.jpeg` e `resources/template-driven-ui.jpeg`), com um efeito de câmera "travelling lateral" — um pan horizontal contínuo e automático, no estilo cinemagraph — no lugar do parallax reativo ao mouse.

Sucesso é: ao abrir qualquer uma das duas presentations, o hero mostra a foto correspondente cobrindo toda a área, deslizando lateralmente em loop suave, com o texto do hero permanecendo legível (scrim mantido), sem barras vazias em nenhum breakpoint, e caindo para um enquadramento estático quando `prefers-reduced-motion` está ativo.

# Notes

- Decisões já confirmadas com o PO (via conversa de spec-writer, não são DRAFT):
  1. A foto substitui inteiramente a cena SVG (`.hero__scene`), não fica atrás dela.
  2. O travelling é um pan automático contínuo em loop — não vinculado a scroll nem a mouse.
  3. O starfield atual (`.hero__starfield` + `Hotsite.heroScene.bindParallax`) é removido, não mantido como camada extra.
- Imagens de origem: `resources/mudanca-negocio.jpeg` (estação espacial com foguetes rotulados Pix/Pagamentos/Crédito/Seguros/Assistente Virtual/Extrato — tema já alinhado com a copy atual de "múltiplos produtos em órbita") e `resources/template-driven-ui.jpeg` (linha de montagem industrial de uma nave modular, tema "base/blueprint reconfigurável" — alinhado com a copy "uma base, infinitas jornadas"). Ambas 1408×768.
- `template-driven-ui/` hoje não tem pasta `assets/`; precisará ser criada. `mudanca-para-negocio/assets/` já existe (contém `vdo/` de outra seção) e receberá a nova imagem ao lado.
- Padrão de implementação a reaproveitar: `hero.css` de cada bundle já reserva `min-height: 100vh` para `.hero` e tem breakpoints em 640px (ver `tokens.css`); a nova imagem deve seguir esse mesmo arquivo (`css/hero.css`) em vez de criar um arquivo CSS novo, já que é uma alteração da seção hero existente, não uma seção nova.
- `js/hero-scene.js` deve ser reescrito (ou substituído por um módulo mais simples) já que sua lógica atual — criar `<span>` de estrelas e bind de parallax por mousemove — deixa de fazer sentido sem o starfield.
- Sem PII, sem dependência de rede em runtime além dos assets já bundlados no próprio pacote da presentation.
