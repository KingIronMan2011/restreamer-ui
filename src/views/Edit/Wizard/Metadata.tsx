import { Trans } from '@lingui/react/macro';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

import MetadataControl from '../../../components/controls/Metadata';
import Paper from '../../../components/Paper';
import PaperHeader from '../../../components/PaperHeader';

export default function Metadata({
  onAbort = () => {},
  onHelp = () => {},
  onBack = () => {},
  onNext = () => {},
  onChange = (metadata: any) => {},
  metadata = {},
}: any) {
  return (
    <Paper xs={12} sm={9} md={6} marginBottom="6em" className="PaperM">
      <PaperHeader
        spacing={2}
        variant="h1"
        title={<Trans>Metadata</Trans>}
        onAbort={onAbort}
        onHelp={onHelp}
      />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Typography>
            <Trans>
              Briefly describe what the audience will see during the live
              stream.
            </Trans>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <MetadataControl settings={metadata} onChange={onChange} />
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={3}>
          <Button variant="outlined" color="default" fullWidth onClick={onBack}>
            <Trans>Back</Trans>
          </Button>
        </Grid>
        <Grid item xs={9}>
          <Button variant="outlined" fullWidth color="primary" onClick={onNext}>
            <Trans>Next</Trans>
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
