import { Trans } from '@lingui/react/macro';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

import Paper from '../components/Paper';
import PaperContent from '../components/PaperContent';

export default function Invalid(props: any) {
  return (
    <Paper xs={8} sm={5} className="PaperM">
      <PaperContent>
        <Grid
          container
          spacing={2}
          sx={{
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Grid size={12}>
            <CircularProgress color="inherit" />
          </Grid>
          <Grid size={12}>
            <Typography>
              <Trans>Connecting to Restreamer Core ...</Trans>
            </Typography>
          </Grid>
        </Grid>
      </PaperContent>
    </Paper>
  );
}
