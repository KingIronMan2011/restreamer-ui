var media = document.getElementById('player-media');
var player = document.getElementById('player');
var skin = player.querySelector('live-video-skin');

var source = playerConfig.source.replace(/^\/+/, '');
media.setAttribute('src', new URL(source, window.location.origin + '/').href);
media.setAttribute('playsinline', '');

if (playerConfig.poster) {
  var poster = playerConfig.poster.replace(/^\/+/, '');
  player.setAttribute(
    'poster',
    new URL(poster, window.location.origin + '/').href + '?t=' + Date.now(),
  );
}

if (autoplay) {
  media.setAttribute('autoplay', '');
  media.setAttribute('muted', '');
} else if (mute) {
  media.setAttribute('muted', '');
}

var logo = playerConfig.logo;
if (logo && logo.image) {
  var logoLink = document.createElement('a');
  logoLink.className =
    'playersite-videojs-logo ' + (logo.position || 'top-left');
  logoLink.href = logo.link || '#';
  logoLink.target = logo.link ? '_blank' : '';
  logoLink.rel = 'noopener noreferrer';

  var logoImage = document.createElement('img');
  logoImage.src =
    logo.image + (logo.image.includes('?') ? '&' : '?') + Date.now();
  logoImage.alt = 'Stream logo';
  logoLink.appendChild(logoImage);
  skin.appendChild(logoLink);

  media.addEventListener('playing', function () {
    logoLink.hidden = false;
  });
  media.addEventListener('pause', function () {
    logoLink.hidden = true;
  });
  logoLink.hidden = true;
}

var license = playerConfig.license;
if (license && (license.license || license.title || license.author)) {
  var licenseBadge = document.createElement('small');
  licenseBadge.className = 'playersite-videojs-license';
  licenseBadge.textContent = [license.title, license.author, license.license]
    .filter(Boolean)
    .join(' · ');
  skin.appendChild(licenseBadge);
}
