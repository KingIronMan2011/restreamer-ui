import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { Cpu } from 'lucide-react';
import React from 'react';

import Select from '../../../../misc/Select';
import * as S from '../../Sources/Raspicam';

function initSettings(initialSettings: any, knownDevices: any) {
  const settings = {
    ...S.func.initSettings(initialSettings),
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
      device.extra.match(/bcm2835[-_]v4l2/) !== null,
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
  const devices = initDevices(knownDevices);
  settings = initSettings(settings, knownDevices);

  const handleChange = (newSettings: any) => {
    newSettings = newSettings || settings;

    onChange(S.id, newSettings, S.func.createInputs(newSettings), true);
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
      </Grid>
    </React.Fragment>
  );
}

function SourceIcon(props: any) {
  return <Cpu style={{ color: '#FFF' }} {...props} />;
}

const id = 'raspicam';
const type = 'raspicam';
const name = <Trans>Raspberry Pi camera</Trans>;
const capabilities = ['video'];

export {
  id,
  type,
  name,
  capabilities,
  SourceIcon as icon,
  Source as component,
};
