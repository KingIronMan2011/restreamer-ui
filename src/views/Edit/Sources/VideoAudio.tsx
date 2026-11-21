import { Trans } from '@lingui/macro';
import Icon from '@mui/icons-material/Movie';
import React from 'react';

// This is a pseudo audio source for selecting the audio streams from the video source

const initSettings = (initialSettings: any) => {
  if (!initialSettings) {
    initialSettings = {};
  }

  const settings = {
    ...initialSettings,
  };

  return settings;
};

const createInputs = (settings: any) => {
  const input = {
    address: '',
    options: [] as string[],
  };

  return [input];
};

function Source({
  knownDevices = [],
  settings = {},
  onChange = function (settings: any) {},
  onProbe = function (settings: any, inputs: any) {},
}: any) {
  return null;
}

function SourceIcon(props: any) {
  return <Icon {...props} />;
}

const id = 'videoaudio';
const name = <Trans>Video source</Trans>;
const capabilities = ['audio'];
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
