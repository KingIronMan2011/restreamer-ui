import { Trans } from '@lingui/macro';
import Icon from '@mui/icons-material/KeyboardTab';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

import BoxTextarea from '../../../../components/BoxTextarea';
import Textarea from '../../../../components/Textarea';
import * as S from '../../Sources/Network';

const initSettings = (initialSettings: any, config: any) => {
  const settings = {
    ...S.func.initSettings(initialSettings, config),
    mode: 'push',
  };

  settings.push.type = 'hls';

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

    const inputs = S.func.createInputs(newSettings, config, skills);
    newSettings.address = inputs[0].address;

    onChange(S.id, newSettings, inputs, newSettings.address.length !== 0);
  };

  React.useEffect(() => {
    handleChange(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const HLS = S.func.getHLS(config, settings.push.name);

  return (
    <React.Fragment>
      <Grid item xs={12}>
        <Typography>
          <Trans>Send stream to this address:</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <BoxTextarea>
          <Textarea rows={1} value={HLS} readOnly allowCopy />
        </BoxTextarea>
      </Grid>
    </React.Fragment>
  );
}

function SourceIcon(props: any) {
  return <Icon style={{ color: '#FFF' }} {...props} />;
}

const id = 'hls';
const type = 'network';
const name = <Trans>HLS server</Trans>;
const capabilities = ['audio', 'video'];

export {
  id,
  type,
  name,
  capabilities,
  SourceIcon as icon,
  Source as component,
};
