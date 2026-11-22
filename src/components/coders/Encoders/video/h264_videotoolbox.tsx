import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import React from 'react';

import Select from '../../../Select';
import Helper from '../../helper';
import Video from '../../settings/Video';

function init(initialState: any) {
  const state = {
    bitrate: '4096',
    fps: '25',
    gop: '2',
    profile: 'auto',
    entropy: 'default',
    ...initialState,
  };

  return state;
}

function createMapping(settings: any, stream: any, skills: any) {
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const local = [
    '-codec:v',
    'h264_videotoolbox',
    '-b:v',
    `${settings.bitrate}k`,
    '-maxrate:v',
    `${settings.bitrate}k`,
    '-bufsize:v',
    `${settings.bitrate}k`,
    '-r',
    `${settings.fps}`,
    '-pix_fmt',
    'yuv420p',
    '-realtime',
    'true',
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

  if (settings.entropy !== 'default') {
    local.push('-coder:v', `${settings.entropy}`);
  }

  const mapping = {
    global: [],
    local: local,
    filter: [],
  };

  return mapping;
}

function Entropy({ value = '', onChange }: any) {
  return (
    <Select
      label={<Trans>Entropy coder</Trans>}
      value={value}
      onChange={onChange}
    >
      <MenuItem value="default">default</MenuItem>
      <MenuItem value="cavlc">CAVLC</MenuItem>
      <MenuItem value="cabac">CABAC</MenuItem>
    </Select>
  );
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

  const handleChange = (newSettings: any) => {
    let automatic = false;
    if (!newSettings) {
      newSettings = settings;
      automatic = true;
    }

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
    handleChange(null);
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
      <Grid size={12}>
        <Entropy value={settings.entropy} onChange={update('entropy')} />
      </Grid>
    </Grid>
  );
}

const coder = 'h264_videotoolbox';
const name = 'H.264 (VideoToolbox)';
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
