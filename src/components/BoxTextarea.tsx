import Stack from '@mui/material/Stack';
import React from 'react';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  box: {
    backgroundColor: theme.palette.background.modalbox,
    borderRadius: 4,
    padding: '0em 1em 0em 1em',
    width: '100%',
  },
}));

export default function Component({
  style = null,
  children = null as import('react').ReactNode,
}: any) {
  const { classes } = useStyles();

  return (
    <Stack
      direction="column"
      spacing={1}
      className={classes.box}
      style={style}
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {children}
    </Stack>
  );
}
