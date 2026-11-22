import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

import BoxText from '../../components/BoxText';
import * as Coders from '../../components/coders/Encoders';
import * as Filters from '../../components/filters';
import Sources from './Sources';

export default function Summary({ type = '', sources = [], profile }: any) {
  const { i18n } = useLingui();

  let source = null;
  let stream = null;

  if (profile.source >= 0 && profile.source < sources.length) {
    source = sources[profile.source];

    if (profile.stream >= 0 && profile.stream < source.streams.length) {
      stream = source.streams[profile.stream];
    }
  }

  let name = i18n._(t`No source selected`);
  let address = '';
  let encodingSummary = i18n._(t`None`);
  let filterSummary: any[] = [];

  let showEncoding = false;

  if (source !== null && stream !== null) {
    const s = Sources.Get(source.type);
    if (s !== null) {
      name = s.name;
      address = decodeURIComponent(stream.url.replace(/^playout:/, ''));

      showEncoding = true;
    }

    let coder = null;

    if (type === 'video') {
      coder = Coders.Video.Get(profile.encoder.coder);
    } else if (type === 'audio') {
      coder = Coders.Audio.Get(profile.encoder.coder);
    }

    if (coder !== null) {
      encodingSummary = coder.summarize(profile.encoder.settings);
    }

    if (profile.encoder.coder !== 'none' && profile.encoder.coder !== 'copy') {
      if (profile.filter.graph.length !== 0) {
        let filters: any = null;

        if (type === 'video') {
          filters = Filters.Video;
        } else if (type === 'audio') {
          filters = Filters.Audio;
        }

        for (let filter of filters.List()) {
          const name = filter.filter;

          if (!(name in profile.filter.settings)) {
            continue;
          }

          if (profile.filter.settings[name].graph.length === 0) {
            continue;
          }

          filterSummary.push(
            filter.summarize(profile.filter.settings[name].settings),
          );
        }
      }
    }
  }

  return (
    <BoxText>
      <Grid container spacing={1}>
        <Grid size={12}>
          <Typography variant="subtitle2">{name}</Typography>
          <Typography variant="body1">{address}</Typography>
        </Grid>
        {showEncoding === true && (
          <React.Fragment>
            <Grid size={12}>
              <Typography variant="subtitle2">
                <Trans>Encoding</Trans>
              </Typography>
              <Typography variant="body1">{encodingSummary}</Typography>
            </Grid>
            <Grid size={12}>
              <Typography variant="subtitle2">
                <Trans>Filter</Trans>
              </Typography>
              {filterSummary.length ? (
                <Typography variant="body1">
                  {filterSummary.join(', ')}
                </Typography>
              ) : (
                <Typography variant="body1">
                  <Trans>None</Trans>
                </Typography>
              )}
            </Grid>
          </React.Fragment>
        )}
      </Grid>
    </BoxText>
  );
}
