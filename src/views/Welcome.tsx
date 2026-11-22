import { Trans } from '@lingui/react/macro';
import Button from '@mui/material/Button';
import Grid from '@mui/material/GridLegacy';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useNavigate, useParams } from 'react-router';

import Paper from '../components/Paper';
import PaperThumb from '../components/PaperThumb';

export default function Welcome() {
  const navigate = useNavigate();
  const { channelid: _channelid } = useParams();

  return (
    <Paper xs={12} md={6} className="PaperM">
      <Grid
        container
        spacing={2}
        sx={{
          justifyContent: 'center',
        }}
      >
        <Grid item xs={12}>
          <PaperThumb
            image="/images/welcome.png"
            title="Welcome to Restreamer v2"
            height="200px"
          />
        </Grid>
        <Grid item xs={12}></Grid>
        <Grid item xs={12}>
          <Typography align="center">
            <Trans>
              Welcome to Restreamer v2, the solution for fast and easy video
              publishing. Free for private and commercial use. Further help in
              the{' '}
              <Link
                color="secondary"
                target="_blank"
                href="https://docs.datarhei.com"
              >
                docs
              </Link>
              .
            </Trans>
          </Typography>
        </Grid>
        <Grid item xs={12}></Grid>
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/${_channelid}/edit/wizard`)}
          >
            <Trans>Next: Video setup</Trans>
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
