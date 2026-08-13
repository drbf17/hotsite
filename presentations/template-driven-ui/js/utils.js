window.Hotsite = window.Hotsite || {};

Hotsite.utils = {
  prefersReducedMotion: function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  random: function (min, max) {
    return Math.random() * (max - min) + min;
  }
};
