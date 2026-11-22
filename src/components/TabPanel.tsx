import Box from '@mui/material/Box';
import React from 'react';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
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
  const { classes } = useStyles();

  return (
    <div
      className={classes.root}
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
    >
      {value === index && (
        <Box
          className={classes.root}
          sx={{
            p: 0,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}
