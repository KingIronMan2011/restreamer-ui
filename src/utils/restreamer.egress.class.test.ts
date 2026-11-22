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

describe('Restreamer egress API', () => {
  it('gets, updates, starts, stops, and deletes known egresses', async () => {
    const restreamer = client();
    const id = 'restreamer-ui:egress:twitch:one';
    restreamer.SetChannelEgress('channel', id, {
      id,
      service: 'twitch',
      index: 'one',
      channelid: 'channel',
      name: 'Twitch',
    });
    restreamer._getProcess = vi.fn().mockResolvedValue({ id });
    restreamer._getProcessMetadata = vi
      .fn()
      .mockResolvedValue({ name: 'Twitch' });
    restreamer._setProcessMetadata = vi.fn().mockResolvedValue(true);
    restreamer._startProcess = vi.fn().mockResolvedValue(true);
    restreamer._stopProcess = vi.fn().mockResolvedValue(true);
    restreamer._deleteProcess = vi
      .fn()
      .mockResolvedValue(false)
      .mockResolvedValueOnce(true);
    restreamer._getProcessLog = vi.fn().mockResolvedValue('log');
    restreamer.GetDebug = vi.fn().mockResolvedValue({ debug: true });
    restreamer.UpdateEgress = vi.fn().mockResolvedValue([{}, null]);

    expect(restreamer.GetEgressId('twitch', 'one')).toBe(id);
    await expect(restreamer.GetEgress('unknown', id)).resolves.toBeUndefined();
    await expect(
      restreamer.GetEgress('channel', 'unknown'),
    ).resolves.toBeNull();
    await expect(restreamer.GetEgress('channel', id, [])).resolves.toEqual({
      id,
    });
    await expect(
      restreamer.GetEgressMetadata('unknown', id),
    ).resolves.toHaveProperty('name');
    await expect(
      restreamer.GetEgressMetadata('channel', 'unknown'),
    ).resolves.toHaveProperty('name');
    await expect(
      restreamer.GetEgressMetadata('channel', id),
    ).resolves.toMatchObject({ name: 'Twitch' });
    await expect(
      restreamer.SetEgressMetadata('unknown', id, {}),
    ).resolves.toBeNull();
    await expect(
      restreamer.SetEgressMetadata('channel', 'unknown', {}),
    ).resolves.toBeNull();
    await expect(
      restreamer.SetEgressMetadata('channel', id, { name: 'Renamed' }),
    ).resolves.toBe(true);
    expect(restreamer.GetChannelEgress('channel', id)?.name).toBe('Renamed');
    await expect(
      restreamer.StartEgress('channel', 'unknown'),
    ).resolves.toBeNull();
    await expect(restreamer.StartEgress('channel', id)).resolves.toBe(true);
    await expect(restreamer.StopEgress('channel', id)).resolves.toBe(true);
    await expect(restreamer.StopEgress('unknown', id)).resolves.toBeNull();
    await expect(
      restreamer.StopAllEgresses('unknown'),
    ).resolves.toBeUndefined();
    await restreamer.StopAllEgresses('channel');
    await restreamer.UpdateEgress('channel', id, {}, [], [], {});
    expect(restreamer.UpdateEgress).toHaveBeenCalledWith(
      'channel',
      id,
      {},
      [],
      [],
      {},
    );
    await expect(restreamer.DeleteEgress('channel', id)).resolves.toBe(true);
    expect(restreamer.GetChannelEgress('channel', id)).toBeNull();
  });

  it('lists player and linked egress processes in a stable display order', async () => {
    const restreamer = client();
    const b = 'restreamer-ui:egress:twitch:b';
    const a = 'restreamer-ui:egress:twitch:a';
    restreamer.SetChannelEgress('channel', b, {
      id: b,
      service: 'twitch',
      index: '2',
      name: 'Zulu',
    });
    restreamer.SetChannelEgress('channel', a, {
      id: a,
      service: 'twitch',
      index: '1',
      name: 'Alpha',
    });
    restreamer._listProcesses = vi
      .fn()
      .mockResolvedValue([
        { id: b },
        { id: 'unsupported' },
        { id: 'restreamer-ui:egress:twitch:orphan' },
        { id: a },
        { id: 'restreamer-ui:ingest:channel' },
      ]);

    await expect(restreamer.ListIngestEgresses('unknown')).resolves.toEqual([]);
    const result = await restreamer.ListIngestEgresses('channel');
    expect(result.map((p: any) => [p.service, p.name])).toEqual([
      ['player', 'Channel'],
      ['twitch', 'Alpha'],
      ['twitch', 'Zulu'],
    ]);
    expect(restreamer._listProcesses).toHaveBeenCalledWith(
      ['state'],
      'channel',
    );
    await restreamer.ListProcesses(['state'], ['id']);
    expect(restreamer._listProcesses).toHaveBeenCalledWith(['state'], '', [
      'id',
    ]);
  });

  it('removes newly created egress on update errors and keeps it on success', async () => {
    const restreamer = client();
    restreamer.UpdateEgress = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([null, new Error('failed')])
      .mockResolvedValueOnce([{}, null]);
    const failed = await restreamer.CreateEgress(
      'unknown',
      'twitch',
      {},
      [],
      [],
      {},
    );
    expect(failed).toEqual(['', { message: 'Unknown channel ID' }]);
    const updateNull = await restreamer.CreateEgress(
      'channel',
      'twitch',
      {},
      [],
      [],
      {},
    );
    expect(updateNull[0]).toMatch(/^restreamer-ui:egress:twitch:/);
    expect(updateNull[1]).toBeNull();
    const updateError = await restreamer.CreateEgress(
      'channel',
      'twitch',
      {},
      [],
      [],
      {},
    );
    expect(updateError[0]).toMatch(/^restreamer-ui:egress:twitch:/);
    expect(updateError[1]).toBeInstanceOf(Error);
    expect(restreamer.channels.get('channel')?.egresses.size).toBe(0);
    const created = await restreamer.CreateEgress(
      'channel',
      'twitch',
      {},
      [],
      [],
      {},
    );
    expect(created[0]).toMatch(/^restreamer-ui:egress:twitch:/);
    expect(created[1]).toBeNull();
    expect(restreamer.GetChannelEgress('channel', created[0])).toMatchObject({
      service: 'twitch',
    });
  });

  it('gets egress logs and debug details only for linked egresses', async () => {
    const restreamer = client();
    const id = 'restreamer-ui:egress:twitch:one';
    restreamer.SetChannelEgress('channel', id, {
      id,
      service: 'twitch',
      index: 'one',
      channelid: 'channel',
      name: 'Twitch',
    });
    restreamer._getProcessLog = vi.fn().mockResolvedValue('egress log');
    restreamer.GetDebug = vi.fn().mockResolvedValue({ details: true });

    await expect(restreamer.GetEgressLog('unknown', id)).resolves.toBeNull();
    await expect(
      restreamer.GetEgressLog('channel', 'missing'),
    ).resolves.toBeNull();
    await expect(restreamer.GetEgressLog('channel', id)).resolves.toBe(
      'egress log',
    );
    await expect(restreamer.GetEgressDebug('unknown', id)).resolves.toBeNull();
    await expect(
      restreamer.GetEgressDebug('channel', 'missing'),
    ).resolves.toBeNull();
    await expect(restreamer.GetEgressDebug('channel', id)).resolves.toEqual({
      details: true,
    });
  });

  it('returns null when updating egresses for an unknown channel', async () => {
    const restreamer = client();
    await expect(
      restreamer.UpdateEgress('unknown', 'id', {}, [], [], {}),
    ).resolves.toBeNull();
  });
});
