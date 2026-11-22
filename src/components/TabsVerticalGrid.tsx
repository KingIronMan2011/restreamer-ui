import Grid from '@mui/material/Grid';
import React from 'react';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  grid: {
    flexGrow: '1',
    display: 'flex',
    height: '100%',
  },
}));

export default function Component({
  children = null as import('react').ReactNode,
}: any) {
  const { classes } = useStyles();

  return (
    <Grid item xs={12} className={classes.grid}>
      {children}
    </Grid>
  );
}
