import React from 'react';
import { makeStyles } from 'tss-react/mui';

import company_logo from './images/logo.svg';

const useStyles = makeStyles()((theme) => ({
  Logo: {
    height: 27,
  },
}));

export default function Logo(props: any) {
  const { classes } = useStyles();

  let link = 'https://datarhei.com';

  // eslint-disable-next-line no-useless-escape
  return (
    <a
      href={link}
      className={classes.Logo}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={company_logo} alt="datarhei logo" />
    </a>
  );
}
