import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import React from 'react';

import Select from '../../../Select';
import Helper from '../../helper';
import Video from '../../settings/Video';

function init(initialState: any) {
  const state = {
    bitrate: '4096',
    fps: '25',
    gop: '2',
    profile: '77',
    rc_mode: '1',
    quality: '-1',
    ...initialState,
  };

  return state;
}

function createMapping(settings: any, stream: any, skills: any) {
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  const global: any[] = [];
  const local: any[] = [];
  const filter: any[] = [];

  // https://trac.ffmpeg.org/wiki/Hardware/VAAPI
  global.push(['-vaapi_device', '/dev/dri/renderD128']);

  local.push(
    '-codec:v',
    'h264_vaapi',
    '-profile:v',
    `${settings.profile}`,
    '-quality',
    `${settings.quality}`,
    '-b:v',
    `${settings.bitrate}k`,
    '-maxrate',
    `${settings.bitrate}k`,
    '-bufsize',
    `${settings.bitrate}k`,
    '-r',
    `${settings.fps}`,
  );

  if (settings.gop !== 'auto') {
    local.push(
      '-g',
      `${Math.round(parseInt(settings.fps) * parseInt(settings.gop)).toFixed(0)}`,
    );
  }

  filter.push('format=nv12', 'hwupload');

  return {
    global: global,
    local: local,
    filter: filter,
  };
}

function RateControl({ value = '', onChange }: any) {
  return (
    <Select
      label={<Trans>Rate control</Trans>}
      value={value}
      onChange={onChange}
    >
      <MenuItem value="0">auto</MenuItem>
      <MenuItem value="1">Constant-quality</MenuItem>
      <MenuItem value="2">Constant-bitrate</MenuItem>
      <MenuItem value="3">Variable-bitrate</MenuItem>
      <MenuItem value="4">Intelligent constant-quality</MenuItem>
      <MenuItem value="5">Quality-defined variable-bitrate</MenuItem>
      <MenuItem value="6">Average variable-bitrate</MenuItem>
    </Select>
  );
}

function Profile({ value = '', onChange }: any) {
  return (
    <Select label={<Trans>Profile</Trans>} value={value} onChange={onChange}>
      <MenuItem value="578">baseline (constrained)</MenuItem>
      <MenuItem value="77">main</MenuItem>
      <MenuItem value="100">high</MenuItem>
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
        <RateControl value={settings.rc_mode} onChange={update('rc_mode')} />
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Video.Bitrate
          value={settings.bitrate}
          onChange={update('bitrate')}
          allowCustom
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Video.Framerate
          value={settings.fps}
          onChange={update('fps')}
          allowCustom
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Video.GOP
          value={settings.gop}
          onChange={update('gop')}
          allowAuto
          allowCustom
        />
      </Grid>
      <Grid size={6}>
        <TextField
          variant="outlined"
          fullWidth
          label={<Trans>Quality</Trans>}
          type="number"
          value={settings.quality}
          onChange={update('quality')}
        />
      </Grid>
      <Grid size={6}>
        <Profile value={settings.profile} onChange={update('profile')} />
      </Grid>
    </Grid>
  );
}

const coder = 'h264_vaapi';
const name = 'H.264 (Intel VAAPI)';
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
