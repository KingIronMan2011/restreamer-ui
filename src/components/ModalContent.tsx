import { Trans } from '@lingui/react/macro';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/HelpOutlined';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

const useStyles = () => {
  const theme = useTheme();
  return {
    modalHeader: {
      marginBottom: '.7em',
      '& button': {
        float: 'right',
        marginLeft: '.5em',
        paddingTop: '.25em',
        marginRight: '-.7em',
      },
    },
    modalFooter: {
      marginTop: '1.2em',
      minHeight: '38px',
      '& button': {
        marginRight: '.5em',
      },
      '& .right': {
        float: 'right',
        marginRight: '0',
        marginLeft: '.5em',
      },
    },
    modalPaper: {
      padding: '1em 1.5em 1.3em 1.5em',
      width: '95%',
      maxWidth: 980,
      maxHeight: '95%',
      overflow: 'scroll',
      backgroundColor: theme.palette.background.modal,
      color: theme.palette.text.primary,
    },
  };
};

const Component = React.forwardRef<any, any>(
  (
    {
      title = '',
      onClose = null as (() => void) | null,
      onHelp = null as (() => void) | null,
      className = null,
      style = null,
      children = null as import('react').ReactNode,
    },
    ref,
  ) => {
    const classes = useStyles();

    return (
      <Paper
        className={className}
        sx={classes.modalPaper}
        elevation={0}
        tabIndex={-1}
        ref={ref}
        style={style}
      >
        <Grid container spacing={0}>
          <Grid sx={classes.modalHeader} size={12}>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="button">{title}</Typography>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                {typeof onHelp === 'function' && (
                  <IconButton color="inherit" size="small" onClick={onHelp}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                )}
                {typeof onClose === 'function' && (
                  <IconButton color="inherit" size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        {children}
        <Grid container spacing={0}>
          <Grid sx={classes.modalFooter} size={12}>
            <Button variant="outlined" color="default" onClick={onClose}>
              <Trans>Close</Trans>
            </Button>
          </Grid>
        </Grid>
      </Paper>
    );
  },
);

export default Component;
