import Grid from '@mui/material/Grid';
import React from 'react';

const useStyles = () => {
  return {
    root: {
      marginBottom: '.3em',
      marginTop: '1.2em',
      minHeight: '38px',
      '& button': {
        marginRight: '.5em',
      },
      '& div button': {
        float: 'right',
        marginRight: '0',
        marginLeft: '.5em',
      },
    },
  };
};

const Component = function ({ buttonsLeft = null, buttonsRight = null }: any) {
  const classes = useStyles();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sx={classes.root}>
        <div>{buttonsRight}</div>
        {buttonsLeft}
      </Grid>
    </Grid>
  );
};

export default Component;
