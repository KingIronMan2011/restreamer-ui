import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import React from 'react';

import FormInlineButton from '../../../components/FormInlineButton';
import Logo from './logos/rumble.svg';

const id = 'rumble';
const name = 'Rumble';
const version = '1.0';
const stream_key_link = 'https://rumble.com/account/live-streaming';
const description = (
  <Trans>
    Transmit your Livestream to an Rumble RTMP service.{' '}
    <Link
      color="secondary"
      target="_blank"
      href="https://rumblefaq.groovehq.com/help/search?keyword=rtmp"
    >
      Here{' '}
    </Link>
    you can find more details about the settings.
  </Trans>
);
const image_copyright = (
  <Trans>
    Please get in touch with the operator of the service and check what happens.
  </Trans>
);
const author = {
  creator: {
    name: 'datarhei',
    link: 'https://github.com/datarhei',
  },
  maintainer: {
    name: 'datarhei',
    link: 'https://github.com/datarhei',
  },
};
const category = 'platform';
const requires = {
  protocols: ['rtmp', 'rtmps'],
  formats: ['flv'],
  codecs: {
    audio: ['aac', 'mp3'],
    video: ['h264'],
  },
};

function ServiceIcon(props: any) {
  return <img src={Logo} alt="Rumble Logo" {...props} />;
}

function init(settings: any) {
  const initSettings = {
    server_url: '',
    stream_key: '',
    ...settings,
  };

  return initSettings;
}

function Service({
  settings = {},
  skills = {},
  metadata = {},
  streams = [],
  validationErrors = {},
  onChange = function (output: any, settings: any) {},
}: any) {
  settings = init(settings);

  const handleChange = (what: any) => (event: any) => {
    const value = event.target.value;

    settings[what] = value;

    const output = createOutput(settings);

    onChange([output], settings);
  };

  const createOutput = (settings: any) => {
    const output = {
      address: settings.server_url + '/' + settings.stream_key,
      options: ['-f', 'flv'],
    };

    return output;
  };

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <TextField
          variant="outlined"
          fullWidth
          placeholder="rtmp://abc.live.rmbl.ws/slot-1234"
          label={<Trans>Server URL</Trans>}
          value={settings.server_url}
          onChange={handleChange('server_url')}
          error={Boolean(validationErrors.server_url)}
          helperText={validationErrors.server_url}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 9,
        }}
      >
        <TextField
          variant="outlined"
          fullWidth
          placeholder="abc123"
          label={<Trans>Stream key</Trans>}
          value={settings.stream_key}
          onChange={handleChange('stream_key')}
          error={Boolean(validationErrors.stream_key)}
          helperText={validationErrors.stream_key}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 3,
        }}
      >
        <FormInlineButton target="blank" href={stream_key_link} component="a">
          <Trans>GET</Trans>
        </FormInlineButton>
      </Grid>
    </Grid>
  );
}

export {
  id,
  name,
  version,
  stream_key_link,
  description,
  image_copyright,
  author,
  category,
  requires,
  ServiceIcon as icon,
  Service as component,
};
