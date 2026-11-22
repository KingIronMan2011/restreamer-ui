import Box from '@mui/material/Box';
import React from 'react';

const useStyles = () => {
  return {
    root: {
      padding: 0,
    },
    '& .MuiBox-root': {
      padding: 0,
    },
  };
};

export default function TabPanel({
  children = null as import('react').ReactNode,
  value = '',
  index = '',
}: any) {
  const classes = useStyles();

  return (
    <Box
      component="div"
      sx={classes.root}
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
    >
      {value === index && (
        <Box
          sx={[
            classes.root,
            {
              p: 0,
            },
          ]}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
