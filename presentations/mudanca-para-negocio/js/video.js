window.Hotsite = window.Hotsite || {};

Hotsite.videoPlayer = {
  init: function () {
    var wrap = document.querySelector('[data-video-player]');
    if (!wrap) return;

    var videoEl = /** @type {HTMLVideoElement} */ (wrap.querySelector('[data-video-el]'));
    var playBtn = wrap.querySelector('[data-video-play]');

    playBtn.addEventListener('click', function () {
      videoEl.setAttribute('controls', '');
      videoEl.play();
      wrap.classList.add('is-playing');
    });

    videoEl.addEventListener('ended', function () {
      wrap.classList.remove('is-playing');
      videoEl.removeAttribute('controls');
      videoEl.currentTime = 0;
    });
  },

  // Called by js/deck.js when the visitor navigates away from the 'video'
  // slide. Deliberately minimal (no wrap/controls reset) — the acceptance
  // criterion only asks for the video to stop playing, nothing more.
  pause: function () {
    var wrap = document.querySelector('[data-video-player]');
    if (!wrap) return;

    var videoEl = /** @type {HTMLVideoElement} */ (wrap.querySelector('[data-video-el]'));
    if (videoEl && typeof videoEl.pause === 'function') {
      videoEl.pause();
    }
  }
};
