import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/HelpOutlined';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
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
      },
    },
    modalFooter: {
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
    modalPaper: {
      padding: '1em 1.5em 1.3em 1.5em',
      width: '95%',
      maxWidth: 540,
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
      open = false,
      title = '',
      onClose = null as (() => void) | null,
      onHelp = null as (() => void) | null,
      buttonsRight = null,
      buttonsLeft = null,
      maxWidth = -1,
      children = null as import('react').ReactNode,
    },
    ref,
  ) => {
    const classes = useStyles();

    return (
      <Dialog
        open={open}
        onClose={onClose}
        className="modal"
        disableScrollLock
        maxWidth={false}
        ref={ref}
        slotProps={{
          paper: {
            sx: {
              ...classes.modalPaper,
              ...(maxWidth > 0 ? { maxWidth } : {}),
            },
          },
        }}
      >
        <Grid container spacing={0}>
          <Grid sx={classes.modalHeader} size={12}>
            <Typography variant="button">{title}</Typography>
            {typeof onClose === 'function' && (
              <IconButton color="inherit" size="small" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
            {typeof onHelp === 'function' && (
              <IconButton color="inherit" size="small" onClick={onHelp}>
                <HelpIcon fontSize="small" />
              </IconButton>
            )}
          </Grid>
        </Grid>
        <Grid size={12}>{children}</Grid>
        <Grid container spacing={0}>
          <Grid sx={classes.modalFooter} size={12}>
            <div>{buttonsRight}</div>
            {buttonsLeft}
          </Grid>
        </Grid>
      </Dialog>
    );
  },
);

export default Component;
