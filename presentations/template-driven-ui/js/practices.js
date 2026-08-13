window.Hotsite = window.Hotsite || {};

Hotsite.practices = {
  init: function () {
    var switchEl = document.querySelector('[data-practice-switch]');
    var list = document.querySelector('[data-practice-list]');
    if (!switchEl || !list) return;

    var buttons = Array.prototype.slice.call(switchEl.querySelectorAll('[data-practice-mode]'));

    switchEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-practice-mode]');
      if (!btn) return;

      var mode = btn.dataset.practiceMode;
      if (mode === list.dataset.mode) return;

      buttons.forEach(function (b) {
        var isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      });

      list.classList.add('is-switching');
      window.setTimeout(function () {
        list.dataset.mode = mode;
        list.classList.remove('is-switching');
      }, 200);
    });
  }
};
