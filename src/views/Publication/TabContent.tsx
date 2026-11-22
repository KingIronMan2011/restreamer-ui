import { Trans } from '@lingui/react/macro';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/GridLegacy';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React from 'react';

const useStyles = () => {
  return {
    serviceIcon: {
      fontSize: '4rem!important',
      maxHeight: 64,
      marginTop: '-0.065em',
    },
    serviceName: {
      marginTop: '-.2rem',
    },
  };
};

export default function TabContent({ service = null, children = '' }: any) {
  const classes = useStyles();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          <service.icon sx={classes.serviceIcon} />
          <Stack
            direction="column"
            spacing={0}
            sx={{
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <Typography variant="h1" sx={classes.serviceName}>
              {service.name}
            </Typography>
            <Typography>v{service.version}</Typography>
          </Stack>
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <Divider />
      </Grid>
      {children}
      <Grid item xs={12}>
        <Divider />
      </Grid>
      <Grid item xs={12}>
        <Typography>
          <Trans>Maintainer:</Trans>{' '}
          <Link
            color="secondary"
            target="_blank"
            href={service.author.maintainer.link}
          >
            {service.author.maintainer.name}
          </Link>
        </Typography>
      </Grid>
    </Grid>
  );
}
