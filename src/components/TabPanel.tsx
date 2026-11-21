import Box from '@mui/material/Box';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 0,
  },
  '& .MuiBox-root': {
    padding: 0,
  },
}));

export default function TabPanel({
  children = null as import('react').ReactNode,
  value = '',
  index = '',
}: any) {
  const classes = useStyles();

  return (
    <div
      className={classes.root}
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
    >
      {value === index && (
        <Box className={classes.root} p={0}>
          {children}
        </Box>
      )}
    </div>
  );
}
