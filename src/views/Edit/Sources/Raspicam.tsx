import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import Grid from '@mui/material/GridLegacy';
import Typography from '@mui/material/Typography';
import { Cpu } from 'lucide-react';
import React from 'react';

import Video from '../../../components/coders/settings/Video';
import FormInlineButton from '../../../components/FormInlineButton';
import SelectCustom from '../../../components/SelectCustom';

const useStyles = () => {
  return {
    gridContainer: {
      marginTop: '0.5em',
    },
  };
};

const initSettings = (initialSettings: any) => {
  if (!initialSettings) {
    initialSettings = {};
  }

  const settings = {
    device: 'none',
    format: 'yuv420p',
    framerate: '25',
    size: '1920x1080',
    ...initialSettings,
  };

  return settings;
};

const createInputs = (settings: any) => {
  const address =
    settings.device === 'custom' || settings.device === 'none'
      ? settings.deviceCustom
      : settings.device;
  const input = {
    address: address,
    options: [] as string[],
  };

  input.options.push('-thread_queue_size', '512');
  input.options.push('-re');
  input.options.push('-r', '' + settings.framerate);
  input.options.push('-f', 'video4linux2');
  input.options.push('-framerate', '' + settings.framerate);
  input.options.push('-video_size', settings.size);
  input.options.push('-input_format', settings.format);

  return [input];
};

function Source({
  knownDevices = [],
  settings = {},
  onChange = function (settings: any) {},
  onProbe = function (settings: any, inputs: any) {},
  onRefresh = function () {},
}: any) {
  const classes = useStyles();
  const { i18n } = useLingui();
  settings = initSettings(settings);

  const handleChange = (what: any) => (event: any) => {
    let data: Record<string, any> = {};

    if (['device', 'format', 'framerate', 'size'].includes(what)) {
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

  const filteredDevices = knownDevices.filter(
    (device: any) => device.media === 'video',
  );
  const options = filteredDevices.map((device: any) => {
    return {
      value: device.id,
      label: device.name + ' (' + device.id + ')',
    };
  });

  options.unshift({
    value: 'none',
    label: i18n._(t`Choose an input device ...`),
    disabled: true,
  });

  const videoDevices = (
    <SelectCustom
      options={options}
      label={<Trans>Video device</Trans>}
      value={settings.device}
      onChange={handleChange('device')}
      variant="outlined"
    />
  );

  return (
    <Grid
      container
      spacing={2}
      sx={[
        classes.gridContainer,
        {
          alignItems: 'flex-start',
        },
      ]}
    >
      <Grid item xs={12}>
        <Typography>
          <Trans>Select a device:</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        {videoDevices}
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
          allowCustom
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
  return <Cpu style={{ color: '#FFF' }} {...props} />;
}

const id = 'raspicam';
const name = <Trans>Raspberry Pi camera</Trans>;
const capabilities = ['video'];
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
