import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import Icon from '@mui/icons-material/KeyboardTab';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import BoxTextarea from '../../../../components/BoxTextarea';
import Select from '../../../../components/Select';
import Textarea from '../../../../components/Textarea';
import * as S from '../../Sources/Network';

const initSettings = (initialSettings: any, config: any) => {
  const settings = {
    ...S.func.initSettings(initialSettings, config),
    mode: 'push',
  };

  settings.push.type = 'rtmp';

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
  const { i18n } = useLingui();
  const navigate = useNavigate();
  config = S.func.initConfig(config);
  settings = initSettings(settings, config);
  skills = S.func.initSkills(skills);

  const handleChange = (newSettings: any) => {
    newSettings = newSettings || settings;

    const inputs = S.func.createInputs(newSettings, config, skills);
    newSettings.address = inputs[0].address;

    onChange(S.id, newSettings, inputs, config.rtmp.enabled);
  };

  const handleRefresh = () => {
    onRefresh();
  };

  const update = (what: any) => (event: any) => {
    const value = event.target.value;
    const newSettings = {
      ...settings,
    };

    if (what in newSettings.push) {
      newSettings.push[what] = value;
    }

    handleChange(newSettings);
  };

  React.useEffect(() => {
    handleChange(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let form = null;

  if (config.rtmp.enabled === false) {
    form = (
      <React.Fragment>
        <Grid item xs={12}>
          <Typography>
            <Trans>RTMP server is not enabled</Trans>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            color="primary"
            onClick={() => navigate('/settings/rtmp')}
          >
            <Trans>Enable RTMP server ...</Trans>
          </Button>
        </Grid>
      </React.Fragment>
    );
  } else {
    const filteredDevices = knownDevices.filter(
      (device: any) => device.media === 'rtmp',
    );
    const options = filteredDevices.map((device: any) => {
      return (
        <MenuItem key={device.id} value={device.id}>
          {device.name}
        </MenuItem>
      );
    });

    options.unshift(
      <MenuItem key="none" value="none" disabled>
        {i18n._(t`Choose an input stream ...`)}
      </MenuItem>,
    );

    options.push(
      <MenuItem key={config.channelid} value={config.channelid}>
        {i18n._(t`Send stream to address ...`)}
      </MenuItem>,
    );

    const RTMP = S.func.getRTMP(config);

    form = (
      <React.Fragment>
        <Grid item xs={12}>
          <Select
            type="select"
            label={<Trans>Input stream</Trans>}
            value={settings.push.name}
            onChange={update('name')}
          >
            {options}
          </Select>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ float: 'right' }}
          >
            <Trans>Refresh</Trans>
          </Button>
        </Grid>
        {settings.push.name === config.channelid && (
          <React.Fragment>
            <Grid item xs={12}>
              <Typography>
                <Trans>Address:</Trans>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <BoxTextarea>
                <Textarea rows={1} value={RTMP} readOnly allowCopy />
              </BoxTextarea>
            </Grid>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }

  return form;
}

function SourceIcon(props: any) {
  return <Icon style={{ color: '#FFF' }} {...props} />;
}

const id = 'rtmp';
const type = 'network';
const name = <Trans>RTMP server</Trans>;
const capabilities = ['audio', 'video'];

export {
  id,
  type,
  name,
  capabilities,
  SourceIcon as icon,
  Source as component,
};
