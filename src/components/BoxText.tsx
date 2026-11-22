import Stack from '@mui/material/Stack';
import React from 'react';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  light: {
    backgroundColor: theme.palette.background.light1,
    borderRadius: 5,
    padding: '10px 15px 10px 15px!important',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  dark: {
    backgroundColor: theme.palette.background.dark2,
    borderRadius: 5,
    padding: '10px 15px 10px 15px!important',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  success: {
    color: theme.palette.background.paper,
    fontWeight: 500,
    backgroundColor: theme.palette.secondary.main,
    borderRadius: 5,
    padding: '10px 15px 10px 15px!important',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  danger: {
    backgroundColor: theme.palette.error.main,
    textAlign: 'center',
    borderRadius: 4,
    padding: '.5em .5em .3em .5em',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
}));

export default function Component({
  color = 'light',
  textAlign = 'left',
  alignItems = 'center',
  justifyContent = 'center',
  style = null,
  children = null as import('react').ReactNode,
}: any) {
  const { classes } = useStyles();

  return (
    <Stack
      direction="column"
      spacing={1}
      className={
        color === 'dark'
          ? classes.dark
          : color === 'success'
            ? classes.success
            : color === 'danger'
              ? classes.danger
              : classes.light
      }
      style={style}
      sx={{
        justifyContent: justifyContent,
        alignItems: alignItems,
        textAlign: textAlign,
      }}
    >
      {children}
    </Stack>
  );
}
