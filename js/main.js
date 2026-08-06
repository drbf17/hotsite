window.Hotsite = window.Hotsite || {};

Hotsite.setupInView = function (selector) {
  var el = document.querySelector(selector);
  if (!el) return;

  if (!('IntersectionObserver' in window)) {
    el.classList.add('in-view');
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(el);
};

document.addEventListener('DOMContentLoaded', function () {
  if (Hotsite.heroScene) Hotsite.heroScene.init();
  if (Hotsite.cards) Hotsite.cards.init();
  Hotsite.setupInView('#cards');
});
