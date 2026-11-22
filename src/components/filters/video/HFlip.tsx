import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import React from 'react';

import Checkbox from '../../Checkbox';

// HFlip Filter
// http://ffmpeg.org/ffmpeg-all.html#hflip

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
    mapping.push('hflip');
  }

  return mapping.join(',');
}

function Filter({
  settings = {},
  onChange = function (settings: any, mapping: any) {},
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
    <Grid>
      <Checkbox
        label={<Trans>Horizontal Flip</Trans>}
        checked={settings.enabled}
        onChange={update('enabled')}
      />
    </Grid>
  );
}

const filter = 'hflip';
const name = 'Horizonal Flip';
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
