import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamIcon from '@mui/icons-material/Videocam';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import { makeStyles } from 'tss-react/mui';

import FormInlineButton from '../../../components/FormInlineButton';
import SelectCustom from '../../../components/SelectCustom';

const useStyles = makeStyles()((theme) => ({
  gridContainer: {
    marginTop: '0.5em',
  },
}));

const initSettings = (initialSettings: any) => {
  if (!initialSettings) {
    initialSettings = {};
  }

  const settings = {
    channelid: 'none',
    ...initialSettings,
  };

  return settings;
};

const createInputs = (settings: any) => {
  const address = `{fs:mem}/${settings.channelid}.m3u8`;
  const input = {
    address: address,
    options: [] as string[],
  };

  return [input];
};

function Source({
  knownDevices = [],
  settings = {},
  onChange = function (settings: any) {},
  onProbe = function (settings: any, inputs: any) {},
  onRefresh = function () {},
}: any) {
  const { classes } = useStyles();
  const { i18n } = useLingui();
  settings = initSettings(settings);

  const handleChange = (what: any) => (event: any) => {
    let data: Record<string, any> = {};

    if (['channelid'].includes(what)) {
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

  const options = knownDevices.map((device: any) => {
    return {
      value: device.id,
      label: device.name + ' (' + device.id + ')',
    };
  });

  options.unshift({
    value: 'none',
    label: i18n._(t`Choose an input channel ...`),
    disabled: true,
  });

  return (
    <Grid
      container
      spacing={2}
      className={classes.gridContainer}
      sx={{
        alignItems: 'flex-start',
      }}
    >
      <Grid item xs={12}>
        <Typography>
          <Trans>Select a channel:</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <SelectCustom
          options={options}
          label={<Trans>Video device</Trans>}
          value={settings.channelid}
          onChange={handleChange('channelid')}
          variant="outlined"
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
        <FormInlineButton
          onClick={handleProbe}
          disabled={settings.channelid === 'none'}
        >
          <Trans>Probe</Trans>
        </FormInlineButton>
      </Grid>
    </Grid>
  );
}

function SourceIcon(props: any) {
  return <VideocamIcon style={{ color: '#FFF' }} {...props} />;
}

const id = 'channel';
const name = <Trans>Channel</Trans>;
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
