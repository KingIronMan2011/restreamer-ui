import Grid from '@mui/material/GridLegacy';
import React from 'react';

import Helper from '../../helper';
import Audio from '../../settings/Audio';

function init(initialState: any) {
  const state = {
    bitrate: '64',
    ...initialState,
  };

  return state;
}

function createMapping(settings: any, stream: any, skills: any) {
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  // '-qscale:a', '6'
  const local = [
    '-codec:a',
    'libmp3lame',
    '-b:a',
    `${settings.bitrate}k`,
    '-shortest',
  ];

  const mapping = {
    global: [['-vsync', 'drop']],
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
    const value = event.target.value;

    const newSettings = {
      ...settings,
      [what]: value,
    };

    handleChange(newSettings);
  };

  React.useEffect(() => {
    handleChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Audio.Bitrate
          value={settings.bitrate}
          onChange={update('bitrate')}
          allowCustom
        />
      </Grid>
    </Grid>
  );
}

const coder = 'libmp3lame';
const name = 'MP3 (libmp3lame)';
const codec = 'mp3';
const type = 'audio';
const hwaccel = false;

function summarize(settings: any) {
  return `${name}, ${settings.bitrate} kbit/s`;
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
