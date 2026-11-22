import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import React from 'react';

const useStyles = () => {
  const theme = useTheme();
  return {
    box: {
      borderBottom: `2px solid ${theme.palette.background.light1}`,
      padding: '0em',
      marginBottom: '1em',
      marginTop: '-1.7em',
    },
    tabs: {
      '& .tab': {
        minWidth: '0px',
        margin: 'unset',
        color: theme.palette.text.primary,
        borderRadius: '4px 4px 0px 0px',
      },
      '@media (max-width: 415px)': {
        '& .tab': {
          padding: '10px 6px!important',
        },
      },
    },
  };
};

export default function Component({
  value = '',
  children = null as import('react').ReactNode,
  onChange = function (event: any) {},
}: any) {
  const classes = useStyles();

  return (
    <Box sx={classes.box}>
      <Tabs
        sx={classes.tabs}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        value={value}
        onChange={onChange}
      >
        {children}
      </Tabs>
    </Box>
  );
}
