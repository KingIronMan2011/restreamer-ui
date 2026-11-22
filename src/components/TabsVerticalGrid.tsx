import Grid from '@mui/material/Grid';
import React from 'react';

const useStyles = () => {
  return {
    grid: {
      flexGrow: '1',
      display: 'flex',
      height: '100%',
    },
  };
};

export default function Component({
  children = null as import('react').ReactNode,
}: any) {
  const classes = useStyles();

  return (
    <Grid sx={classes.grid} size={12}>
      {children}
    </Grid>
  );
}
