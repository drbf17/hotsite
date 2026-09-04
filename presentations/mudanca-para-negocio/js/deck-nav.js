window.Hotsite = window.Hotsite || {};

/* ---------------------------------------------------------------------------
 * Deck navigation chrome: prev/next buttons, dot indicators, and the
 * current/total counter. Generated entirely from the slide list handed to
 * build() (see js/deck.js's SLIDES array) — no per-slide markup exists in
 * index.html, so adding/reordering a slide there never requires touching
 * this file. Appended once to <body>, so it is present (and reachable via
 * Tab) regardless of which slide is currently active.
 * --------------------------------------------------------------------------- */

Hotsite.deckNav = {
  dots: [],
  prevBtn: null,
  nextBtn: null,
  counterEl: null,

  build: function (slides, api) {
    var nav = document.createElement('nav');
    nav.className = 'deck-nav';
    nav.setAttribute('aria-label', 'Navegação de slides');

    Hotsite.deckNav.prevBtn = Hotsite.deckNav.createButton(
      'deck-nav__btn deck-nav__btn--prev', 'Slide anterior', '‹'
    );
    Hotsite.deckNav.prevBtn.addEventListener('click', function () { api.prev(); });

    Hotsite.deckNav.nextBtn = Hotsite.deckNav.createButton(
      'deck-nav__btn deck-nav__btn--next', 'Próximo slide', '›'
    );
    Hotsite.deckNav.nextBtn.addEventListener('click', function () { api.next(); });

    var dotsList = document.createElement('ul');
    dotsList.className = 'deck-nav__dots';
    dotsList.setAttribute('role', 'list');

    Hotsite.deckNav.dots = slides.map(function (id, i) {
      return Hotsite.deckNav.buildDot(dotsList, i, slides.length, api);
    });

    nav.appendChild(Hotsite.deckNav.prevBtn);
    nav.appendChild(dotsList);
    nav.appendChild(Hotsite.deckNav.nextBtn);

    Hotsite.deckNav.counterEl = document.createElement('p');
    Hotsite.deckNav.counterEl.className = 'deck-counter';
    Hotsite.deckNav.counterEl.setAttribute('aria-live', 'polite');
    Hotsite.deckNav.counterEl.setAttribute('aria-atomic', 'true');

    document.body.appendChild(nav);
    document.body.appendChild(Hotsite.deckNav.counterEl);
  },

  buildDot: function (dotsList, index, total, api) {
    var li = document.createElement('li');
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'deck-nav__dot';
    dot.setAttribute('aria-label', 'Ir para o slide ' + (index + 1) + ' de ' + total);
    dot.addEventListener('click', function () { api.goTo(index); });
    li.appendChild(dot);
    dotsList.appendChild(li);
    return dot;
  },

  createButton: function (className, label, glyph) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('aria-label', label);
    var glyphEl = document.createElement('span');
    glyphEl.setAttribute('aria-hidden', 'true');
    glyphEl.textContent = glyph;
    btn.appendChild(glyphEl);
    return btn;
  },

  // Called by js/deck.js on every slide change to keep the dots, boundary
  // buttons, and the accessible counter in sync with the active slide.
  update: function (index, total) {
    Hotsite.deckNav.dots.forEach(function (dot, i) {
      var isActive = i === index;
      dot.classList.toggle('is-active', isActive);
      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    if (Hotsite.deckNav.prevBtn) {
      Hotsite.deckNav.prevBtn.classList.toggle('is-disabled', index === 0);
      Hotsite.deckNav.prevBtn.setAttribute('aria-disabled', String(index === 0));
    }
    if (Hotsite.deckNav.nextBtn) {
      Hotsite.deckNav.nextBtn.classList.toggle('is-disabled', index === total - 1);
      Hotsite.deckNav.nextBtn.setAttribute('aria-disabled', String(index === total - 1));
    }

    if (Hotsite.deckNav.counterEl) {
      Hotsite.deckNav.counterEl.textContent = (index + 1) + ' / ' + total;
      Hotsite.deckNav.counterEl.setAttribute('aria-label', 'slide ' + (index + 1) + ' de ' + total);
    }
  }
};
