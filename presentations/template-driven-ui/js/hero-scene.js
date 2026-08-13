window.Hotsite = window.Hotsite || {};

Hotsite.heroScene = {
  layers: null,

  init: function () {
    this.container = document.querySelector('.hero__starfield');
    if (!this.container) return;

    var reduced = Hotsite.utils.prefersReducedMotion();
    this.createStars(reduced);

    if (!reduced) {
      this.bindParallax();
    }
  },

  createStars: function (staticMode) {
    var layerDefs = [
      { count: 60, sizeMin: 1, sizeMax: 2, className: 'star--far' },
      { count: 40, sizeMin: 1.5, sizeMax: 2.5, className: 'star--mid' },
      { count: 22, sizeMin: 2, sizeMax: 3.2, className: 'star--near' }
    ];

    var frag = document.createDocumentFragment();

    layerDefs.forEach(function (layer, layerIndex) {
      var layerEl = document.createElement('div');
      layerEl.className = 'hero__star-layer';
      layerEl.dataset.depth = String(layerIndex + 1);

      for (var i = 0; i < layer.count; i++) {
        var star = document.createElement('span');
        star.className = 'star ' + layer.className;
        var size = Hotsite.utils.random(layer.sizeMin, layer.sizeMax);
        star.style.left = Hotsite.utils.random(0, 100) + '%';
        star.style.top = Hotsite.utils.random(0, 100) + '%';
        star.style.width = size + 'px';
        star.style.height = size + 'px';

        if (staticMode) {
          star.style.animation = 'none';
          star.style.opacity = Hotsite.utils.random(0.35, 0.8).toFixed(2);
        } else {
          star.style.animationDelay = Hotsite.utils.random(0, 4).toFixed(2) + 's';
          star.style.setProperty('--base-opacity', Hotsite.utils.random(0.35, 0.9).toFixed(2));
        }

        layerEl.appendChild(star);
      }

      frag.appendChild(layerEl);
    });

    this.container.appendChild(frag);
    this.layers = Array.prototype.slice.call(this.container.querySelectorAll('.hero__star-layer'));
  },

  bindParallax: function () {
    var heroEl = document.getElementById('hero');
    var layers = this.layers;
    if (!heroEl || !layers || !layers.length) return;

    var ticking = false;

    heroEl.addEventListener('mousemove', function (e) {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(function () {
        var rect = heroEl.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;

        layers.forEach(function (layer) {
          var depth = Number(layer.dataset.depth);
          var strength = depth * 6;
          layer.style.transform = 'translate3d(' + (x * strength).toFixed(2) + 'px,' + (y * strength).toFixed(2) + 'px,0)';
        });

        ticking = false;
      });
    });

    heroEl.addEventListener('mouseleave', function () {
      layers.forEach(function (layer) {
        layer.style.transform = 'translate3d(0,0,0)';
      });
    });
  }
};
