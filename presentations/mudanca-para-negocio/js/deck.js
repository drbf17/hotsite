window.Hotsite = window.Hotsite || {};

/* ---------------------------------------------------------------------------
 * Slide-deck state machine + orchestration.
 *
 * IMPORTANT: this <script> tag must stay the very first child of <body> (see
 * index.html). The single statement below the IIFE — adding the
 * 'deck-active' class — is the whole progressive-enhancement contract: it
 * runs synchronously, before the browser has parsed a single <section>, so
 * css/deck.css's scoping never has a chance to flash the old stacked layout.
 * If this script fails to load at all (disabled JS, blocked request), the
 * class is simply never added and the page renders as today's plain
 * continuous scroll — no separate <noscript> override needed.
 *
 * Slide order/count lives in ONE place: the SLIDE_IDS constant below. Adding,
 * removing or reordering a slide means editing only that list — every other
 * piece (keyboard, buttons, dots, counter, deep-link, history) reads it back
 * out (via Hotsite.deck.slides, set from this constant in init()) and never
 * hardcodes a section name.
 * --------------------------------------------------------------------------- */

// Single source of truth for slide order/count — see the block comment above.
var SLIDE_IDS = ['hero', 'cards', 'results', 'positioning', 'video'];

(function () {
  var root = document.documentElement;
  try {
    root.classList.add('deck-active');
  } catch {
    return; // Can't toggle safely — leave the continuous-scroll fallback in place.
  }

  document.addEventListener('DOMContentLoaded', function () {
    try {
      Hotsite.deck.init(SLIDE_IDS);
    } catch {
      // Any unexpected bootstrap failure must never leave a blank page:
      // drop back to the pre-deck continuous-scroll layout instead.
      root.classList.remove('deck-active');
    }
  });
})();

