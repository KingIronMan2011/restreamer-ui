import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import React from 'react';

import Checkbox from '../../Checkbox';

// VFlip Filter
// http://ffmpeg.org/ffmpeg-all.html#vflip

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
    mapping.push('vflip');
  }

  return mapping.join(',');
}

function Filter({
  settings = {},
  onChange = function (settings: any, graph: any, automatic: any) {},
}: any) {
  settings = init(settings);

  const handleChange = (newSettings: any) => {
    let automatic = false;
    if (!newSettings) {
      newSettings = settings;
      automatic = true;
    }

    onChange(newSettings, createGraph(newSettings), automatic);
  };

  const update = (what: any) => (event: any) => {
    const newSettings = {
      ...settings,
    };
    if (['enabled'].includes(what)) {
      newSettings[what] = !settings.enabled;
    } else {
      newSettings[what] = event.target.value;
    }

    handleChange(newSettings);
  };

  React.useEffect(() => {
    handleChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid item>
      <Checkbox
        label={<Trans>Vertical Flip</Trans>}
        checked={settings.enabled}
        onChange={update('enabled')}
      />
    </Grid>
  );
}

const filter = 'vflip';
const name = 'Vertical Flip';
const type = 'video';
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
