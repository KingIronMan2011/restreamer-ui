import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function client() {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  return new Restreamer('https://core.example');
}

const channel = (channelid: string) => ({
  id: `restreamer-ui:ingest:${channelid}`,
  channelid,
  name: channelid,
  egresses: new Map(),
  available: true,
});

afterEach(() => vi.restoreAllMocks());

describe('Restreamer channel helpers', () => {
  it('creates, selects, and reports channels with an ordered egress list', () => {
    const restreamer = client();
    const id = restreamer.CreateChannel('Test channel');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(restreamer.SelectChannel(id)).toBe(id);
    expect(restreamer.GetCurrentChannelID()).toBe(id);
    expect(restreamer.ListChannels()).toHaveLength(1);

    restreamer.SetChannelEgress(id, 'egress-1', {
      id: 'egress-1',
      service: 'twitch',
      index: '0',
      channelid: id,
      name: 'Output',
    });
    expect(restreamer.GetChannelEgress(id, 'egress-1')).toEqual({
      id: 'egress-1',
      service: 'twitch',
      index: '0',
      channelid: id,
      name: 'Output',
    });
    expect(restreamer.GetChannel(id)?.egresses).toEqual(['egress-1']);
    expect(restreamer.SetChannel(id, { name: 'Updated' })).toBe(true);
    expect(restreamer.GetChannel(id)?.name).toBe('Updated');
    restreamer.DeleteChannelEgress(id, 'egress-1');
    expect(restreamer.GetChannelEgress(id, 'egress-1')).toBeNull();
  });

  it('returns safe failure values for unknown channel or egress IDs', async () => {
    const restreamer = client();
    expect(restreamer.GetChannel('missing')).toBeNull();
    expect(restreamer.GetChannelEgress('missing', 'egress')).toBeNull();
    expect(restreamer.GetChannelEgress('missing', 'egress')).toBeNull();
    expect(restreamer.SetChannel('missing', {})).toBe(false);
    expect(restreamer.SetChannelEgress('missing', 'egress', {})).toBe(false);
    expect(restreamer.DeleteChannelEgress('missing', 'egress')).toBe(false);
    expect(restreamer.SelectChannel('missing')).toBe('');
    expect(restreamer.GetCurrentChannelID()).toBe('');
    await expect(restreamer.DeleteIngest('missing')).resolves.toBe(false);
    await expect(restreamer.DeleteIngestSnapshot('missing')).resolves.toBe(
      false,
    );
    await expect(
      restreamer.SetIngestMetadata('missing', { meta: {} }),
    ).resolves.toBe(false);
  });

  it('builds channel paths and addresses for each storage type', () => {
    const restreamer = client();
    expect(restreamer.GetChannelManifestPath('one', undefined)).toBe(
      'memfs/one.m3u8',
    );
    expect(restreamer.GetChannelManifestPath('one', 'memfs')).toBe(
      'memfs/one.m3u8',
    );
    expect(restreamer.GetChannelManifestPath('one', 'diskfs')).toBe('one.m3u8');
    expect(restreamer.GetChannelPosterPath('one', 'diskfs')).toBe(
      'memfs/one.jpg',
    );
    expect(restreamer.GetChannelPlayerPath('one')).toBe('one.html');
    expect(restreamer.GetChannelAddress('hls+memfs', 'one')).toBe(
      'https://core.example/memfs/one.m3u8',
    );
    expect(restreamer.GetChannelAddress('hls+diskfs', 'one')).toBe(
      'https://core.example/one.m3u8',
    );
    expect(restreamer.GetChannelAddress('snapshot+memfs', 'one')).toBe(
      'https://core.example/memfs/one.jpg',
    );
    expect(restreamer.GetChannelAddress('snapshot+diskfs', 'one')).toBe(
      'https://core.example/memfs/one.jpg',
    );
    expect(restreamer.GetChannelAddress('player', 'one')).toBe(
      'https://core.example/one.html',
    );
    expect(restreamer.GetChannelAddress('unsupported', 'one')).toBeUndefined();
  });

  it('embeds an iframe for an existing channel and returns empty for a missing one', () => {
    const restreamer = client();
    expect(restreamer.GetPublicIframeCode('missing')).toBe('');
    restreamer.channels.set('one', channel('one'));
    vi.spyOn(restreamer, 'GetPublicHTTPAddress').mockReturnValue(
      'https://public.example',
    );
    expect(restreamer.GetPublicIframeCode('one')).toContain(
      '<iframe src="https://public.example/one.html"',
    );
  });

  it('deletes channels, removes their outputs, and creates a replacement when needed', async () => {
    const restreamer = client();
    restreamer.channels.set('one', channel('one'));
    restreamer.SelectChannel('one');
    restreamer.SetChannelEgress('one', 'egress-1', { id: 'egress-1' });
    restreamer.StopAllEgresses = vi.fn().mockResolvedValue(undefined);
    restreamer.DeleteIngest = vi.fn().mockResolvedValue(undefined);
    restreamer.DeleteIngestSnapshot = vi.fn().mockResolvedValue(undefined);
    restreamer.DeleteEgress = vi.fn().mockResolvedValue(undefined);

    await expect(restreamer.DeleteChannel('missing')).resolves.toBe(false);
    await expect(restreamer.DeleteChannel('one')).resolves.toBe(true);
    expect(restreamer.StopAllEgresses).toHaveBeenCalledWith('one');
    expect(restreamer.DeleteIngest).toHaveBeenCalledWith('one');
    expect(restreamer.DeleteIngestSnapshot).toHaveBeenCalledWith('one');
    expect(restreamer.DeleteEgress).toHaveBeenCalledWith('one', 'egress-1');
    expect(restreamer.channels.size).toBe(1);
    expect(restreamer.GetCurrentChannelID()).toBe(
      [...restreamer.channels.keys()][0],
    );
  });

  it('keeps and selects remaining channels and removes only successfully deleted egresses', async () => {
    const restreamer = client();
    restreamer.channels.set('one', channel('one'));
    restreamer.channels.set('two', channel('two'));
    restreamer.SelectChannel('one');
    const deleteEgress = restreamer.DeleteEgress.bind(restreamer);
    restreamer.StopAllEgresses = vi.fn().mockResolvedValue(undefined);
    restreamer.DeleteIngest = vi.fn().mockResolvedValue(undefined);
    restreamer.DeleteIngestSnapshot = vi.fn().mockResolvedValue(undefined);
    restreamer.DeleteEgress = vi.fn().mockResolvedValue(undefined);

    await expect(restreamer.DeleteChannel('one')).resolves.toBe(true);
    expect(restreamer.channels.size).toBe(1);
    expect(restreamer.GetCurrentChannelID()).toBe('two');

    restreamer.DeleteEgress = deleteEgress;
    restreamer.SetChannelEgress('two', 'output', { id: 'output' });
    expect(restreamer.GetChannel('two')?.egresses).toContain('output');
    const deleteProcess = vi.fn().mockResolvedValue(false);
    restreamer._deleteProcess = deleteProcess;
    await expect(restreamer.DeleteEgress('two', 'output')).resolves.toBe(false);
    expect(deleteProcess).toHaveBeenCalledWith('output');
    expect(restreamer.GetChannelEgress('two', 'output')).not.toBeNull();
    restreamer._deleteProcess = vi.fn().mockResolvedValue(true);
    await expect(restreamer.DeleteEgress('two', 'output')).resolves.toBe(true);
    expect(restreamer.GetChannelEgress('two', 'output')).toBeNull();
  });

  it('uses the existing channel name when ingest metadata has no name', async () => {
    const restreamer = client();
    restreamer.channels.set('one', channel('one'));
    restreamer._setProcessMetadata = vi.fn().mockResolvedValue(true);
    await expect(
      restreamer.SetIngestMetadata('one', { meta: { name: '' } }),
    ).resolves.toBe(true);
    expect(restreamer.GetChannel('one')?.name).toBe('one');
    expect(restreamer._setProcessMetadata).toHaveBeenCalledWith(
      'restreamer-ui:ingest:one',
      { meta: { name: '' } },
    );
  });

  it('discovers valid ingest and egress records, ignoring malformed and duplicate IDs', async () => {
    const restreamer = client();
    const id = '11111111-1111-1111-1111-111111111111';
    const other = '22222222-2222-2222-2222-222222222222';
    restreamer._listProcesses = vi.fn().mockResolvedValue([
      {
        id: 'restreamer-ui:egress:twitch:33333333-3333-3333-3333-333333333333',
        reference: id,
        metadata: { name: 'Twitch' },
      },
      {
        id: 'restreamer-ui:egress:youtube:55555555-5555-5555-5555-555555555555',
        reference: id,
        metadata: { name: 'YouTube' },
      },
      { id: 'unsupported', reference: id, metadata: {} },
      {
        id: `restreamer-ui:ingest:${other}`,
        reference: id,
        metadata: { meta: { name: 'mismatch' } },
      },
      {
        id: `restreamer-ui:ingest:${id}`,
        reference: id,
        metadata: { meta: { name: 'Main' } },
      },
      {
        id: `restreamer-ui:ingest:${id}`,
        reference: id,
        metadata: { meta: { name: 'duplicate' } },
      },
      {
        id: `restreamer-ui:ingest:${other}`,
        reference: other,
        metadata: { meta: { name: 'Other' } },
      },
      {
        id: 'restreamer-ui:egress:youtube:44444444-4444-4444-4444-444444444444',
        reference: 'orphan',
        metadata: { name: 'Orphan' },
      },
    ]);
    restreamer.about.id = 'core';
    vi.spyOn(Storage, 'Get').mockImplementation((key) =>
      key === 'core:channel' ? other : 'false',
    );

    await restreamer._discoverChannels();

    expect([...restreamer.channels.keys()]).toEqual([id, other]);
    expect(restreamer.GetChannel(id)?.name).toBe('Main');
    expect(restreamer.GetChannel(id)?.egresses).toEqual([
      'restreamer-ui:egress:twitch:33333333-3333-3333-3333-333333333333',
      'restreamer-ui:egress:youtube:55555555-5555-5555-5555-555555555555',
    ]);
    expect(restreamer.GetCurrentChannelID()).toBe(other);
  });

  it('lists player first and sorts egresses by name then index', async () => {
    const restreamer = client();
    const current = channel('one');
    const alphaId = 'restreamer-ui:egress:youtube:alpha';
    const secondId = 'restreamer-ui:egress:twitch:second';
    const firstId = 'restreamer-ui:egress:twitch:first';
    restreamer.channels.set('one', current);
    restreamer.SetChannelEgress('one', alphaId, {
      service: 'youtube',
      index: '0',
      name: 'Alpha',
    });
    restreamer.SetChannelEgress('one', secondId, {
      service: 'twitch',
      index: '2',
      name: 'Same',
    });
    restreamer.SetChannelEgress('one', firstId, {
      service: 'twitch',
      index: '1',
      name: 'Same',
    });
    restreamer._listProcesses = vi
      .fn()
      .mockResolvedValue([
        { id: secondId },
        { id: firstId },
        { id: current.id },
        { id: 'untracked-process' },
        { id: alphaId },
      ]);
    restreamer.GetChannelEgress = vi.fn((channelid, id) => {
      const lookup: Record<string, any> = {
        [alphaId]: current.egresses.get(alphaId),
        [secondId]: current.egresses.get(secondId),
        [firstId]: current.egresses.get(firstId),
      };
      return lookup[id] ?? null;
    });

    const list = await restreamer.ListIngestEgresses('one');

    expect(
      list.map((process: any) => ({
        id: process.id,
        service: process.service,
        index: process.index,
        name: process.name,
      })),
    ).toEqual([
      { id: current.id, service: 'player', index: '', name: 'one' },
      { id: alphaId, service: 'youtube', index: '0', name: 'Alpha' },
      { id: firstId, service: 'twitch', index: '1', name: 'Same' },
      { id: secondId, service: 'twitch', index: '2', name: 'Same' },
    ]);
  });

  it('compares reverse and equal egress sort keys', async () => {
    const restreamer = client();
    const current = channel('one');
    const zuluId = 'restreamer-ui:egress:twitch:zulu';
    const alphaId = 'restreamer-ui:egress:twitch:alpha';
    const sameId = 'restreamer-ui:egress:twitch:same';
    restreamer.channels.set('one', current);
    restreamer.SetChannelEgress('one', zuluId, {
      service: 'twitch',
      index: '2',
      name: 'Zulu',
    });
    restreamer.SetChannelEgress('one', alphaId, {
      service: 'twitch',
      index: '1',
      name: 'Alpha',
    });
    restreamer.SetChannelEgress('one', sameId, {
      service: 'twitch',
      index: '1',
      name: 'Alpha',
    });
    restreamer._listProcesses = vi
      .fn()
      .mockResolvedValue([
        { id: alphaId },
        { id: zuluId },
        { id: sameId },
        { id: current.id },
      ]);

    const result = await restreamer.ListIngestEgresses('one');
    expect(result.map((process: any) => process.id)).toEqual([
      current.id,
      alphaId,
      sameId,
      zuluId,
    ]);
  });

  it('creates a first channel when discovery returns no ingest and clears imported metadata', async () => {
    const restreamer = client();
    restreamer._listProcesses = vi.fn().mockResolvedValue([]);
    await restreamer._discoverChannels();
    expect(restreamer.channels.size).toBe(1);
    expect(restreamer.GetCurrentChannelID()).toBe(
      [...restreamer.channels.keys()][0],
    );

    const id = '55555555-5555-5555-5555-555555555555';
    restreamer._listProcesses = vi.fn().mockResolvedValue([
      {
        id: `restreamer-ui:ingest:${id}`,
        reference: id,
        metadata: { imported: true },
      },
    ]);
    restreamer.UpdatePlayer = vi.fn().mockResolvedValue(true);
    const metadata = { imported: true, meta: { name: 'Imported' } };
    restreamer.GetIngestMetadata = vi.fn().mockResolvedValue(metadata);
    restreamer.SetIngestMetadata = vi.fn().mockResolvedValue(true);

    await restreamer._discoverChannels();

    expect(restreamer.UpdatePlayer).toHaveBeenCalledWith(id);
    expect(restreamer.GetIngestMetadata).toHaveBeenCalledWith(id);
    expect(metadata).not.toHaveProperty('imported');
    expect(restreamer.SetIngestMetadata).toHaveBeenCalledWith(id, metadata);
  });
});
