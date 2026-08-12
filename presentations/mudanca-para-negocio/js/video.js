window.Hotsite = window.Hotsite || {};

Hotsite.videoPlayer = {
  init: function () {
    var wrap = document.querySelector('[data-video-player]');
    if (!wrap) return;

    var videoEl = wrap.querySelector('[data-video-el]');
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
  }
};
