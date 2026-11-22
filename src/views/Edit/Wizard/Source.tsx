import { Trans } from '@lingui/react/macro';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/GridLegacy';
import Typography from '@mui/material/Typography';
import React from 'react';

import Paper from '../../../components/Paper';
import PaperHeader from '../../../components/PaperHeader';

export default function Source({
  onAbort = () => {},
  onHelp = () => {},
  onAdvanced = () => {},
  sources = [],
}: any) {
  return (
    <Paper xs={12} sm={9} md={6} marginBottom="6em" className="PaperM">
      <PaperHeader
        spacing={2}
        variant="h1"
        title={<Trans>Video setup</Trans>}
        onAbort={onAbort}
        onHelp={onHelp}
      />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography>
            <Trans>
              Select whether you pull the stream from a{' '}
              <strong>network source</strong> (such as a network camera) or the{' '}
              <strong>internal RTMP server</strong> (e.g., OBS streams to the
              Restreamer).
            </Trans>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {sources}
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="outlined"
            fullWidth
            color="default"
            onClick={onAdvanced}
          >
            <Trans>Advanced setup</Trans>
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
