import Box from '@mui/material/Box';
import React from 'react';

import company_logo from './images/rs-logo.svg';

const useStyles = () => {
  return {
    Logo: {
      height: 95,
    },
  };
};

export default function Logo(props: any) {
  const classes = useStyles();

  let link = 'https://github.com/datarhei/restreamer';

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
