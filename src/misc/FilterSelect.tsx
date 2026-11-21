import { Trans } from '@lingui/macro';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';

// Import all encoders (audio/video)
import * as Encoders from './coders/Encoders';
// Import all filters (audio/video)
import * as Filters from './filters';

export default function FilterSelect({
  type = '',
  profile = {},
  availableFilters = [],
  onChange = function (filter: any, automatic: any) {},
}: any) {
  // handleFilterChange
  // what: Filter name
  // settings (component settings):  {Key: Value}
  // mapping (FFmpeg -af/-vf args): ['String', ...]
  const handleFilterSettingsChange =
    (what: any) => (settings: any, graph: any, automatic: any) => {
      const filter = profile.filter;

      // Store mapping/settings per component
      filter.settings[what] = {
        settings: settings,
        graph: graph,
      };

      // Get the order of the filters
      let filterOrder: any[] = [];
      if (type === 'video') {
        filterOrder = Filters.Video.Filters();
      } else {
        filterOrder = Filters.Audio.Filters();
      }

      // Create the filter graph in the order as the filters are registered
      const graphs: any[] = [];
      for (let f of filterOrder) {
        if (!(f in filter.settings)) {
          continue;
        }

        if (filter.settings[f].graph.length !== 0) {
          graphs.push(filter.settings[f].graph);
        }
      }

      filter.graph = graphs.join(',');

      onChange(filter, automatic);
    };

  // Set filterRegistry by type
  let filterRegistry = null;
  if (type === 'video') {
    filterRegistry = Filters.Video;
  } else if (type === 'audio') {
    filterRegistry = Filters.Audio;
  } else {
    return null;
  }

  // Checks the state of hwaccel (gpu encoding)
  let encoderRegistry = null;
  let hwaccel = false;
  if (type === 'video') {
    encoderRegistry = Encoders.Video;
    for (let encoder of encoderRegistry.List()) {
      if (encoder.codec === profile.encoder.coder && encoder.hwaccel) {
        hwaccel = true;
      }
    }
  }

  // Creates filter components
  let filterSettings: any[] = [];
  if (!hwaccel) {
    for (let c of filterRegistry.List()) {
      // Checks FFmpeg skills (filter is available)
      if (availableFilters.includes(c.filter)) {
        const Settings = c.component;

        if (!(c.filter in profile.filter.settings)) {
          profile.filter.settings[c.filter] = c.defaults();
        } else {
          profile.filter.settings[c.filter] = {
            ...c.defaults(),
            ...profile.filter.settings[c.filter],
          };
        }

        filterSettings.push(
          <Settings
            key={c.filter}
            settings={profile.filter.settings[c.filter].settings}
            onChange={handleFilterSettingsChange(c.filter)}
          />,
        );
      }
    }
  }

  // No suitable filter found
  if (filterSettings === null && !hwaccel) {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography>
            <Trans>No suitable filter found.</Trans>
          </Typography>
        </Grid>
      </Grid>
    );

    // hwaccel requires further settings
  } else if (hwaccel) {
    return false;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography>
          <Trans>Select your filter settings (optional):</Trans>
        </Typography>
      </Grid>
      {filterSettings}
    </Grid>
  );
}
