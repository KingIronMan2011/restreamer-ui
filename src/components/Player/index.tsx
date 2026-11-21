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
      sources: [{ src: source, type: 'application/x-mpegURL' }],
    };

    return (
      <VideoJS
        type={type}
        options={config}
        logo={logo}
      />
    );
  }
}
