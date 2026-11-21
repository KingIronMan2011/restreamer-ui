import { Trans } from '@lingui/react/macro';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EditIcon from '@mui/icons-material/Edit';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';

import * as M from '../../utils/metadata';
import Summary from './Summary';

function IconWizard(props: any) {
  return <AutoFixHighIcon {...props} />;
}

function IconEdit(props: any) {
  return <EditIcon {...props} />;
}

const useStyles = makeStyles((theme) => ({
  title: {
    float: 'left',
  },
  edit: {
    float: 'right',
    marginTop: '.5em',
  },
}));

export default function ProfileSummary({
  sources = [],
  profile = null,
  onEdit = function (type: any) {},
  onWizard = function () {},
}: any) {
  const classes = useStyles();

  profile = M.initProfile(profile);

  const handleEdit = (what: any) => () => {
    onEdit(what);
  };

  const handleWizard = () => () => {
    onWizard();
  };

  return (
    <Grid container spacing={2}>
      <Grid
        item
        xs={12}
        sx={{
          '& button': {
            marginTop: '1em',
            float: 'right',
            marginLeft: '1em',
          },
        }}
      >
        <IconButton size="small" color="inherit" onClick={handleEdit('video')}>
          <IconEdit />
        </IconButton>
        <IconButton size="small" color="inherit" onClick={handleWizard()}>
          <IconWizard />
        </IconButton>
        <Typography variant="h3">
          <Trans>Video settings</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Summary type="video" sources={sources} profile={profile.video} />
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          '& button': {
            marginTop: '1em',
            float: 'right',
            marginLeft: '1em',
          },
        }}
      >
        <IconButton size="small" color="inherit" onClick={handleEdit('audio')}>
          <IconEdit />
        </IconButton>
        <IconButton size="small" color="inherit" onClick={handleWizard()}>
          <IconWizard />
        </IconButton>
        <Typography variant="h3" className={classes.title}>
          <Trans>Audio settings</Trans>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Summary type="audio" sources={sources} profile={profile.audio} />
      </Grid>
    </Grid>
  );
}
