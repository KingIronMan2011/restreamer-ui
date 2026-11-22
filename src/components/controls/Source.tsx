import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import React from 'react';

import Select from '../Select';

function init(settings: any) {
  const initSettings = {
    source: 'hls+memfs',
    ...settings,
  };

  switch (initSettings.source) {
    case 'hls+diskfs':
    case 'rtmp':
    case 'srt':
      break;
    default:
      initSettings.source = 'hls+memfs';
  }

  return initSettings;
}

export default function Control({
  settings = {},
  sources = [],
  onChange = function (settings: any, automatic: any) {},
}: any) {
  settings = init(settings);

  // Set the defaults
  React.useEffect(() => {
    onChange(settings, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (what: any) => (event: any) => {
    const value = event.target.value;

    settings[what] = value;

    onChange(settings, false);
  };

  const items: any[] = [];

  items.push(
    <MenuItem
      key="hls+memfs"
      value="hls+memfs"
      disabled={!sources.includes('hls+memfs')}
    >
      HLS (memfs)
    </MenuItem>,
  );

  items.push(
    <MenuItem
      key="hls+diskfs"
      value="hls+diskfs"
      disabled={!sources.includes('hls+diskfs')}
    >
      HLS (diskfs)
    </MenuItem>,
  );

  items.push(
    <MenuItem key="rtmp" value="rtmp" disabled={!sources.includes('rtmp')}>
      RTMP
    </MenuItem>,
  );

  items.push(
    <MenuItem key="srt" value="srt" disabled={!sources.includes('srt')}>
      SRT
    </MenuItem>,
  );

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Select
          label={<Trans>Source</Trans>}
          value={settings.source}
          onChange={handleChange('source')}
        >
          {items}
        </Select>
        <Typography variant="caption">
          <Trans>Stream source for publication service (experimental).</Trans>
        </Typography>
      </Grid>
    </Grid>
  );
}
