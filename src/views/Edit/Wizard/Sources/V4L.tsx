import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import Grid from '@mui/material/GridLegacy';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { Usb } from 'lucide-react';
import React from 'react';

import Select from '../../../../components/Select';
import * as S from '../../Sources/V4L';

function initSettings(initialSettings: any, knownDevices: any) {
  const settings = {
    ...S.func.initSettings(initialSettings),
    format: 'nv12',
    framerate: '25',
    size: '1280x720',
  };

  const devices = initDevices(knownDevices);

  if (devices.length !== 0) {
    let found = false;
    for (let device of devices) {
      if (settings.device === device.id) {
        found = true;
        break;
      }
    }

    if (found === false) {
      settings.device = '';
    }
  }

  if (devices.length !== 0) {
    const device = devices[0];

    if (settings.device.length === 0) {
      settings.device = device.id;
    }
  }

  return settings;
}

function initDevices(initialDevices: any) {
  const devices = initialDevices.filter(
    (device: any) =>
      device.media === 'video' &&
      device.extra.match(/bcm2835[-_]v4l2/) === null,
  );

  return devices;
}

function Source({
  settings = {},
  knownDevices = [],
  config = null,
  skills = null,
  onChange = function (type: any, settings: any, inputs: any, ready: any) {},
  onRefresh = function () {},
}: any) {
  const { i18n } = useLingui();
  const devices = initDevices(knownDevices);
  settings = initSettings(settings, knownDevices);

  const handleChange = (newSettings: any) => {
    newSettings = newSettings || settings;

    onChange(
      S.id,
      newSettings,
      S.func.createInputs(newSettings),
      devices.length !== 0 ? true : false,
    );
  };

  const handleRefresh = () => {
    onRefresh();
  };

  const update = (what: any) => (event: any) => {
    const value = event.target.value;
    const newSettings = settings;

    if (what in newSettings) {
      newSettings[what] = value;
    }

    handleChange(newSettings);
  };

  React.useEffect(() => {
    handleChange(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = devices.map((device: any) => {
    return (
      <MenuItem key={device.id} value={device.id}>
        {device.name} ({device.id})
      </MenuItem>
    );
  });

  if (options.length === 0) {
    options.push(
      <MenuItem key="none" value="none" disabled={true}>
        {i18n._(t`No input device available`)}
      </MenuItem>,
    );
  }

  const videoDevices = (
    <Select
      label={<Trans>Video device</Trans>}
      value={settings.device}
      onChange={update('device')}
    >
      {options}
    </Select>
  );

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
}

function SourceIcon(props: any) {
  return <Usb style={{ color: '#FFF' }} {...props} />;
}

const id = 'video4linux2';
const type = 'video4linux2';
const name = <Trans>Hardware device</Trans>;
const capabilities = ['video'];

export {
  id,
  type,
  name,
  capabilities,
  SourceIcon as icon,
  Source as component,
};
