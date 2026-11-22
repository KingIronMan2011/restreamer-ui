import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import React from 'react';

const useStyles = () => {
  const theme = useTheme();
  return {
    box: {
      backgroundColor: theme.palette.background.modalbox,
      borderRadius: 4,
      padding: '0em 1em 0em 1em',
      width: '100%',
    },
  };
};

export default function Component({
  style = null,
  children = null as import('react').ReactNode,
}: any) {
  const classes = useStyles();

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={[
        classes.box,
        {
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      {children}
    </Stack>
  );
}
