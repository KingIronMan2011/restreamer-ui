import { Trans } from '@lingui/react/macro';
import Grid from '@mui/material/Grid';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import React from 'react';

import TabPanel from '../TabPanel';
import TabsHorizontal from '../TabsHorizontal';

const useStyles = () => {
  return {
    root: {
      '& .MuiOutlinedInput-input': {
        whiteSpace: 'pre-line',
      },
    },
  };
};

function init(settings: any) {
  const initSettings = {
    name: 'Livestream',
    description: 'Live from earth. Powered by datarhei Restreamer.',
    author: {},
    ...settings,
  };

  initSettings.author = {
    name: '',
    description: '',
    ...initSettings.author,
  };

  return initSettings;
}

export default function Control({
  settings = {},
  onChange = function (metadata: any) {},
}: any) {
  const classes = useStyles();
  const [$tab, setTab] = React.useState('content');
  settings = init(settings);

  // Set the defaults
  React.useEffect(() => {
    onChange(settings, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (what: any) => (event: any) => {
    const value = event.target.value;

    if (what === 'author.name') {
      settings.author.name = value;
    } else if (what === 'author.description') {
      settings.author.description = value;
    } else {
      settings[what] = value;
    }

    onChange(settings, false);
  };

  const handleChangeTab = (event: any, value: any) => {
    setTab(value);
  };

  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <TabsHorizontal value={$tab} onChange={handleChangeTab}>
          <Tab className="tab" label={<Trans>Content</Trans>} value="content" />
          <Tab className="tab" label={<Trans>Author</Trans>} value="author" />
        </TabsHorizontal>
        <TabPanel value={$tab} index="content">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                fullWidth
                label={<Trans>Name</Trans>}
                value={settings.name}
                onChange={handleChange('name')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={classes.root}
                variant="outlined"
                fullWidth
                multiline
                rows={10}
                label={<Trans>Description</Trans>}
                value={settings.description}
                onChange={handleChange('description')}
              />
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={$tab} index="author">
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                fullWidth
                label={<Trans>Name</Trans>}
                value={settings.author.name}
                onChange={handleChange('author.name')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={classes.root}
                variant="outlined"
                fullWidth
                multiline
                rows={10}
                label={<Trans>Description</Trans>}
                value={settings.author.description}
                onChange={handleChange('author.description')}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Grid>
    </Grid>
  );
}
