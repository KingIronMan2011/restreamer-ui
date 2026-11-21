import Box from '@mui/material/Box';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';
import React from 'react';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 0,
  },
  '& .MuiBox-root': {
    padding: 0,
  },
}));

export default function TabPanel({ children = null, value = '', index = '' }) {
  const classes = useStyles();

  return (
    <div
      className={classes.root}
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
    >
      {value === index && (
        <Box classes={{ root: classes }} p={0}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};
