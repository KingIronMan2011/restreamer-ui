import { Trans } from '@lingui/react/macro';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

import Paper from '../../../components/Paper';
import PaperHeader from '../../../components/PaperHeader';
import Select from '../../../components/Select';

export default function VideoProfile({
  onAbort = () => {},
  onHelp = () => {},
  onBack = () => {},
  onNext = () => {},
  compatible = false,
  onStreamChange = () => {},
  streamList = [],
  stream = 0,
  onDecoderChange = () => {},
  decodersList = [],
  decoder = '',
  onEncoderChange = () => {},
  encodersList = [],
  encoder = '',
}: any) {
  return (
    <Paper xs={12} sm={9} md={6} marginBottom="6em" className="PaperM">
      <PaperHeader
        spacing={2}
        variant="h1"
        title={<Trans>Video setup</Trans>}
        onAbort={onAbort}
        onHelp={onHelp}
      />
      <Grid container spacing={2}>
        <Grid size={12}>
          <Divider />
        </Grid>
        <Grid size={12}>
          <Typography>
            <Trans>
              The video source is compatible. Select the desired resolution:
            </Trans>
          </Typography>
        </Grid>
        <Grid size={12}>
          <Select
            label={<Trans>Profile</Trans>}
            value={stream}
            onChange={onStreamChange}
          >
            {streamList}
          </Select>
        </Grid>
        {compatible === false && (
          <React.Fragment>
            {encodersList.length === 0 ? (
              <Grid size={12}>
                <Typography>
                  <Trans>
                    Your stream needs to be encoded, but there's no suitable
                    encoder available.
                  </Trans>
                </Typography>
              </Grid>
            ) : (
              <React.Fragment>
                <Grid size={12}>
                  <Typography>
                    <Trans>
                      Your stream needs to be encoded. Choose the desired
                      encoder:
                    </Trans>
                  </Typography>
                </Grid>
                {decodersList.length >= 2 && (
                  <Grid size={12}>
                    <Select
                      label={<Trans>Decoder</Trans>}
                      value={decoder}
                      onChange={onDecoderChange}
                    >
                      {decodersList}
                    </Select>
                  </Grid>
                )}
                <Grid size={12}>
                  <Select
                    label={<Trans>Encoder</Trans>}
                    value={encoder}
                    onChange={onEncoderChange}
                  >
                    {encodersList}
                  </Select>
                </Grid>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        <Grid size={12}>
          <Divider />
        </Grid>
        <Grid size={3}>
          <Button variant="outlined" color="default" fullWidth onClick={onBack}>
            <Trans>Back</Trans>
          </Button>
        </Grid>
        <Grid size={9}>
          <Button
            variant="outlined"
            fullWidth
            color="primary"
            disabled={compatible === false && encodersList.length === 0}
            onClick={onNext}
          >
            <Trans>Next</Trans>
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
