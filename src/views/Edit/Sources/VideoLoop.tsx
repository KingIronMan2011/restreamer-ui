import { Trans } from '@lingui/react/macro';
import Icon from '@mui/icons-material/Cached';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Grid from '@mui/material/GridLegacy';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React from 'react';

import CircularProgress from '../../../components/CircularProgress';
import Filesize from '../../../components/Filesize';
import FormInlineButton from '../../../components/FormInlineButton';
import Dialog from '../../../components/modals/Dialog';
import UploadButton from '../../../components/UploadButton';

const imageTypes = [
  { mimetype: 'image/*', extension: 'image', maxSize: 0 },
  { mimetype: 'video/*', extension: 'video', maxSize: 0 },
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

  if (settings.mimetype.startsWith('image/')) {
    input.options.push('-framerate', '1');
    input.options.push('-loop', '1');
  } else {
    input.options.push('-stream_loop', '-1');
  }
  input.options.push('-re');

  return [input];
};

function Source({
  knownDevices = [],
  settings = {},
  onChange = function (settings: any) {},
  onProbe = function (settings: any, inputs: any) {},
  onRefresh = function () {},
  onStore = function (name: any, data: any) {
    return '';
  },
}: any) {
  const classes = useStyles();
  settings = initSettings(settings);

  const [$progress, setProgress] = React.useState<Record<string, any>>({
    enable: false,
    value: -1,
  });
  const [$error, setError] = React.useState<Record<string, any>>({
    open: false,
    title: '',
    message: '',
  });

  const handleFileUpload = async (data: any, extension: any, mimetype: any) => {
    const path = await onStore(
      'videoloop.source',
      data,
      (computable: any, progress: any, total: any) => {
        setProgress((current) => {
          return {
            ...current,
            enable: true,
            value: computable ? progress * 100 : -1,
          };
        });
      },
    );

    onChange({
      ...settings,
      address: path,
      mimetype: mimetype,
    });

    setProgress({
      ...$progress,
      enable: false,
    });
  };

  const handleUploadStart = () => {
    setProgress({
      ...$progress,
      enable: true,
    });
  };

  const handleUploadError = (title: any) => (err: any) => {
    let message = null;

    switch (err.type) {
      case 'nofiles':
        message = <Trans>Please select a file to upload.</Trans>;
        break;
      case 'mimetype':
        message = (
          <Trans>
            The selected file type ({err.actual}) is not allowed. Allowed file
            types are {err.allowed.join(', ')}
          </Trans>
        );
        break;
      case 'size':
        message = (
          <Trans>
            The selected file is too big (
            <Filesize bytes={err.actual} />
            ). Only <Filesize bytes={err.allowed} /> are allowed.
          </Trans>
        );
        break;
      case 'read':
        message = (
          <Trans>There was an error during upload: {err.message}</Trans>
        );
        break;
      default:
        message = <Trans>Unknown upload error</Trans>;
    }

    setProgress({
      ...$progress,
      enable: false,
    });

    showUploadError(title, message);
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
        <Grid item xs={12}>
          <Typography variant="caption">
            <Trans>
              Upload an image or video file (
              {imageTypes.map((t) => t.mimetype).join(', ')}) in order to loop
              it.
            </Trans>
          </Typography>
        </Grid>
        <Grid item xs={12} md={9}>
          <TextField
            variant="outlined"
            fullWidth
            label={<Trans>File path</Trans>}
            value={settings.address}
            readOnly
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <UploadButton
            label={<Trans>Upload</Trans>}
            acceptTypes={imageTypes}
            onStart={handleUploadStart}
            onError={handleUploadError(
              <Trans>Uploading the file failed</Trans>,
            )}
            onUpload={handleFileUpload}
          />
        </Grid>
        <Grid item xs={12}>
          <FormInlineButton
            onClick={handleProbe}
            disabled={!settings.address.length}
          >
            <Trans>Probe</Trans>
          </FormInlineButton>
        </Grid>
      </Grid>
      <Backdrop open={$progress.enable}>
        <CircularProgress color="inherit" value={$progress.value} />
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

const id = 'videoloop';
const name = <Trans>Loop</Trans>;
const capabilities = ['video'];
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
};
