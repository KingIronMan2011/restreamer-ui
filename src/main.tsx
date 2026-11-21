import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import React from 'react';
import '@fontsource/dosis';
import '@fontsource/roboto';
import { createRoot } from 'react-dom/client';

import I18n from './i18n';
import theme from './lib/theme';
import Root from './Root';

let address = window.location.protocol + '//' + window.location.host;
if (window.location.pathname.endsWith('/ui/')) {
  address += window.location.pathname.replace(/ui\/$/, '');
}

const urlParams = new URLSearchParams(window.location.search.substring(1));
if (urlParams.has('address') === true) {
  address = urlParams.get('address') ?? address;
}

createRoot(document.getElementById('root')!).render(
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18n>
        <Root address={address} />
      </I18n>
    </ThemeProvider>
  </StyledEngineProvider>,
);
