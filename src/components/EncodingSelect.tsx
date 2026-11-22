import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import React from 'react';

import H from '../utils/help';
import * as Decoders from './coders/Decoders';
import * as Encoders from './coders/Encoders';
import Select from './Select';

export default function EncodingSelect({
  type = '',
  streams = [],
  profile = {},
  codecs = [],
  skills = {},
  onChange = function (encoder: any, decoder: any, automatic: any) {},
}: any) {
  const { i18n } = useLingui();

  let availableEncoders: any[] = [];
  let availableDecoders: any[] = [];

  if (type === 'video') {
    availableEncoders = skills.encoders.video;
    availableDecoders = skills.decoders.video;
  } else if (type === 'audio') {
    availableEncoders = skills.encoders.audio;
  }

  const handleDecoderChange = (event: any) => {
    const decoder = profile.decoder;
    const stream = streams[profile.stream];
    decoder.coder = event.target.value;

    // If the coder changes, use the coder's default settings
    let c = null;
    if (type === 'audio') {
      c = Decoders.Audio.Get(decoder.coder);
    } else if (type === 'video') {
      c = Decoders.Video.Get(decoder.coder);
    }

    if (c !== null) {
      const defaults = c.defaults(stream, skills);
      decoder.settings = defaults.settings;
      decoder.mapping = defaults.mapping;
    }

    onChange(profile.encoder, decoder, false);
  };

  const handleDecoderSettingsChange = (
    settings: any,
    mapping: any,
    automatic: any,
  ) => {
    const decoder = profile.decoder;

    decoder.settings = settings;
    decoder.mapping = mapping;

    onChange(profile.encoder, decoder, automatic);
  };

  const handleEncoderChange = (event: any) => {
    const encoder = profile.encoder;
    const stream = streams[profile.stream];
    encoder.coder = event.target.value;

    // If the coder changes, use the coder's default settings
    let c = null;
    if (type === 'audio') {
      c = Encoders.Audio.Get(encoder.coder);
    } else if (type === 'video') {
      c = Encoders.Video.Get(encoder.coder);
    }

    if (c !== null) {
      const defaults = c.defaults(stream, skills);
      encoder.settings = defaults.settings;
      encoder.mapping = defaults.mapping;
    }

    onChange(encoder, profile.decoder, false);
  };

  const handleEncoderSettingsChange = (
    settings: any,
    mapping: any,
    automatic: any,
  ) => {
    const encoder = profile.encoder;

    encoder.settings = settings;
    encoder.mapping = mapping;

    onChange(encoder, profile.decoder, automatic);
  };

  const handleEncoderHelp = (topic: any) => (event: any) => {
    event.preventDefault();
    H('encoder-' + topic);
  };

  let stream = null;

  if (profile.stream >= 0) {
    if (profile.stream < streams.length) {
      stream = streams[profile.stream];
    }
  }

  if (stream === null) {
    return null;
  }

  if (stream.type !== type) {
    return null;
  }

  let allowCopy = codecs.includes(stream.codec);
  let encoderRegistry = null;
  let decoderRegistry = null;

  if (type === 'video') {
    encoderRegistry = Encoders.Video;
    decoderRegistry = Decoders.Video;
  } else if (type === 'audio') {
    encoderRegistry = Encoders.Audio;
    decoderRegistry = Decoders.Audio;
  } else {
    return null;
  }

  let encoderSettings = null;
  let encoderSettingsHelp = null;

  let coder = encoderRegistry.Get(profile.encoder.coder);
  if (coder !== null && availableEncoders.includes(coder.coder)) {
    const Settings = coder.component;

    encoderSettings = (
      <Settings
        stream={stream}
        settings={profile.encoder.settings}
        skills={skills}
        onChange={handleEncoderSettingsChange}
      />
    );

    if (
      type === 'video' &&
      !['copy', 'none', 'rawvideo'].includes(coder.coder)
    ) {
      encoderSettingsHelp = handleEncoderHelp(coder.coder);
    }
  }

  let encoderList: any[] = [];

  for (let c of encoderRegistry.List()) {
    // Does ffmpeg support the coder?
    if (!availableEncoders.includes(c.coder)) {
      continue;
    }

    // Is the encoder in the list of codec we allow as target?
    if (!codecs.includes(c.codec)) {
      continue;
    }

    if (c.coder === 'copy') {
      if (allowCopy === true) {
        encoderList.push(
          <MenuItem value={c.coder} key={c.coder}>
            {c.name}
          </MenuItem>,
        );
      }
    } else {
      encoderList.push(
        <MenuItem value={c.coder} key={c.coder}>
          {c.name}
        </MenuItem>,
      );
    }
  }

  if (encoderSettings === null || encoderList.length === 0) {
    return (
      <Grid container spacing={2}>
        <Grid size={12}>
          <Typography>
            <Trans>No suitable encoder found.</Trans>
          </Typography>
        </Grid>
      </Grid>
    );
  }

  let decoderSettings = null;
  let decoderList: any[] = [];

  if (coder.coder !== 'copy' && coder.coder !== 'none') {
    let c = decoderRegistry.Get(profile.decoder.coder);
    if (c !== null && availableDecoders.includes(c.coder)) {
      const Settings = c.component;

      decoderSettings = (
        <Settings
          stream={stream}
          settings={profile.decoder.settings}
          skills={skills}
          onChange={handleDecoderSettingsChange}
        />
      );
    }

    // List all decoders for the codec of the stream
    for (let c of decoderRegistry.GetCodersForCodec(
      stream.codec,
      availableDecoders,
      'any',
    )) {
      decoderList.push(
        <MenuItem value={c.coder} key={c.coder}>
          {c.name}
        </MenuItem>,
      );
    }
  }

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Typography>
          <Trans>Select your encoding setting:</Trans>
        </Typography>
      </Grid>
      <Grid size={12}>
        <Select
          label={<Trans>Codec</Trans>}
          value={profile.encoder.coder}
          onChange={handleEncoderChange}
        >
          <MenuItem value="none" disabled>
            {i18n._(t`Choose codec ...`)}
          </MenuItem>
          {encoderList}
        </Select>
      </Grid>
      {decoderList.length >= 2 && (
        <Grid size={12}>
          <Select
            label={<Trans>Decoder</Trans>}
            value={profile.decoder.coder}
            onChange={handleDecoderChange}
          >
            {decoderList}
          </Select>
        </Grid>
      )}
      {decoderList.length === 0 &&
        coder.coder !== 'copy' &&
        coder.coder !== 'none' && (
          <Grid size={12}>
            <Alert severity="warning">
              <Trans>No suitable decoder found for this codec.</Trans>
            </Alert>
          </Grid>
        )}
      {decoderList.length > 0 && decoderSettings !== null && (
        <Grid size={12}>{decoderSettings}</Grid>
      )}
      <Grid size={12}>{encoderSettings}</Grid>
      {encoderSettingsHelp !== null && (
        <Grid size={12}>
          <Trans>
            <Link color="secondary" href="#" onClick={encoderSettingsHelp}>
              Compatibility list
            </Link>
          </Trans>
        </Grid>
      )}
    </Grid>
  );
}
