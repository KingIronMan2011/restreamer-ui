import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function client() {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  const restreamer = new Restreamer('https://core.example');
  restreamer.channels.set('channel', {
    id: 'restreamer-ui:ingest:channel',
    channelid: 'channel',
    name: 'Channel',
    egresses: new Map(),
    available: true,
  });
  restreamer.SelectChannel('channel');
  return restreamer;
}

afterEach(() => vi.restoreAllMocks());

describe('Restreamer ingest and session methods', () => {
  it('counts active sessions while excluding other channels, idle sessions, and ffmpeg viewers', async () => {
    const restreamer = client();
    restreamer._call = vi.fn().mockResolvedValueOnce([
      {
        hls: [
          { reference: 'channel', bandwidth_tx_kbit: 100 },
          { reference: 'elsewhere', bandwidth_tx_kbit: 500 },
          { reference: 'channel-idle', bandwidth_tx_kbit: 0 },
        ],
        ffmpeg: [{ reference: 'channel', bandwidth_tx_kbit: 50 }],
      },
      null,
    ]);

    await expect(
      restreamer.CurrentSessions(['hls', 'ffmpeg', 'missing']),
    ).resolves.toEqual({
      sessions: 1,
      bitrate_kbit: 150,
    });

    restreamer._call = vi.fn().mockResolvedValue([null, new Error('offline')]);
    await expect(restreamer.CurrentSessions(['hls'])).resolves.toEqual({
      sessions: 0,
      bitrate_kbit: 0,
    });
    restreamer.channels.clear();
    await expect(restreamer.CurrentSessions(['hls'])).resolves.toEqual({
      sessions: 0,
      bitrate_kbit: 0,
    });
  });

  it('reads and writes ingest details and handles unknown channel IDs', async () => {
    const restreamer = client();
    expect(restreamer.HasIngest()).toBe(true);
    restreamer.channels.get('channel')!.available = false;
    expect(restreamer.HasIngest()).toBe(false);
    restreamer.channels.clear();
    expect(restreamer.HasIngest()).toBe(false);
    (restreamer as any).channel = null;
    expect(restreamer.HasIngest()).toBe(false);

    await expect(restreamer.GetIngest('unknown')).resolves.toBeNull();
    await expect(
      restreamer.GetIngestMetadata('unknown'),
    ).resolves.toHaveProperty('meta');
    await expect(restreamer.SetIngestMetadata('unknown', {})).resolves.toBe(
      false,
    );
    await expect(restreamer.GetIngestLog('unknown')).resolves.toBeNull();
    await expect(restreamer.GetIngestDebug('unknown')).resolves.toEqual({});
    await expect(restreamer.StartIngest('unknown')).resolves.toBe(false);
    await expect(restreamer.StartIngestSnapshot('unknown')).resolves.toBe(
      false,
    );
    await expect(restreamer.StopIngest('unknown')).resolves.toBe(false);
    await expect(restreamer.StopIngestSnapshot('unknown')).resolves.toBe(false);
    await expect(restreamer.DeleteIngest('unknown')).resolves.toBe(false);
    await expect(restreamer.DeleteIngestSnapshot('unknown')).resolves.toBe(
      false,
    );

    const restreamer2 = client();
    restreamer2._getProcess = vi.fn().mockResolvedValue({ id: 'process' });
    restreamer2._getProcessMetadata = vi
      .fn()
      .mockResolvedValueOnce({ meta: { name: '' } })
      .mockResolvedValueOnce({ meta: { name: 'Existing name' } });
    restreamer2._setProcessMetadata = vi.fn().mockResolvedValue(true);
    restreamer2._getProcessLog = vi.fn().mockResolvedValue('log');
    restreamer2.GetDebug = vi.fn().mockResolvedValue({ debug: true });
    restreamer2._startProcess = vi.fn().mockResolvedValue(true);
    restreamer2._stopProcess = vi.fn().mockResolvedValue(true);
    restreamer2._deleteProcess = vi.fn().mockResolvedValue(true);

    await expect(restreamer2.GetIngest('channel', [])).resolves.toEqual({
      id: 'process',
    });
    await expect(
      restreamer2.GetIngestMetadata('channel'),
    ).resolves.toMatchObject({ meta: { name: 'Channel' } });
    await expect(
      restreamer2.GetIngestMetadata('channel'),
    ).resolves.toMatchObject({ meta: { name: 'Existing name' } });
    await expect(
      restreamer2.SetIngestMetadata('channel', { meta: { name: 'Renamed' } }),
    ).resolves.toBe(true);
    expect(restreamer2.GetChannel('channel')?.name).toBe('Renamed');
    await expect(restreamer2.GetIngestLog('channel')).resolves.toBe('log');
    await expect(restreamer2.GetIngestDebug('channel')).resolves.toEqual({
      debug: true,
    });
    await expect(restreamer2.StartIngest('channel')).resolves.toBe(true);
    await expect(restreamer2.StartIngestSnapshot('channel')).resolves.toBe(
      true,
    );
    await expect(restreamer2.StopIngest('channel')).resolves.toBe(true);
    await expect(restreamer2.StopIngestSnapshot('channel')).resolves.toBe(true);
    await expect(restreamer2.DeleteIngest('channel')).resolves.toBe(true);
    await expect(restreamer2.DeleteIngestSnapshot('channel')).resolves.toBe(
      true,
    );
    expect(restreamer2._startProcess).toHaveBeenNthCalledWith(
      2,
      'restreamer-ui:ingest:channel_snapshot',
    );
    expect(restreamer2._stopProcess).toHaveBeenNthCalledWith(
      2,
      'restreamer-ui:ingest:channel_snapshot',
    );
    expect(restreamer2._deleteProcess).toHaveBeenNthCalledWith(
      1,
      'restreamer-ui:ingest:channel',
    );
    expect(restreamer2._deleteProcess).toHaveBeenNthCalledWith(
      2,
      'restreamer-ui:ingest:channel_snapshot',
    );
  });

  it('delegates ingest progress and checks manifest files', async () => {
    const restreamer = client();
    restreamer._getProgressFromState = vi.fn((state) => state ?? 'empty');
    restreamer._getProcessState = vi
      .fn()
      .mockResolvedValue({ state: 'running' });
    await expect(restreamer.GetIngestProgress('unknown')).resolves.toBe(
      'empty',
    );
    await expect(restreamer.GetIngestProgress('channel')).resolves.toEqual({
      state: 'running',
    });
    await expect(
      restreamer.GetIngestProgress('channel', '_preview'),
    ).resolves.toEqual({ state: 'running' });
    expect(restreamer._getProcessState).toHaveBeenLastCalledWith(
      'restreamer-ui:ingest:channel_preview',
    );
    expect(restreamer._getProgressFromState).toHaveBeenCalledTimes(3);

    restreamer._call = vi
      .fn()
      .mockResolvedValueOnce([null, new Error('missing')])
      .mockResolvedValueOnce([null, null]);
    await expect(restreamer.HasIngestFiles('unknown')).resolves.toBe(false);
    await expect(restreamer.HasIngestFiles('channel')).resolves.toBe(false);
    await expect(restreamer.HasIngestFiles('channel')).resolves.toBe(true);
  });

  it('probes external and ingest streams with cleanup on success and add failures', async () => {
    const restreamer = client();
    await expect(restreamer.Probe('unknown', [])).resolves.toMatchObject([
      null,
      { message: 'Unknown channel ID' },
    ]);
    await expect(restreamer.ProbeIngest('unknown')).resolves.toMatchObject([
      null,
      { message: 'Unknown channel ID' },
    ]);

    restreamer._deleteProcess = vi.fn().mockResolvedValue(true);
    const call = vi
      .fn()
      .mockResolvedValueOnce([null, { code: 400 }])
      .mockResolvedValueOnce([null, null])
      .mockResolvedValueOnce([{ result: 'probed' }, null])
      .mockResolvedValueOnce([null, null])
      .mockResolvedValueOnce([{ result: 'ingest probed' }, null]);
    restreamer._call = call;

    const failed = await restreamer.Probe('channel', [
      { address: 'rtmp://input', options: [1, 'x'] },
    ]);
    expect(failed).toEqual([null, { code: 400 }]);
    expect(restreamer._deleteProcess).toHaveBeenCalledTimes(1);
    expect(call.mock.calls[0][1]).toMatchObject({
      input: [{ id: 'input_0', address: 'rtmp://input', options: ['1', 'x'] }],
      output: [{ id: 'output_0', address: '-' }],
    });

    await expect(restreamer.Probe('channel', [])).resolves.toEqual([
      { result: 'probed' },
      null,
    ]);
    await expect(restreamer.ProbeIngest('channel')).resolves.toEqual([
      { result: 'ingest probed' },
      null,
    ]);
    expect(restreamer._deleteProcess).toHaveBeenCalledTimes(5);

    restreamer._call = vi.fn().mockResolvedValue([null, { code: 500 }]);
    await expect(restreamer.ProbeIngest('channel')).resolves.toEqual([
      null,
      { code: 500 },
    ]);
  });

  it('upserts snapshot and preview processes with enable-dependent controls', async () => {
    const restreamer = client();
    await expect(
      restreamer.UpsertIngest('unknown', [], [], [], {}),
    ).resolves.toMatchObject([null, { message: 'Unknown channel ID' }]);
    await expect(
      restreamer.UpsertIngestSnapshot('unknown', {}),
    ).resolves.toMatchObject([null, { message: 'Unknown channel ID' }]);
    await expect(
      restreamer.UpsertIngestPreview('unknown', {}),
    ).resolves.toMatchObject([null, { message: 'Unknown channel ID' }]);

    restreamer._upsertProcess = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'snapshot' }, new Error('snapshot failed')])
      .mockResolvedValueOnce([{ id: 'preview' }, null])
      .mockResolvedValueOnce([{ id: 'snapshot' }, null])
      .mockResolvedValueOnce([{ id: 'preview' }, new Error('preview failed')]);
    const snapshotControl = {
      hls: { storage: 'diskfs' },
      snapshot: { enable: true, interval: '4' },
      process: { autostart: true, reconnect: true },
    };
    await expect(
      restreamer.UpsertIngestSnapshot('channel', snapshotControl),
    ).resolves.toEqual([{ id: 'snapshot' }, expect.any(Error)]);
    expect(restreamer._upsertProcess).toHaveBeenNthCalledWith(
      1,
      'restreamer-ui:ingest:channel_snapshot',
      expect.objectContaining({
        input: [
          { id: 'input_0', address: '{diskfs}/channel.m3u8', options: [] },
        ],
        autostart: true,
        reconnect: true,
        reconnect_delay_seconds: 4,
      }),
    );

    const previewControl = {
      hls: { storage: 'memfs' },
      preview: {
        enable: false,
        video_encoder: 'libx264',
        audio_encoder: 'aac',
      },
      process: { autostart: true, reconnect: true },
    };
    await expect(
      restreamer.UpsertIngestPreview('channel', previewControl),
    ).resolves.toEqual([{ id: 'preview' }, null]);
    expect(restreamer._upsertProcess).toHaveBeenNthCalledWith(
      2,
      'restreamer-ui:ingest:channel_h264',
      expect.objectContaining({
        input: [
          { id: 'input_0', address: '{memfs}/channel.m3u8', options: [] },
        ],
        autostart: false,
        reconnect: false,
        reconnect_delay_seconds: 2,
      }),
    );

    await expect(
      restreamer.UpsertIngestSnapshot('channel', {
        ...snapshotControl,
        snapshot: { enable: false, interval: '0' },
      }),
    ).resolves.toEqual([{ id: 'snapshot' }, null]);
    expect(restreamer._upsertProcess).toHaveBeenNthCalledWith(
      3,
      'restreamer-ui:ingest:channel_snapshot',
      expect.objectContaining({ autostart: false, reconnect: false }),
    );

    await expect(
      restreamer.UpsertIngestPreview('channel', {
        ...previewControl,
        preview: { ...previewControl.preview, enable: true },
      }),
    ).resolves.toEqual([{ id: 'preview' }, expect.any(Error)]);
    expect(restreamer._upsertProcess).toHaveBeenNthCalledWith(
      4,
      'restreamer-ui:ingest:channel_h264',
      expect.objectContaining({ autostart: true, reconnect: true }),
    );
  });

  it('merges player defaults with provided settings', () => {
    const restreamer = client();
    expect(restreamer.InitPlayerSettings(undefined)).toEqual({
      autoplay: false,
      mute: false,
      statistics: false,
      chromecast: false,
      airplay: false,
      color: { seekbar: '#ffffff', buttons: '#ffffff' },
      ga: { account: '', name: '' },
      logo: { image: '', position: 'top-left', link: '' },
      poster: '',
    });
    expect(
      restreamer.InitPlayerSettings({
        color: { seekbar: 'red' },
        poster: 'cover.jpg',
      }),
    ).toMatchObject({
      color: { seekbar: 'red', buttons: '#ffffff' },
      poster: 'cover.jpg',
    });
  });

  it('initializes playersite settings and removes files when playersite is disabled', async () => {
    const restreamer = client();
    restreamer.channels.set('channel', {
      id: 'restreamer-ui:ingest:channel',
      channelid: 'channel',
      name: 'Channel',
      egresses: new Map(),
      available: true,
    });
    expect(restreamer.InitPlayersiteSettings(undefined)).toMatchObject({
      player: 'videojs',
      playersite: false,
      channelid: 'current',
      channel_list: ['channel'],
    });
    expect(
      restreamer.InitPlayersiteSettings({ title: 'Custom', playersite: true }),
    ).toMatchObject({
      title: 'Custom',
      playersite: true,
    });
    restreamer.GetMetadata = vi
      .fn()
      .mockResolvedValue({ playersite: { playersite: false } });
    restreamer._removePlayersiteEssentials = vi
      .fn()
      .mockResolvedValue(undefined);
    await expect(restreamer.UpdatePlayersite()).resolves.toBe(true);
    expect(restreamer._removePlayersiteEssentials).toHaveBeenCalledOnce();
  });

  it('updates player templates and player configuration', async () => {
    const restreamer = client();
    const metadata = {
      meta: {
        name: 'Channel',
        description: 'Description',
        author: { name: 'Author' },
      },
      license: 'CC',
      control: { hls: { storage: 'diskfs' }, preview: { enable: true } },
      player: {
        chromecast: true,
        airplay: false,
        poster: '/custom/poster.jpg',
        logo: { image: '/custom/logo.png' },
      },
    };
    restreamer.GetIngestMetadata = vi.fn().mockResolvedValue(metadata);
    restreamer._updatePlayerEssentials = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    restreamer._getLocalAssetAsString = vi.fn().mockResolvedValue('{{name}}');
    restreamer._uploadAssetData = vi.fn().mockResolvedValue(true);
    restreamer.GetPublicAddress = vi
      .fn()
      .mockReturnValue('https://core.example/channel');
    restreamer.GetPublicIframeCode = vi
      .fn()
      .mockReturnValue('<iframe></iframe>');
    restreamer.PrefixPublicHTTPAddress = vi
      .fn()
      .mockReturnValue('https://core.example/custom/poster.jpg');
    restreamer.UpdatePlayerConfig = vi.fn().mockResolvedValue(undefined);

    expect(await restreamer.UpdatePlayer('unknown')).toBe(false);
    expect(await restreamer.UpdatePlayer('channel')).toBe(false);
    restreamer._updatePlayerEssentials = vi.fn().mockResolvedValue(true);
    expect(await restreamer.UpdatePlayer('channel')).toBe(true);
    expect(restreamer._getLocalAssetAsString).toHaveBeenCalledTimes(3);
    expect(restreamer._uploadAssetData).toHaveBeenCalledTimes(3);
    expect(restreamer._uploadAssetData).toHaveBeenCalledWith(
      '/channel.html',
      'Channel',
    );
    expect(restreamer.UpdatePlayerConfig).toHaveBeenCalledWith(
      'channel',
      metadata,
    );
    expect(restreamer.PrefixPublicHTTPAddress).toHaveBeenCalledWith(
      '/custom/poster.jpg',
    );

    restreamer.UpdatePlayerConfig = Restreamer.prototype.UpdatePlayerConfig;
    restreamer._uploadAssetData = vi.fn().mockResolvedValue(true);
    await restreamer.UpdatePlayerConfig('channel', metadata);
    expect(restreamer._uploadAssetData).toHaveBeenCalledTimes(2);
    expect(restreamer._uploadAssetData).toHaveBeenCalledWith(
      '/channels/channel/config.js',
      expect.stringContaining('var playerConfig = '),
    );
    expect(restreamer._uploadAssetData).toHaveBeenCalledWith(
      '/channels/channel/config.json',
      expect.stringContaining('"source":"channel_h264.m3u8"'),
    );
  });

  it('uploads channel data and playersite assets using sanitized paths', async () => {
    const restreamer = client();
    restreamer._uploadAssetData = vi.fn().mockResolvedValue(true);
    restreamer._deleteAsset = vi.fn().mockResolvedValue(true);
    restreamer._getAssetAsString = vi.fn().mockResolvedValue('template');
    restreamer._listAssets = vi
      .fn()
      .mockResolvedValue([
        '/playersite/templates/default.html',
        '/playersite/templates/custom.page.html',
      ]);

    expect(await restreamer.UploadData('', 'logo !@#.png', new Blob())).toBe(
      '/channels/channel/logo.png',
    );
    expect(await restreamer.UploadData('unknown', 'x.png', 'x')).toBe('');
    await expect(
      restreamer.UploadLogo('channel', 'logo', 'p!ng'),
    ).resolves.toBe('/channels/channel/logo.png');
    await expect(
      restreamer.UploadPoster('channel', 'poster', 'jpg'),
    ).resolves.toBe('/channels/channel/poster.jpg');
    expect(restreamer.GetPlayersiteUrl()).toBe('index.html');
    restreamer._hasAsset = vi.fn().mockResolvedValue(true);
    await expect(restreamer.HasPlayersite()).resolves.toBe(true);
    await expect(
      restreamer.UploadPlayersiteBackgroundImage('bg', 'j!p-g'),
    ).resolves.toBe('/playersite/bg.jpg');
    await expect(
      restreamer.UploadPlayersiteTemplate('html', 'My template!'),
    ).resolves.toBe('Mytemplate');
    await expect(
      restreamer.DeletePlayersiteTemplate('My template!'),
    ).resolves.toBe(true);
    await expect(
      restreamer.GetPlayersiteTemplate('My template!'),
    ).resolves.toBe('template');
    await expect(restreamer.ListPlayersiteTemplates()).resolves.toEqual([
      'default',
      'custom',
    ]);
    expect(restreamer._deleteAsset).toHaveBeenCalledWith(
      '/playersite/templates/Mytemplate.html',
    );
    expect(restreamer._uploadAssetData).toHaveBeenCalledWith(
      '/playersite/bg.jpg',
      'bg',
    );
  });
});
