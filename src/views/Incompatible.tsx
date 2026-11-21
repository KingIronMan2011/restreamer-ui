import { Trans } from '@lingui/macro';
import React from 'react';

import Paper from '../components/Paper';
import PaperContent from '../components/PaperContent';
import PaperHeader from '../components/PaperHeader';

export default function Incompatible({ type = '', have = '', want = '' }: any) {
  let text = <Trans>This version of the UI is compatible.</Trans>;

  if (type === 'core') {
    text = (
      <Trans>
        This version of the UI doesn't support the connected Core ({have}). The
        UI requires {want}. Please use a compatible version of the UI.
      </Trans>
    );
  } else if (type === 'ffmpeg') {
    text = (
      <Trans>
        This version of the UI doesn't support the available FFmpeg binary (
        {have}). The UI requires {want}. Please use a supported FFmpeg binary.
      </Trans>
    );
  }

  return (
    <Paper xs={8} sm={6} md={6} className="PaperM">
      <PaperHeader title={<Trans>Error</Trans>} />
      <PaperContent>{text}</PaperContent>
    </Paper>
  );
}
