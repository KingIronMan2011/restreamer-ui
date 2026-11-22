import Grid from '@mui/material/Grid';
import React from 'react';

const Component = function ({
  spacing = 3,
  textAlign = 'left',
  children = null as import('react').ReactNode,
}: any) {
  return (
    <Grid
      container
      spacing={spacing}
      sx={{
        justifyContent: 'center',
        textAlign: textAlign,
      }}
    >
      <Grid size={12}>{children}</Grid>
    </Grid>
  );
};

export default Component;
