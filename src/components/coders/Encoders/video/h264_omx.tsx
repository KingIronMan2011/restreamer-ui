import Grid from '@mui/material/Grid';
import React from 'react';

import Helper from '../../helper';
import Video from '../../settings/Video';

function init(initialState: any) {
  const state = {
    bitrate: '4096',
    fps: '25',
    gop: '2',
    profile: 'auto',
    ...initialState,
  };

  return state;
}

function createMapping(settings: any, stream: any, skills: any) {
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const local = [
    '-codec:v',
    'h264_omx',
    '-b:v',
    `${settings.bitrate}k`,
    '-maxrate',
    `${settings.bitrate}k`,
    '-bufsize',
    `${settings.bitrate}k`,
    '-r',
    `${settings.fps}`,
    '-pix_fmt',
    'yuv420p',
  ];

  if (settings.gop !== 'auto') {
    local.push(
      '-g',
      `${Math.round(parseInt(settings.fps) * parseInt(settings.gop)).toFixed(0)}`,
    );
  }

  if (settings.profile !== 'auto') {
    local.push('-profile:v', `${settings.profile}`);
  }

  const mapping = {
    global: [],
    local: local,
    filter: [],
  };

  return mapping;
}

function Coder({
  stream = {},
  settings = {},
  skills = {},
  onChange = function (settings: any, mapping: any) {},
}: any) {
  settings = init(settings);
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const handleChange = (newSettings: any, automatic = false) => {
    onChange(
      newSettings,
      createMapping(newSettings, stream, skills),
      automatic,
    );
  };

  const update = (what: any) => (event: any) => {
    const newSettings = {
      ...settings,
      [what]: event.target.value,
    };

    handleChange(newSettings);
  };

  React.useEffect(() => {
    handleChange(settings, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Video.Bitrate
          value={settings.bitrate}
          onChange={update('bitrate')}
          allowCustom
        />
      </Grid>
      <Grid size={12}>
        <Video.Framerate
          value={settings.fps}
          onChange={update('fps')}
          allowCustom
        />
      </Grid>
      <Grid size={12}>
        <Video.GOP
          value={settings.gop}
          onChange={update('gop')}
          allowAuto
          allowCustom
        />
      </Grid>
      <Grid size={12}>
        <Video.Profile value={settings.profile} onChange={update('profile')} />
      </Grid>
    </Grid>
  );
}

const coder = 'h264_omx';
const name = 'H.264 (OpenMAX IL)';
const codec = 'h264';
const type = 'video';
const hwaccel = true;

function summarize(settings: any) {
  return `${name}, ${settings.bitrate} kbit/s, ${settings.fps} FPS, Profile: ${settings.profile}`;
}

function defaults(stream: any, skills: any) {
  const settings = init({});

  return {
    settings: settings,
    mapping: createMapping(settings, stream, skills),
  };
}

export {
  coder,
  name,
  codec,
  type,
  hwaccel,
  summarize,
  defaults,
  Coder as component,
};
