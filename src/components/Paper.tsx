import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import React from 'react';

const useStyles = () => {
  const theme = useTheme();
  return {
    PaperM: {
      padding: '3em 3.5em 3em 3.5em!important',
    },
    PaperL: {
      padding: '4em 4.5em 4em 4.5em!important',
    },
    PaperService: {
      padding: '4em 4.5em 4em 4.5em!important',
      border: `1px solid ${theme.palette.background.light1}`,
      backgroundColor: theme.palette.service.contrastText,
    },
  };
};

const Component = React.forwardRef<any, any>(
  (
    {
      xs = 12,
      sm = undefined,
      md = undefined,
      lg = undefined,
      elevation = 0,
      className = 'paper',
      style = null,
      marginBottom = '6em',
      tabIndex = 0,
      children = null as import('react').ReactNode,
    },
    ref,
  ) => {
    const classes = useStyles();

    return (
      <Grid
        container
        spacing={1}
        style={{ marginBottom: marginBottom }}
        sx={{
          justifyContent: 'center',
        }}
      >
        <Grid
          size={{
            xs: xs,
            sm: sm,
            md: md,
            lg: lg,
          }}
        >
          <Paper
            sx={classes[className as keyof typeof classes]}
            elevation={elevation}
            ref={ref}
            tabIndex={tabIndex}
            style={style}
          >
            {children}
          </Paper>
        </Grid>
      </Grid>
    );
  },
);

export default Component;
