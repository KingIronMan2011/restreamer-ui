import { Trans } from '@lingui/macro';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import SemverSatisfies from 'semver/functions/satisfies';

import Sources from './Sources';

function initConfig(initialConfig: any) {
  let config: Record<string, any> = {};

  for (let s of Sources.List()) {
    config[s.id] = {};
  }

  config = {
    ...config,
    ...initialConfig,
  };

  return config;
}

function init(source: any) {
  const settings: Record<string, any> = {};

  for (let id of Sources.IDs()) {
    settings[id] = {};
  }

  settings[source.type] = source.settings;

  return settings;
}

function reducer(settings: any, data: any) {
  const newSettings = {
    ...settings,
    ...data,
  };

  return newSettings;
}

export default function SourceSelect({
  type = '',
  skills = {},
  source = {},
  config = {},
  onProbe = function (type: any, device: any, settings: any, inputs: any) {},
  onSelect = function (type: any, device: any) {},
  onChange = function (type: any, device: any, settings: any) {},
  onRefresh = function () {},
  onStore = function (name: any, data: any) {},
}: any) {
  // $source holds the currently selected device. It is initialized with the
  // last stored source.
  const [$source, setSource] = React.useState(source.type);

  // $settings is for storing the settings of the different devices, such that if
  // the user switches between them, they can be restored. It takes the last
  // stored source settings as initial value.
  const [$settings, setSettings] = React.useReducer(reducer, source, init);

  config = initConfig(config);

  const handleSource = (source: any) => {
    onChange(type);
    setSource(source);

    onSelect(type, source);
  };

  const handleRefresh = async () => {
    await onRefresh();
  };

  const handleStore = async (name: any, data: any, onprogress: any) => {
    return await onStore(name, data, onprogress);
  };

  const handleProbe = async (settings: any, inputs: any) => {
    await onProbe(type, $source, settings, inputs);
  };

  const handleChange = (source: any) => (settings: any) => {
    setSettings({
      ...$settings,
      [source]: settings,
    });

    onChange(type, source, settings);
  };

  let sourceControl = null;

  const s = Sources.Get($source);
  if (s !== null) {
    const Component = s.component;

    if (SemverSatisfies(skills.ffmpeg.version, s.ffversion)) {
      sourceControl = (
        <Component
          knownDevices={skills.sources[$source]}
          skills={skills}
          config={config[$source]}
          settings={$settings[$source]}
          onChange={handleChange($source)}
          onProbe={handleProbe}
          onRefresh={handleRefresh}
          onStore={handleStore}
        />
      );
    }
  }

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Select
          type={type}
          selected={$source}
          ffversion={skills.ffmpeg.version}
          availableSources={skills.sources}
          onSelect={handleSource}
        />
      </Grid>
      <Grid item xs={12}>
        {sourceControl}
      </Grid>
    </Grid>
  );
}

function Select({
  type = '',
  selected = '',
  ffversion = '0.0.0',
  availableSources = {},
  onSelect = function (source: any) {},
}: any) {
  const handleSource = (source: any) => () => {
    onSelect(source);
  };

  let selectAvailableSources: any[] = [];

  for (let s of Sources.List()) {
    if (!(s.id in availableSources)) {
      continue;
    }

    if (!s.capabilities.includes(type)) {
      continue;
    }

    if (!SemverSatisfies(ffversion, s.ffversion)) {
      continue;
    }

    const variant = s.id === selected ? 'bigSelected' : 'big';
    const Icon = s.icon;

    selectAvailableSources.push(
      <Grid item xs={6} md={4} align="center" key={s.id}>
        <Button variant={variant} onClick={handleSource(s.id)}>
          <div>
            <Icon />
            <Typography>{s.name}</Typography>
          </div>
        </Button>
      </Grid>,
    );
  }

  if (selectAvailableSources.length === 0) {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography variant="body1">
            <Trans>No sources available</Trans>
          </Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={1}>
      {selectAvailableSources}
    </Grid>
  );
}
