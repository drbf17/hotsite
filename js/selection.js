window.Hotsite = window.Hotsite || {};

Hotsite.selectionScreen = {
  init: function () {
    var grid = document.querySelector('[data-presentations-grid]');
    var emptyState = document.querySelector('[data-presentations-empty]');
    if (!grid) return;

    var presentations = window.PRESENTATIONS || [];

    if (!presentations.length) {
      grid.hidden = true;
      if (emptyState) emptyState.hidden = false;
      return;
    }

    presentations.forEach(function (presentation) {
      grid.appendChild(Hotsite.selectionScreen.buildCard(presentation));
    });
  },

  buildCard: function (presentation) {
    var card = document.createElement('a');
    card.className = 'presentation-card';
    card.href = presentation.href;

    var title = document.createElement('h2');
    title.className = 'presentation-card__title';
    title.textContent = presentation.title;

    var desc = document.createElement('p');
    desc.className = 'presentation-card__desc';
    desc.textContent = presentation.description;

    var cue = document.createElement('span');
    cue.className = 'presentation-card__cue';
    cue.textContent = 'Abrir apresentação';

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(cue);

    return card;
  }
};

document.addEventListener('DOMContentLoaded', function () {
  Hotsite.selectionScreen.init();
});
