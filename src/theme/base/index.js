import { createTheme } from '@mui/material/styles';

import breakpoints from './breakpoints';
import palette from './palette';
import shape from './shape';
import typography from './typography';

const theme = createTheme({
  breakpoints: { ...breakpoints },
  palette: { ...palette },
  typography: { ...typography },
  shape: { ...shape },
});

export default theme;
