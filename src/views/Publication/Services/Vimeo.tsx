import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Video } from 'lucide-react';
import React from 'react';

const id = 'vimeo';
const name = 'Vimeo';
const version = '1.0';
const description = <Trans>Live-Streaming to Vimeo Live RTMP Service</Trans>;
const stream_key_link = '';
const image_copyright = <Trans>More about licenses here</Trans>;
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
  protocols: ['rtmp'],
  formats: ['flv'],
  codecs: {
    audio: ['aac', 'mp3'],
    video: ['h264'],
  },
};

function ServiceIcon(props: any) {
  return <Video style={{ color: '#00ADEF' }} {...props} />;
}

function init(settings: any) {
  const initSettings = {
    key: '',
    ...settings,
  };

  return initSettings;
}

function Service({
  settings = {},
  skills = {},
  metadata = {},
  streams = [],
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
      address: 'rtmp://rtmp-global.cloud.vimeo.com/live/' + settings.key,
      options: ['-f', 'flv'],
    };

    return output;
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label={<Trans>Stream key</Trans>}
          value={settings.key}
          onChange={handleChange('key')}
        />
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
