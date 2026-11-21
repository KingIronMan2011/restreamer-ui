import { CompatVideoSkin, VideoPlayer } from '@videojs/react/video';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import Grid from '@mui/material/Grid';
import { useState, type CSSProperties, type SyntheticEvent } from 'react';

import '@videojs/react/video/compat-skin.css';
import './videojs-v10.css';

type PlayerLogo = {
  image?: string;
  position?: string;
  link?: string;
};

type VideoJSOptions = {
  sources?: Array<{ src: string; type?: string }>;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean | 'muted';
  controls?: boolean;
};

type VideoJSProps = {
  type?: 'videojs-internal' | 'videojs-public';
  options?: VideoJSOptions;
  logo?: PlayerLogo;
};

const logoPosition: Record<string, CSSProperties> = {
  'top-left': { top: 16, left: 20 },
  top: { top: 16, left: '50%', transform: 'translateX(-50%)' },
  'top-right': { top: 16, right: 20 },
  left: { top: '50%', left: 20, transform: 'translateY(-50%)' },
  center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  right: { top: '50%', right: 20, transform: 'translateY(-50%)' },
  'bottom-left': { bottom: 56, left: 20 },
  bottom: { bottom: 56, left: '50%', transform: 'translateX(-50%)' },
  'bottom-right': { bottom: 56, right: 20 },
};

export default function VideoJS({
  type = 'videojs-internal',
  options = {},
  logo,
}: VideoJSProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const source = options.sources?.[0];

  const retryVideo = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    if (video.error?.code === MediaError.MEDIA_ERR_NETWORK || video.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      window.setTimeout(() => {
        video.load();
        void video.play().catch(() => undefined);
      }, 2000);
    }
  };

  return (
    <Grid
      container
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={2}
      style={{ position: 'absolute', inset: 0 }}
    >
      <VideoPlayer poster={options.poster}>
        <CompatVideoSkin
          className={`videojs-player ${type}`}
          style={{ '--media-accent-color': '#eaea05' } as CSSProperties}
        >
          <HlsJsVideo
            source={{
              src: source?.src ?? '',
              type: source?.type,
            }}
            autoPlay={options.autoplay}
            muted={options.muted === true || options.muted === 'muted'}
            playsInline
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={retryVideo}
          />
          {logo?.image && isPlaying && (
            <a
              className="videojs-player__logo"
              href={logo.link || undefined}
              target={logo.link ? '_blank' : undefined}
              rel={logo.link ? 'noreferrer' : undefined}
              style={logoPosition[logo.position ?? 'top-right'] ?? logoPosition['top-right']}
            >
              <img src={logo.image} alt="" />
            </a>
          )}
        </CompatVideoSkin>
      </VideoPlayer>
    </Grid>
  );
}