Hotsite.deck = {
  slides: [],
  elements: [],
  currentIndex: 0,
  locked: false,

  init: function (slideIds) {
    Hotsite.deck.slides = slideIds;
    Hotsite.deck.elements = slideIds.map(function (id) {
      return document.getElementById(id);
    });

    if (Hotsite.deck.elements.indexOf(null) !== -1) {
      throw new Error('deck: one or more slide ids missing from the DOM');
    }

    if (Hotsite.deckNav && typeof Hotsite.deckNav.build === 'function') {
      Hotsite.deckNav.build(Hotsite.deck.slides, {
        goTo: Hotsite.deck.goTo,
        next: Hotsite.deck.next,
        prev: Hotsite.deck.prev
      });
    }

    var parsed = Hotsite.deck.parseSlideParam();
    Hotsite.deck.activate(parsed.index, parsed.valid ? 'none' : 'replace');

    Hotsite.deck.bindKeyboard();
    Hotsite.deck.bindPopstate();
    Hotsite.deck.bindHeroCue();
  },

  // Reads `?slide=N` (1-indexed) straight off location.search, without the
  // URLSearchParams global, so this keeps working identically under file://.
  // A valid value only ever needs to match /^[0-9]+$/, so the raw
  // (still percent-encoded) capture is validated directly against the digit
  // regex — no decodeURIComponent step is needed, and none is attempted, so
  // malformed percent-escapes (e.g. `?slide=%`) can never throw a URIError
  // here. Anything that isn't a bare run of digits (encoded or not) simply
  // fails the regex and falls back to slide 1, per AC1.
  parseSlideParam: function () {
    var total = Hotsite.deck.slides.length;
    var search = window.location.search || '';
    var match = /(?:^\?|&)slide=([^&]*)/.exec(search);
    var raw = match ? match[1] : '';
    var isNumeric = /^[0-9]+$/.test(raw);
    var n = isNumeric ? parseInt(raw, 10) : NaN;
    var valid = n >= 1 && n <= total;
    return { index: valid ? n - 1 : 0, valid: valid };
  },

  goTo: function (index) {
    var total = Hotsite.deck.slides.length;
    if (Hotsite.deck.locked) return;
    if (index < 0 || index >= total) return;
    if (index === Hotsite.deck.currentIndex) return;
    Hotsite.deck.lock();
    Hotsite.deck.activate(index, 'push');
  },

  next: function () {
    Hotsite.deck.goTo(Hotsite.deck.currentIndex + 1);
  },

  prev: function () {
    Hotsite.deck.goTo(Hotsite.deck.currentIndex - 1);
  },

  // Single point of truth for "the deck is now on slide `index`": swaps the
  // .is-active class, pauses an outgoing video slide, syncs the URL, and
  // updates the nav chrome. Callers that represent real user/browser
  // navigation (goTo, popstate) open the debounce lock themselves BEFORE
  // calling this, so the very first input right after page load is never
  // swallowed by a lock the bootstrap call never needed.
  activate: function (index, historyMode) {
    var leavingId = Hotsite.deck.slides[Hotsite.deck.currentIndex];
    var leavingIndex = Hotsite.deck.currentIndex;

    Hotsite.deck.elements.forEach(function (el, i) {
      el.classList.toggle('is-active', i === index);
    });
    Hotsite.deck.currentIndex = index;

    if (leavingId === 'video' && leavingIndex !== index) {
      Hotsite.deck.pauseVideo();
    }

    if (historyMode !== 'none') {
      Hotsite.deck.syncUrl(index, historyMode === 'replace');
    }

    if (Hotsite.deckNav && typeof Hotsite.deckNav.update === 'function') {
      Hotsite.deckNav.update(index, Hotsite.deck.slides.length);
    }
  },

  // Debounces rapid repeated input (held arrow key, fast clicks) during an
  // in-flight transition so it never skips more than one slide per input or
  // desyncs the counter. Shorter window under reduced motion since there is
  // no visual transition to wait out.
  lock: function () {
    Hotsite.deck.locked = true;
    var reduced = !!(Hotsite.utils && Hotsite.utils.prefersReducedMotion());
    var duration = reduced ? 60 : 300;
    window.setTimeout(function () {
      Hotsite.deck.locked = false;
    }, duration);
  },

  syncUrl: function (index, replace) {
    try {
      var url = window.location.pathname + '?slide=' + (index + 1) + (window.location.hash || '');
      var state = { slide: index };
      if (replace) {
        window.history.replaceState(state, '', url);
      } else {
        window.history.pushState(state, '', url);
      }
    } catch {
      // Restrictive/sandboxed context (e.g. some file:// setups): in-memory
      // navigation must keep working even if the URL never syncs.
    }
  },

  pauseVideo: function () {
    try {
      if (Hotsite.videoPlayer && typeof Hotsite.videoPlayer.pause === 'function') {
        Hotsite.videoPlayer.pause();
      }
    } catch {
      // no-op — a pause failure must never block slide navigation.
    }
  },

  bindKeyboard: function () {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        Hotsite.deck.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        Hotsite.deck.prev();
      }
    });
  },

  bindPopstate: function () {
    window.addEventListener('popstate', function (e) {
      var total = Hotsite.deck.slides.length;
      var hasState = e.state && typeof e.state.slide === 'number';
      var index = hasState ? e.state.slide : Hotsite.deck.parseSlideParam().index;
      index = Math.min(Math.max(index, 0), total - 1);
      Hotsite.deck.lock();
      Hotsite.deck.activate(index, 'none');
    });
  },

  // Progressive nicety: in continuous-scroll mode "Explorar" scrolls to
  // #cards via its href; in deck mode that anchor jump would target a
  // display:none section, so repurpose the same affordance to advance.
  bindHeroCue: function () {
    var cue = document.querySelector('.hero__scroll-cue');
    if (!cue) return;
    cue.addEventListener('click', function (e) {
      e.preventDefault();
      Hotsite.deck.next();
    });
  }
};
