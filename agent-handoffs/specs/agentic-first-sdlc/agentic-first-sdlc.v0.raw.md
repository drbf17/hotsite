---
spec_id: "agentic-first-sdlc"
title: "Apresentação — Agentic-First SDLC: Fundamentos de Engenharia na Era dos Agentes"
change_type: "feature"

actors:
  - name: "Visitante do hotsite"
    auth: "não autenticado, acesso público via navegador — mesmo modelo das demais apresentações em presentations/"

happy_path:
  - step: "Visitante acessa a página inicial de apresentações (index.html) e vê o card 'Agentic-First SDLC' na lista, com título e descrição"
  - step: "Visitante clica no card e é levado para presentations/agentic-first-sdlc/index.html"
  - step: "Visitante vê a seção hero com a imagem resources/Agentic-First-SDLC.jpeg, um eyebrow, um headline, um subheadline e um CTA de scroll para a primeira seção de conteúdo"
  - step: "Visitante rola a página e percorre uma seção dedicada para cada tema do resources/insights-synthesis.md, na mesma ordem do documento fonte (introdução/fio condutor, Temas 1–7, tabela de tensões entre fontes, implicações para o workflow)"
  - step: "Elementos de cada seção animam (fade + slide-in) ao entrarem em viewport, seguindo o padrão data-animate / classe in-view já usado em presentations/template-driven-ui e presentations/mudanca-para-negocio"
  - step: "Visitante chega à seção de fechamento com uma frase de posicionamento que resume o through-line do documento"
  - step: "Visitante pode retornar à lista de apresentações a qualquer momento pelo link fixo '← Apresentações'"

acceptance_criteria:
  - given: "o visitante está em index.html"
    when: "a lista de apresentações é renderizada"
    then: "um card com slug 'agentic-first-sdlc', título e descrição aparece, com href para presentations/agentic-first-sdlc/index.html (entrada adicionada em js/presentations-data.js)"

  - given: "o visitante clicou no card"
    when: "presentations/agentic-first-sdlc/index.html carrega"
    then: "a seção hero exibe a imagem (via <picture> com fallback webp/jpeg, como no padrão existente), um headline e um link de scroll para a primeira seção de conteúdo"

  - given: "o visitante está na seção hero"
    when: "ele rola a página"
    then: "encontra, em sequência, uma seção por tema do insights-synthesis.md — introdução (fio condutor), Tema 1 a Tema 7, tensões entre fontes, implicações para o workflow — cada uma com eyebrow, título e subtítulo no padrão section-heading já usado"

  - given: "uma seção com elementos marcados data-animate entra no viewport"
    when: "o IntersectionObserver dispara"
    then: "a seção recebe a classe in-view e os elementos animam de opacity:0/translateY(18px) para o estado visível, no mesmo timing (--duration-slow, --ease-standard) das demais apresentações"

  - given: "o visitante chega ao fim da página"
    when: "a seção de fechamento é exibida"
    then: "uma frase de posicionamento single-statement resume o through-line ('IA tornou o código barato de produzir e caro de confiar') no mesmo estilo visual da seção positioning das outras apresentações"

  - given: "o visitante está em qualquer ponto da apresentação"
    when: "ele clica em '← Apresentações'"
    then: "é redirecionado para ../../index.html sem erro 404"

nfrs:
  - metric: "LCP (Largest Contentful Paint) da seção hero, p75, 4G simulado"
    value: "≤ 2.5s"                    # DRAFT — PO unconfirmed, ancorado no padrão de web performance para hero com imagem grande
  - metric: "Peso do arquivo de imagem hero em WebP"
    value: "≤ 500KB"                   # DRAFT — PO unconfirmed, ancorado no tamanho de hero.webp das apresentações existentes
  - metric: "Suporte de navegador"
    value: "últimas 2 versões estáveis de Chrome, Firefox, Safari e Edge"   # DRAFT — PO unconfirmed
  - metric: "Contraste de texto sobre a imagem/scrim do hero (WCAG)"
    value: "AA — razão ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande"  # DRAFT — PO unconfirmed

edge_cases:
  - "JavaScript desabilitado no navegador: elementos com data-animate permanecem em opacity:0 indefinidamente — comportamento já presente nas apresentações existentes (main.js só ativa `.in-view` via IntersectionObserver); replicar o mesmo padrão aqui, sem introduzir uma regressão nova, mas sem tentar corrigi-lo nesta feature"
  - "resources/Agentic-First-SDLC.jpeg (ou seu derivado .webp) falha ao carregar: reaproveitar o fallback visual já usado (classe hero__photo--error via onerror), não criar um mecanismo novo"
  - "Viewport muito estreito (<360px): a seção de comparação de granularidade multi-agente (Tema 5, tabela) e a tabela 'Onde as fontes discordam' (4 colunas) precisam quebrar em layout de coluna única ou scroll horizontal contido, sem overflow da página"
  - "Visitante chega direto por link profundo em uma âncora de seção (ex. #tema-4), sem passar pela hero: o conteúdo da seção deve ficar legível mesmo que o estado in-view ainda não tenha disparado (ou disparar corretamente ao carregar já na âncora)"
  - "O cabeçalho do Tema 2 está ausente/corrompido na fonte (resources/insights-synthesis.md, linha 28, contém apenas '``' em vez de um heading '## Theme 2 — ...'): o título da seção precisa ser inferido a partir do conteúdo (gates determinísticos de qualidade vs. instruções em prompt) — sinalizado aqui para o spec-judge validar a redação proposta"
  - "Conteúdo de uma seção mais longo que o padrão das demais apresentações (ex. a tabela de mecanismos do Tema 2, com 3 colunas e texto longo): precisa de um tratamento de CSS específico para não estourar o card/layout"

