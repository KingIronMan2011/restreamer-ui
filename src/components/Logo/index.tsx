import Box from '@mui/material/Box';
import React from 'react';

import company_logo from './images/logo.svg';

const useStyles = () => {
  return {
    Logo: {
      height: 27,
    },
  };
};

export default function Logo(props: any) {
  const classes = useStyles();

  let link = 'https://datarhei.com';

  // eslint-disable-next-line no-useless-escape
  return (
    <Box
      component="a"
      href={link}
      sx={classes.Logo}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={company_logo} alt="datarhei logo" />
    </Box>
  );
}
