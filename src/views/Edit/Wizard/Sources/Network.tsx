import { Trans } from '@lingui/react/macro';
import Icon from '@mui/icons-material/SettingsEthernet';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import Checkbox from '../../../../components/Checkbox';
import Password from '../../../../components/Password';
import * as S from '../../Sources/Network';

const initSettings = (initialSettings: any, config: any) => {
  const settings = {
    ...S.func.initSettings(initialSettings, config),
    mode: 'pull',
  };

  return settings;
};

function Source({
  settings = {},
  knownDevices = [],
  config = null,
  skills = null,
  onChange = function (type: any, settings: any, inputs: any, ready: any) {},
  onRefresh = function () {},
}: any) {
  config = S.func.initConfig(config);
  settings = initSettings(settings, config);
  skills = S.func.initSkills(skills);

  const handleChange = (newSettings: any) => {
    newSettings = newSettings || settings;

    onChange(
      S.id,
      newSettings,
      S.func.createInputs(newSettings, config, skills),
      S.func.isValidURL(newSettings.address),
    );
  };

  const update = (protocol: any, what: any) => (event: any) => {
    const value = event.target.value;
    const newSettings = settings;

    if (protocol === 'rtsp') {
      if (['udp'].includes(what)) {
        newSettings.rtsp[what] = !newSettings.rtsp[what];
      }
    } else {
      newSettings[what] = value;
    }

    handleChange(newSettings);
  };

  React.useEffect(() => {
    handleChange(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const protocol = S.func.getProtocolClass(settings.address);

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <Typography>
          <Trans>Enter the address of your network source:</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label={<Trans>Address</Trans>}
          placeholder="rtsp://ip:port/path"
          value={settings.address}
          onChange={update('', 'address')}
        />
        <Typography variant="caption">
          <Trans>
            Supports HTTP (HLS, DASH), RTP, RTSP, RTMP, SRT and more.
          </Trans>
        </Typography>
      </Grid>
      {protocol === 'rtsp' && (
        <Grid item xs={12}>
          <Checkbox
            label={<Trans>UDP transport</Trans>}
            checked={settings.rtsp.udp}
            onChange={update('rtsp', 'udp')}
          />
        </Grid>
      )}
      <Grid item md={6} xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label={<Trans>Username</Trans>}
          value={settings.username}
          onChange={update('', 'username')}
          disabled={protocol === 'srt'}
        />
        <Typography variant="caption">
          <Trans>Username for the device.</Trans>
        </Typography>
      </Grid>
      <Grid item md={6} xs={12}>
        <Password
          variant="outlined"
          fullWidth
          label={<Trans>Password</Trans>}
          value={settings.password}
          onChange={update('', 'password')}
          disabled={protocol === 'srt'}
        />
        <Typography variant="caption">
          <Trans>Password for the device.</Trans>
        </Typography>
      </Grid>
    </React.Fragment>
  );
}

function SourceIcon(props: any) {
  return <Icon style={{ color: '#FFF' }} {...props} />;
}

const id = 'network';
const type = 'network';
const name = <Trans>Network source</Trans>;
const capabilities = ['audio', 'video'];

export {
  id,
  type,
  name,
  capabilities,
  SourceIcon as icon,
  Source as component,
};
