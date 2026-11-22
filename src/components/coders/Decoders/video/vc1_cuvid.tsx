import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import React from 'react';

import Helper from '../../helper';
import Video from '../../settings/Video';

function init(initialState: any) {
  const state = {
    gpu: '0',
    resize: 'auto',
    ...initialState,
  };

  return state;
}

function createMapping(settings: any, stream: any, skills: any) {
  stream = Helper.InitStream(stream);
  skills = Helper.InitSkills(skills);

  let local = ['-c:v', 'vc1_cuvid', '-gpu', `${settings.gpu}`];

  if (settings.resize !== 'auto') {
    local.push('-resize', `${settings.resize}`);
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
      <Grid size={6}>
        <Video.Size
          value={settings.resize}
          label={<Trans>Resize</Trans>}
          customLabel={<Trans>Custom size</Trans>}
          onChange={update('resize')}
          allowCustom={true}
          allowAuto={true}
        />
      </Grid>
      <Grid size={6}>
        <Video.GPU value={settings.gpu} onChange={update('gpu')} />
      </Grid>
      <Grid size={12}></Grid>
    </Grid>
  );
}

const coder = 'vc1_cuvid';
const name = 'VC1 (CUVID)';
const codecs = ['vc1'];
const type = 'video';
const hwaccel = true;

function defaults(stream: any, skills: any) {
  const settings = init({});

  return {
    settings: settings,
    mapping: createMapping(settings, stream, skills),
  };
}

export { coder, name, codecs, type, hwaccel, defaults, Coder as component };
