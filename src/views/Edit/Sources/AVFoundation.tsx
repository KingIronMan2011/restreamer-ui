import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import Icon from '@mui/icons-material/Apple';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';

import Checkbox from '../../../components/Checkbox';
import Video from '../../../components/coders/settings/Video';
import FormInlineButton from '../../../components/FormInlineButton';
import SelectCustom from '../../../components/SelectCustom';

const useStyles = makeStyles((theme) => ({
  gridContainer: {
    marginTop: '0.5em',
  },
}));

const initSettings = (initialSettings: any) => {
  if (!initialSettings) {
    initialSettings = {};
  }

  const settings = {
    aindex: 'default',
    vindex: 'default',
    format: 'nv12',
    framerate: '25',
    size: 'auto',
    cursor: false,
    clicks: false,
    ...initialSettings,
  };

  return settings;
};

const createInputs = (settings: any) => {
  const vindex = settings.vindex;
  const aindex = settings.aindex;

  const address = `${vindex}:${aindex}`;
  const input = {
    address: address,
    options: [] as string[],
  };

  input.options.push('-f', 'avfoundation');

  if (parseInt(settings.framerate) !== 0) {
    input.options.push('-framerate', '' + settings.framerate);
  }

  if (settings.format.length !== 0) {
    input.options.push('-pixel_format', settings.format);
  }

  if (settings.size.length !== 0 && settings.size !== 'auto') {
    input.options.push('-video_size', settings.size);
  }

  if (settings.cursor) {
    input.options.push('-capture_cursor');
  }

  if (settings.clicks) {
    input.options.push('-capture_mouse_clicks');
  }

  return [input];
};

function Source({
  knownDevices = [],
  settings = {},
  onChange = function (settings: any) {},
  onProbe = function (settings: any, inputs: any) {},
  onRefresh = function () {},
  onStore = function (name: any, data: any) {
    return '';
  },
}: any) {
  const classes = useStyles();
  const { i18n } = useLingui();
  settings = initSettings(settings);

  const handleChange = (what: any) => (event: any) => {
    let data: Record<string, any> = {};

    if (['cursor', 'clicks'].includes(what)) {
      data[what] = !settings[what];
    } else {
      data[what] = event.target.value;
    }

    onChange({
      ...settings,
      ...data,
    });
  };

  const handleRefresh = () => {
    onRefresh();
  };

  const handleProbe = () => {
    onProbe(settings, createInputs(settings));
  };

  let filteredDevices = knownDevices.filter(
    (device: any) => device.media === 'video',
  );
  let options = filteredDevices.map((device: any) => {
    return {
      value: device.id,
      label: device.name,
    };
  });

  options.unshift({
    value: 'default',
    label: i18n._(t`Default`),
  });

  options.push({
    value: 'custom',
    label: i18n._(t`Custom ...`),
  });

  const videoDevices = (
    <SelectCustom
      options={options}
      label={<Trans>Video device</Trans>}
      customLabel={<Trans>Custom video index</Trans>}
      value={settings.vindex}
      onChange={handleChange('vindex')}
      variant="outlined"
      allowCustom
    />
  );

  filteredDevices = knownDevices.filter(
    (device: any) => device.media === 'audio',
  );
  options = filteredDevices.map((device: any) => {
    return {
      value: device.id,
      label: device.name,
    };
  });

  options.unshift({
    value: 'none',
    label: i18n._(t`None`),
  });
  options.unshift({
    value: 'default',
    label: i18n._(t`Default`),
  });
  options.push({
    value: 'custom',
    label: i18n._(t`Custom ...`),
  });

  const audioDevices = (
    <SelectCustom
      options={options}
      label={<Trans>Audio device</Trans>}
      customLabel={<Trans>Custom audio index</Trans>}
      value={settings.aindex}
      onChange={handleChange('aindex')}
      variant="outlined"
      allowCustom
    />
  );

  return (
    <Grid
      container
      alignItems="flex-start"
      spacing={2}
      className={classes.gridContainer}
    >
      <Grid item xs={12}>
        <Typography>
          <Trans>Select a device:</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        {videoDevices}
      </Grid>
      <Grid item xs={12}>
        {audioDevices}
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ float: 'right' }}
        >
          <Trans>Refresh</Trans>
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Video.Format
          value={settings.format}
          onChange={handleChange('format')}
          allowCustom
        />
      </Grid>
      <Grid item xs={12}>
        <Video.Framerate
          value={settings.framerate}
          onChange={handleChange('framerate')}
          allowCustom
        />
      </Grid>
      <Grid item xs={12}>
        <Video.Size
          value={settings.size}
          onChange={handleChange('size')}
          allowAuto
          allowCustom
        />
      </Grid>
      <Grid item xs={12}>
        <Checkbox
          label={<Trans>Capture cursor</Trans>}
          checked={settings.cursor}
          onChange={handleChange('cursor')}
        />
      </Grid>
      <Grid item xs={12}>
        <Checkbox
          label={<Trans>Capture clicks</Trans>}
          checked={settings.clicks}
          onChange={handleChange('clicks')}
        />
      </Grid>
      <Grid item xs={12}>
        <FormInlineButton onClick={handleProbe}>
          <Trans>Probe</Trans>
        </FormInlineButton>
      </Grid>
    </Grid>
  );
}

function SourceIcon(props: any) {
  return <Icon style={{ color: '#FFF' }} {...props} />;
}

const id = 'avfoundation';
const name = <Trans>AVFoundation</Trans>;
const capabilities = ['audio', 'video'];
const ffversion = '^4.1.0 || ^5.0.0 || ^6.1.0 || ^7.0.0 || ^8.1.0 || ^9.0.0';

const func = {
  initSettings,
  createInputs,
};

export {
  id,
  name,
  capabilities,
  ffversion,
  SourceIcon as icon,
  Source as component,
  func,
};
