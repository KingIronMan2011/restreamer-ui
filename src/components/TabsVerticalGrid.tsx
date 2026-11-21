import Grid from '@mui/material/Grid';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';

const useStyles = makeStyles((theme) => ({
  grid: {
    flexGrow: '1',
    display: 'flex',
    height: '100%',
  },
}));

export default function Component({
  children = null as import('react').ReactNode,
}: any) {
  const classes = useStyles();

  return (
    <Grid item xs={12} className={classes.grid}>
      {children}
    </Grid>
  );
}
