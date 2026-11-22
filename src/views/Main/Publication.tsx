import { Trans } from '@lingui/react/macro';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonIcon from '@mui/icons-material/Person';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useNavigate } from 'react-router';
import { makeStyles } from 'tss-react/mui';

import Number from '../../components/Number';
import Paper from '../../components/Paper';
import PaperHeader from '../../components/PaperHeader';
import useInterval from '../../hooks/useInterval';
import H from '../../utils/help';
import Services from '../Publication/Services';
import Egress from './Egress';

const useStyles = makeStyles()((theme) => ({
  viewerCount: {
    fontSize: '3.5rem',
    fontWeight: 600,
  },
  vierwerDescription: {
    marginTop: '-1em',
  },
  vierwerTypo: {
    fontSize: '1.1rem',
  },
  bandwidth: {
    marginBottom: '.3em',
  },
  bandwidthCount: {
    fontSize: '2.5rem',
    fontWeight: 600,
  },
  bandwidthDescription: {
    marginTop: '-.5em',
  },
  bandwidthIcon: {
    fontSize: '1.7rem',
    paddingRight: 7,
  },
}));

export default function Publication({ channelid = '', restreamer }: any) {
  const { classes } = useStyles();

  const navigate = useNavigate();
  const services = Services.IDs();
  const [$egresses, setEgresses] = React.useState<Record<string, any>[]>([]);
  const [$session, setSession] = React.useState<Record<string, any>>({
    viewer: 0,
    bandwidth: 0,
  });

  useInterval(async () => {
    await update();
  }, 1000);

  useInterval(async () => {
    await sessions();
  }, 1000);

  React.useEffect(() => {
    (async () => {
      await update();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async () => {
    const egresses: any[] = [];

    const processes = await restreamer.ListIngestEgresses(channelid, services);

    for (let p of processes) {
      egresses.push({
        id: p.id,
        name: p.name,
        service: p.service,
        index: p.index,
        progress: p.progress,
      });
    }

    setEgresses(egresses);
  };

  const sessions = async () => {
    const current = await restreamer.CurrentSessions([
      'ffmpeg',
      'hls',
      'rtmp',
      'srt',
    ]);

    setSession({
      viewer: current.sessions,
      bandwidth: current.bitrate_kbit,
    });
  };

  const handleServiceAdd = (event: any) => {
    event.preventDefault();

    navigate(`/${channelid}/publication/`);
  };

  const handleServiceEdit = (service: any, index: any) => () => {
    let target = `/${channelid}/publication/${service}`;

    if (service !== 'player') {
      target = target + '/' + index;
    }

    navigate(target);
  };

  const handleOrderChange = (id: any) => async (order: any) => {
    let res = false;

    if (order === 'start') {
      res = await restreamer.StartEgress(channelid, id);
    } else if (order === 'restart') {
      res = await restreamer.StopEgress(channelid, id);
      if (res === true) {
        res = await restreamer.StartEgress(channelid, id);
      }
    } else if (order === 'stop') {
      res = await restreamer.StopEgress(channelid, id);
    }

    return res;
  };

  const handleHelp = () => {
    H('publication');
  };

  let egresses: any[] = [];

  for (let e of $egresses.values()) {
    egresses.push(
      <React.Fragment key={e.id}>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <Egress
            service={e.service}
            name={e.name}
            state={e.progress.state}
            order={e.progress.order}
            reconnect={e.progress.reconnect !== -1}
            onEdit={handleServiceEdit(e.service, e.index)}
            onOrder={handleOrderChange(e.id)}
          />
        </Grid>
      </React.Fragment>,
    );
  }

  return (
    <React.Fragment>
      <Paper marginBottom="0">
        <PaperHeader
          title={<Trans>Publications</Trans>}
          onAdd={handleServiceAdd}
          onHelp={handleHelp}
        />
        <Grid container spacing={1}>
          <Grid
            item
            xs={12}
            sx={{
              textAlign: 'center',
            }}
          >
            <Divider />
            <Typography component="div" className={classes.viewerCount}>
              <Number value={$session.viewer} />
            </Typography>
            <Grid
              container
              direction="row"
              className={classes.vierwerDescription}
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <PersonIcon fontSize="small" />
              <Typography className={classes.vierwerTypo}>
                <Trans>Viewer</Trans>
              </Typography>
            </Grid>
          </Grid>
          <Grid
            item
            xs={12}
            className={classes.bandwidth}
            sx={{
              textAlign: 'center',
            }}
          >
            <Typography component="div" className={classes.bandwidthCount}>
              <Number value={$session.bandwidth} />
            </Typography>
            <Grid
              container
              direction="row"
              className={classes.bandwidthDescription}
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CloudUploadIcon className={classes.bandwidthIcon} />
              <Typography>
                <Trans>kbit/s</Trans>
              </Typography>
            </Grid>
          </Grid>
          {egresses}
        </Grid>
      </Paper>
    </React.Fragment>
  );
}
