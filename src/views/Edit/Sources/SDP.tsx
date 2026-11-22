import { Trans } from '@lingui/react/macro';
import Icon from '@mui/icons-material/VideoFile';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import Filesize from '../../../components/Filesize';
import FormInlineButton from '../../../components/FormInlineButton';
import Dialog from '../../../components/modals/Dialog';
import UploadButton from '../../../components/UploadButton';

const fileTypes = [
  {
    mimetype: 'application/sdp',
    extension: '*.sdp',
    maxSize: 2 * 1024 * 1024,
  },
];

const useStyles = () => {
  return {
    gridContainer: {
      marginTop: '0.5em',
    },
  };
};

const initSettings = (initialSettings: any) => {
  if (!initialSettings) {
    initialSettings = {};
  }

  const settings = {
    address: '',
    mimetype: '',
    ...initialSettings,
  };

  return settings;
};

const createInputs = (settings: any) => {
  const address = '{diskfs}' + settings.address;
  const input = {
    address: address,
    options: [] as string[],
  };

  input.options.push('-protocol_whitelist', 'file,udp,rtp');
  input.options.push('-buffer_size', '671088640');
  input.options.push('-thread_queue_size', '4096');

  return [input];
};

const getUploadErrorMessage = (err: any) => {
  switch (err.type) {
    case 'nofiles':
      return <Trans>Please select a file to upload.</Trans>;
    case 'mimetype':
      return (
        <Trans>
          The selected file type ({err.actual}) is not allowed. Allowed file
          types are {err.allowed.join(', ')}
        </Trans>
      );
    case 'size':
      return (
        <Trans>
          The selected file is too big (
          <Filesize bytes={err.actual} />
          ). Only <Filesize bytes={err.allowed} /> are allowed.
        </Trans>
      );
    case 'read':
      return <Trans>There was an error during upload: {err.message}</Trans>;
    default:
      return <Trans>Unknown upload error</Trans>;
  }
};

function Source({
  knownDevices = [],
  settings = {},
  onChange = function (settings: any) {},
  onProbe = function (settings: any, inputs: any) {},
  onStore = async function (name: any, data: any) {
    return '';
  },
}: any) {
  const classes = useStyles();
  settings = initSettings(settings);

  const [$saving, setSaving] = React.useState(false);
  const [$error, setError] = React.useState<Record<string, any>>({
    open: false,
    title: '',
    message: '',
  });

  const handleFileUpload = async (data: any, extension: any, mimetype: any) => {
    const path = await onStore('input.sdp', data);

    onChange({
      ...settings,
      address: path,
      mimetype: mimetype,
    });

    setSaving(false);
  };

  const handleUploadStart = () => {
    setSaving(true);
  };

  const handleUploadError = (title: any) => (err: any) => {
    setSaving(false);

    showUploadError(title, getUploadErrorMessage(err));
  };

  const showUploadError = (title: any, message: any) => {
    setError({
      ...$error,
      open: true,
      title: title,
      message: message,
    });
  };

  const hideUploadError = () => {
    setError({
      ...$error,
      open: false,
    });
  };

  const handleProbe = () => {
    onProbe(settings, createInputs(settings));
  };

  return (
    <React.Fragment>
      <Grid
        container
        spacing={2}
        sx={[
          classes.gridContainer,
          {
            alignItems: 'flex-start',
          },
        ]}
      >
        <Grid size={12}>
          <Typography variant="caption">
            <Trans>
              Upload SDP file ({fileTypes.map((t) => t.mimetype).join(', ')}).
            </Trans>
          </Typography>
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 9,
          }}
        >
          <TextField
            variant="outlined"
            fullWidth
            label={<Trans>File path</Trans>}
            value={settings.address}
            readOnly
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 3,
          }}
        >
          <UploadButton
            label={<Trans>Upload</Trans>}
            acceptTypes={fileTypes}
            onStart={handleUploadStart}
            onError={handleUploadError(
              <Trans>Uploading the file failed</Trans>,
            )}
            onUpload={handleFileUpload}
          />
        </Grid>
        <Grid size={12}>
          <FormInlineButton
            onClick={handleProbe}
            disabled={!settings.address.length}
          >
            <Trans>Probe</Trans>
          </FormInlineButton>
        </Grid>
      </Grid>
      <Backdrop open={$saving}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Dialog
        open={$error.open}
        title={$error.title}
        onClose={hideUploadError}
        buttonsRight={
          <Button variant="outlined" color="primary" onClick={hideUploadError}>
            <Trans>OK</Trans>
          </Button>
        }
      >
        <Typography variant="body1">{$error.message}</Typography>
      </Dialog>
    </React.Fragment>
  );
}

function SourceIcon(props: any) {
  return <Icon style={{ color: '#FFF' }} {...props} />;
}

const id = 'sdp';
const name = <Trans>SDP</Trans>;
const capabilities = ['video', 'audio'];
const ffversion = '^4.1.0 || ^5.0.0 || ^6.1.0 || ^7.0.0 || ^8.1.0 || ^9.0.0';

const func = {
  initSettings,
  createInputs,
};

export {
  id,
  name,
  capabilities,
  ffversion,
  SourceIcon as icon,
  Source as component,
  func,
  getUploadErrorMessage,
};
