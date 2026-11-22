import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import RefreshIcon from '@mui/icons-material/Refresh';
import Icon from '@mui/icons-material/Usb';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import Audio from '../../../components/coders/settings/Audio';
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
    address: 'hw:1,0',
    device: '1,0',
    sampling: '44100',
    channels: '1',
    delay: 0,
    ...initialSettings,
  };

  return settings;
};

const createInputs = (settings: any) => {
  let address = `hw:${settings.device}`;

  const input = {
    address: address,
    options: [] as string[],
  };

  input.options.push('-f', 'alsa');
  input.options.push('-thread_queue_size', '512');
  input.options.push('-channels', '' + settings.channels);
  input.options.push('-sample_rate', '' + settings.sampling);

  if (settings.delay !== 0) {
    input.options.push('-itsoffset', settings.delay + 'ms');
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

    if (['address', 'device', 'sampling', 'channels', 'delay'].includes(what)) {
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
    (device: any) => device.media === 'audio',
  );
  const options = filteredDevices.map((device: any) => {
    return {
      value: device.id.replace(/^hw:/, ''),
      label: device.name,
    };
  });

  options.unshift({
    value: 'none',
    label: i18n._(t`Choose an input device ...`),
    disabled: true,
  });
  options.push({
    value: 'custom',
    label: i18n._(t`Custom ...`),
  });

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
        <SelectCustom
          options={options}
          label={<Trans>Audio device</Trans>}
          customLabel={<Trans>Custom audio device</Trans>}
          value={settings.device}
          onChange={handleChange('device')}
          variant="outlined"
          allowCustom
        />
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
        <Audio.Sampling
          value={settings.sampling}
          onChange={handleChange('sampling')}
          allowCustom
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          variant="outlined"
          fullWidth
          label={<Trans>Channels</Trans>}
          value={settings.channels}
          onChange={handleChange('channels')}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          variant="outlined"
          fullWidth
          label={<Trans>Delay (ms)</Trans>}
          value={settings.delay}
          onChange={handleChange('delay')}
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
  return <Icon {...props} />;
}

const id = 'alsa';
const name = <Trans>ALSA</Trans>;
const capabilities = ['audio'];
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
