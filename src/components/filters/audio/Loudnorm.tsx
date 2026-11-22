import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import React from 'react';

import Checkbox from '../../Checkbox';

// Loudnorm Filter
// http://ffmpeg.org/ffmpeg-all.html#loudnorm

function init(initialState: any) {
  const state = {
    enabled: false,
    ...initialState,
  };

  return state;
}

function createGraph(settings: any) {
  settings = init(settings);

  const mapping: any[] = [];

  if (settings.enabled) {
    mapping.push('loudnorm');
  }

  return mapping.join(',');
}

function Filter({
  settings = {},
  onChange = function (settings: any, graph: any, automatic: any) {},
}: any) {
  settings = init(settings);

  const handleChange = (newSettings: any, automatic = false) => {
    onChange(newSettings, createGraph(newSettings), automatic);
  };

  const update = (what: any) => () => {
    const newSettings = {
      ...settings,
    };
    newSettings[what] = !settings.enabled;

    handleChange(newSettings);
  };

  React.useEffect(() => {
    handleChange(settings, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <React.Fragment>
      <Grid>
        <Checkbox
          label={<Trans>Loudness Normalization</Trans>}
          checked={settings.enabled}
          onChange={update('enabled')}
        />
      </Grid>
    </React.Fragment>
  );
}

const filter = 'loudnorm';
const name = 'Loudness Normalization';
const type = 'audio';
const hwaccel = false;

function summarize(settings: any) {
  return `${name}`;
}

function defaults() {
  const settings = init({});

  return {
    settings: settings,
    graph: createGraph(settings),
  };
}

export {
  name,
  filter,
  type,
  hwaccel,
  summarize,
  defaults,
  createGraph,
  Filter as component,
};
