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
  [
    '#fio-condutor',
    '#tema-1',
    '#tema-2',
    '#tema-3',
    '#tema-4',
    '#tema-5',
    '#tema-6',
    '#tema-7',
    '#tensoes',
    '#fechamento'
  ].forEach(function (selector) {
    Hotsite.setupInView(selector);
  });
});
