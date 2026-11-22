import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import React from 'react';

import Checkbox from '../../Checkbox';
import Select from '../../Select';

// Deinterlace the input video ("bwdif" stands for "Bob Weaver Deinterlacing Filter").
// http://ffmpeg.org/ffmpeg-all.html#bwdif

function init(initialState: any) {
  const state = {
    enabled: false,
    mode: '1',
    parity: '-1',
    deint: '0',
    ...initialState,
  };

  return state;
}

function createGraph(settings: any) {
  settings = init(settings);

  const mapping: any[] = [];

  if (settings.enabled) {
    mapping.push(
      `bwdif=mode=${settings.mode}:parity=${settings.parity}:deint=${settings.deint}`,
    );
  }

  return mapping.join(',');
}

function Mode({ value = '', onChange = function (event: any) {} }: any) {
  return (
    <Select
      label={<Trans>Deinterlace mode</Trans>}
      value={value}
      onChange={onChange}
    >
      <MenuItem value="0">
        <Trans>Each frames</Trans>
      </MenuItem>
      <MenuItem value="1">
        <Trans>Each field</Trans>
      </MenuItem>
    </Select>
  );
}

function Parity({ value = '', onChange = function (event: any) {} }: any) {
  return (
    <Select
      label={<Trans>Deinterlace parity</Trans>}
      value={value}
      onChange={onChange}
    >
      <MenuItem value="0">
        <Trans>Top field</Trans>
      </MenuItem>
      <MenuItem value="1">
        <Trans>Bottom field</Trans>
      </MenuItem>
      <MenuItem value="-1">
        <Trans>Auto</Trans>
      </MenuItem>
    </Select>
  );
}

function Deint({ value = '', onChange = function (event: any) {} }: any) {
  return (
    <Select
      label={<Trans>Deinterlace deint</Trans>}
      value={value}
      onChange={onChange}
    >
      <MenuItem value="0">
        <Trans>All frames</Trans>
      </MenuItem>
      <MenuItem value="1">
        <Trans>Marked frames</Trans>
      </MenuItem>
    </Select>
  );
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
    <React.Fragment>
      <Grid>
        <Checkbox
          label={<Trans>Deinterlace (bwdif)</Trans>}
          checked={settings.enabled}
          onChange={update('enabled')}
        />
      </Grid>
      {settings.enabled && (
        <React.Fragment>
          <Grid size={12}>
            <Mode value={settings.mode} onChange={update('mode')}></Mode>
          </Grid>
          <Grid size={6}>
            <Parity
              value={settings.parity}
              onChange={update('parity')}
            ></Parity>
          </Grid>
          <Grid size={6}>
            <Deint value={settings.deint} onChange={update('deint')}></Deint>
          </Grid>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

const filter = 'bwdif';
const name = 'Deinterlacing Filter';
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
