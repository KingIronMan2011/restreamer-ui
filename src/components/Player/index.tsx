import React from 'react';

import VideoJS from './videojs';

export default function Player({
  type = 'videojs-internal',
  source = '',
  poster = '',
  controls = false,
  autoplay = false,
  mute = false,
  logo = {
    image: '',
    position: 'top-right',
    link: '',
  },
  ga = {
    account: '',
    name: '',
  },
  colors = {
    seekbar: '#fff',
    buttons: '#fff',
  },
  statistics = false,
}: any) {
  type = type ? type : 'videojs-internal';

  if (type === 'videojs-internal' || type === 'videojs-public') {
    const config = {
      controls: controls,
      poster: poster,
      autoplay:
        type === 'videojs-internal'
          ? true
          : autoplay
            ? mute === 'muted'
              ? true
              : false
            : false,
      muted: type === 'videojs-internal' ? 'muted' : mute,
      liveui: true,
      responsive: true,
      fluid: true,
      plugins: {
        reloadSourceOnError: {},
      },
      sources: [{ src: source, type: 'application/x-mpegURL' }],
    };

    return (
      <VideoJS
        type={type}
        options={config}
        onReady={(player: any) => {
          if (logo.image.length !== 0) {
            var overlay = null;

            var imgTag = new Image();
            imgTag.onload = function () {
              imgTag.setAttribute('width', String(imgTag.width));
              imgTag.setAttribute('height', String(imgTag.height));
            };
            imgTag.src = logo.image + '?' + Math.random();

            if (logo.link.length !== 0) {
              var aTag = document.createElement('a');
              aTag.setAttribute('href', logo.link);
              aTag.setAttribute('target', '_blank');
              aTag.appendChild(imgTag);
              overlay = aTag.outerHTML;
            } else {
              overlay = imgTag.outerHTML;
            }

            if (player.overlay) {
              player.overlay({
                align: logo.position,
                overlays: [
                  {
                    showBackground: false,
                    content: overlay,
                    start: 'play',
                    end: 'pause',
                  },
                ],
              });
            }
          }

          if (autoplay === true) {
            // https://videojs.com/blog/autoplay-best-practices-with-video-js/
            const p = player.play();

            if (!p) {
              // no autoplay;
            } else {
              p.then(
                () => {
                  // autoplay worked;
                },
                () => {
                  // autoplay did not work
                },
              );
            }
          }
        }}
      />
    );
  }
}
