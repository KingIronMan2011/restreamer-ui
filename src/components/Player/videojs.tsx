import '@videojs/react/live-video/skin.css';
import Grid from '@mui/material/GridLegacy';
import { LiveVideoPlayer, LiveVideoSkin } from '@videojs/react/live-video';
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
import { useState, type CSSProperties, type SyntheticEvent } from 'react';

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
    if (
      video.error?.code === MediaError.MEDIA_ERR_NETWORK ||
      video.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
    ) {
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
      spacing={2}
      style={{ position: 'absolute', inset: 0 }}
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <LiveVideoPlayer poster={options.poster}>
        <LiveVideoSkin
          className={`videojs-player ${type}`}
          style={
            {
              width: '100%',
              aspectRatio: '16 / 9',
              '--media-controls-before-start': 'visible',
            } as CSSProperties
          }
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
              style={
                logoPosition[logo.position ?? 'top-right'] ??
                logoPosition['top-right']
              }
            >
              <img src={logo.image} alt="Stream logo" />
            </a>
          )}
        </LiveVideoSkin>
      </LiveVideoPlayer>
    </Grid>
  );
}
