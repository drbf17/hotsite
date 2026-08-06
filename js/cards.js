window.Hotsite = window.Hotsite || {};

Hotsite.cards = {
  init: function () {
    var isTouch = window.matchMedia('(hover: none)').matches;
    if (!isTouch) return;

    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var wasFlipped = card.classList.contains('is-flipped');

        cards.forEach(function (c) {
          if (c !== card) c.classList.remove('is-flipped');
        });

        card.classList.toggle('is-flipped', !wasFlipped);
      });
    });
  }
};
