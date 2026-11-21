import { Trans } from '@lingui/macro';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React from 'react';

import Paper from '../components/Paper';
import PaperContent from '../components/PaperContent';
import PaperFooter from '../components/PaperFooter';
import PaperHeader from '../components/PaperHeader';

const isProbablyMixedContent = (address: any) => {
  try {
    const location = new URL(address);
    if (
      window.location.protocol === 'https:' &&
      location.protocol === 'http:'
    ) {
      return true;
    }
  } catch (e) {}

  return false;
};

export default function Invalid({ address = '' }: any) {
  const [$mixed] = React.useState(isProbablyMixedContent(address));

  return (
    <Paper xs={8} sm={6} md={6} className="PaperM">
      <PaperHeader
        title={<Trans>Error</Trans>}
        onAbort={() => window.location.reload()}
      />
      <PaperContent>
        <Typography>
          <Trans>
            There was an error connecting to Restreamer Core at {address}.
          </Trans>
        </Typography>
        {$mixed === true && (
          <Typography sx={{ mt: '1em' }}>
            <Trans>
              Connecting to Restreamer Core failed probably because of mixed
              content.
            </Trans>
          </Typography>
        )}
      </PaperContent>
      <PaperFooter
        buttonsRight={
          <Button
            variant="outlined"
            color="primary"
            onClick={() => window.location.reload()}
          >
            <Trans>Retry</Trans>
          </Button>
        }
      />
    </Paper>
  );
}