out_of_scope:
  - "Narração em áudio ou vídeo incorporado à apresentação"
  - "Exportação para PDF, PPTX ou outro formato offline"
  - "Tradução para qualquer idioma além do português (o documento fonte está em inglês; a apresentação de saída é 100% em português)"
  - "Alteração dos tokens de design compartilhados de forma incompatível com as apresentações existentes — o bundle é independente (presentations/agentic-first-sdlc/css/tokens.css próprio), mas deve seguir a mesma paleta/escala já estabelecida"
  - "CMS ou edição dinâmica de conteúdo — a apresentação é estática, com conteúdo hard-coded no HTML, como as duas apresentações existentes"
  - "Criação de uma seção dedicada por citação de fonte individual (Pocock, Uncle Bob, Waldemar, Galego) — o agrupamento é por tema, não por autor"

dependencies:
  - "resources/insights-synthesis.md como fonte de conteúdo — se o arquivo for alterado após a implementação, a apresentação NÃO se atualiza automaticamente (conteúdo é copiado/adaptado, não injetado em runtime); divergência futura entre fonte e apresentação é aceita"
  - "resources/Agentic-First-SDLC.jpeg como imagem hero — deve ser convertida para um par jpeg+webp dentro de presentations/agentic-first-sdlc/assets/, seguindo o padrão de otimização das demais apresentações"
  - "presentations/template-driven-ui/ e presentations/mudanca-para-negocio/ como referência viva de padrão visual/estrutural — são lidos como exemplo, não modificados por esta feature"
  - "js/presentations-data.js precisa ganhar uma nova entrada {slug, title, description, href} — é um arquivo compartilhado; a alteração deve ser um append, sem tocar nas entradas existentes"

existing_figma: ""   # DRAFT — não existe Figma; o "design existente" é o código-fonte das duas apresentações já publicadas (template-driven-ui e mudanca-para-negocio), que define tokens, hero, section-heading e o padrão data-animate/in-view. Deixado em branco propositalmente por seguir o padrão do template, mas o Prototyping Agent deveria tratar esse código como a referência de design, não partir do zero.

data_touched:
  - field: "Conteúdo textual da apresentação, adaptado de resources/insights-synthesis.md"
    pii: false
    classification: "public"
  - field: "Imagem hero (resources/Agentic-First-SDLC.jpeg e derivados)"
    pii: false
    classification: "public"

repo_boundaries:
  enabled: false
---

# Problem Statement

O time compilou um documento de síntese (`resources/insights-synthesis.md`) com os aprendizados de sete fontes sobre engenharia de software na era dos agentes de IA, e quer transformá-lo em uma apresentação HTML estática, em português, que qualquer pessoa possa navegar pelo hotsite — nos mesmos moldes visuais e estruturais das duas apresentações já publicadas (`template-driven-ui` e `mudanca-para-negocio`). Cada tema do documento vira uma seção própria, dinâmica e visualmente atrativa (com as mesmas animações de entrada em viewport já usadas nas outras apresentações), usando `resources/Agentic-First-SDLC.jpeg` como imagem de hero. Saberemos que funcionou quando a apresentação estiver acessível a partir da lista em `index.html`, seguir fielmente a ordem temática do documento fonte, e for indistinguível em qualidade de acabamento das duas apresentações existentes.

# Notes

- Este spec foi rascunhado com apoio do `spec-writer`. Os campos marcados `# DRAFT` são âncoras propostas, não respostas confirmadas pelo PO — o `spec-judge` deve pressionar especificamente esses pontos.
- A estrutura de seções proposta (mapeamento 1:1 com os temas do documento fonte) segue a orientação explícita do PO de que "cada tema deve ser uma seção". Não houve curadoria/redução de temas.
- O documento fonte tem uma tabela ("Onde as fontes discordam") e um bloco de "O que isso implica para o workflow" que também deveriam virar seções próprias, por consistência com a regra "cada tema = uma seção" — tratando-os como temas adicionais, não apenas apêndice.
- Título de trabalho da página (`<title>`) e headline do hero ainda não foram confirmados com o PO — ambos precisam ser validados na grilagem.
