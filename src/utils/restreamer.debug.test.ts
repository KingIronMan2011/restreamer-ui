import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function client() {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  return new Restreamer('https://core.example');
}

function config(origins: string[] = ['*']) {
  return {
    host: { name: ['core.example'] },
    api: {
      auth: {
        username: 'user',
        password: 'pass',
        jwt: { secret: 'jwt-secret' },
        auth0: { tenants: ['tenant'] },
      },
      access: {
        http: { allow: ['10.0.0.1'], block: ['10.0.0.2'] },
        https: { allow: ['10.0.0.3'], block: ['10.0.0.4'] },
      },
    },
    storage: {
      memory: { auth: { username: 'mem-user', password: 'mem-pass' } },
      s3: [
        {
          auth: { username: 's3-user', password: 's3-pass', other: true },
          endpoint: 's3.example',
          access_key_id: 'key',
          secret_access_key: 'secret',
        },
      ],
      cors: { origins },
    },
    rtmp: { app: 'live', token: 'rtmp-secret' },
    ffmpeg: { binary: 'ffmpeg' },
    service: { token: 'service-secret' },
    sessions: { ip_ignorelist: ['10.0.0.5'] },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Restreamer debug and metrics helpers', () => {
  it('anonymizes Core configuration while preserving wildcard CORS', async () => {
    const restreamer = client();
    const raw = config();
    restreamer._call = vi.fn().mockResolvedValueOnce([{ config: raw }, null]);
    const result = await restreamer._getConfigDebug();

    expect(result.host.name).toEqual(['[anonymized]']);
    expect(result.api.auth).toMatchObject({
      username: '[anonymized]',
      password: '[anonymized]',
      jwt: { secret: '[anonymized]' },
      auth0: { tenants: ['[anonymized]'] },
    });
    expect(result.api.access.http).toEqual({
      allow: ['[anonymized]'],
      block: ['[anonymized]'],
    });
    expect(result.api.access.https).toEqual({
      allow: ['[anonymized]'],
      block: ['[anonymized]'],
    });
    expect(result.storage.memory.auth).toEqual({
      username: '[anonymized]',
      password: '[anonymized]',
    });
    expect(result.storage.s3[0]).toMatchObject({
      auth: { username: '[anonymized]', password: '[anonymized]', other: true },
      endpoint: '[anonymized]',
      access_key_id: '[anonymized]',
      secret_access_key: '[anonymized]',
    });
    expect(result.storage.cors.origins).toEqual(['*']);
    expect(result.rtmp).toEqual({ app: '[anonymized]', token: '[anonymized]' });
    expect(result.service.token).toBe('[anonymized]');
    expect(result.sessions.ip_ignorelist).toEqual(['[anonymized]']);

    restreamer._call = vi
      .fn()
      .mockResolvedValueOnce([
        { config: config(['https://site.example']) },
        null,
      ]);
    await expect(restreamer._getConfigDebug()).resolves.toMatchObject({
      storage: { cors: { origins: ['[anonymized]'] } },
    });
    restreamer._call = vi.fn().mockResolvedValue([null, new Error('offline')]);
    await expect(restreamer._getConfigDebug()).resolves.toBeNull();
  });

  it('normalizes auth provider names and combines debug reports', async () => {
    const restreamer = client();
    restreamer.About = vi
      .fn()
      .mockResolvedValue({ auths: ['auth0 tenant', 'localjwt'] });
    await expect(restreamer._getAboutDebug()).resolves.toEqual({
      auths: ['auth0', 'localjwt'],
    });
    restreamer.About = vi.fn().mockResolvedValue(null);
    await expect(restreamer._getAboutDebug()).resolves.toBeNull();

    restreamer._getAboutDebug = vi.fn().mockResolvedValue({ app: 'core' });
    restreamer.Skills = vi.fn().mockReturnValue({ ffmpeg: { version: '7' } });
    restreamer._getConfigDebug = vi.fn().mockResolvedValue({ host: true });
    restreamer._getProcessDebug = vi.fn().mockResolvedValue({ process: true });
    await expect(restreamer.GetDebug('process-id')).resolves.toEqual({
      about: { app: 'core' },
      ffmpeg: { version: '7' },
      config: { host: true },
      process: { process: true },
    });
  });

  it('returns resource metrics with label matching and zero defaults', async () => {
    const restreamer = client();
    restreamer._call = vi.fn().mockResolvedValueOnce([
      {
        metrics: [
          { name: 'uptime_uptime', labels: {}, values: [[0, 60]] },
          { name: 'cpu_ncpu', labels: {}, values: [[0, 4]] },
          { name: 'cpu_idle', labels: {}, values: [[0, 25]] },
          { name: 'mem_total', labels: {}, values: [[0, 1000]] },
          { name: 'mem_free', labels: {}, values: [[0, 250]] },
          { name: 'session_active', labels: {}, values: [[0, 98]] },
          {
            name: 'session_active',
            labels: { collector: 'rtmp' },
            values: [[0, 99]],
          },
          {
            name: 'session_active',
            labels: { collector: 'hls' },
            values: [[0, 2]],
          },
          {
            name: 'session_limit',
            labels: { collector: 'hls' },
            values: [[0, 10]],
          },
          {
            name: 'session_txbitrate',
            labels: { collector: 'hls' },
            values: [[0, 2048]],
          },
          {
            name: 'session_maxtxbitrate',
            labels: { collector: 'hls' },
            values: [[0, 4096]],
          },
          {
            name: 'filesystem_usage',
            labels: { name: 'memfs' },
            values: [[0, 100]],
          },
          {
            name: 'filesystem_limit',
            labels: { name: 'memfs' },
            values: [[0, 500]],
          },
        ],
      },
      null,
    ]);

    await expect(restreamer.Resources()).resolves.toEqual({
      uptime_seconds: 60,
      system: {
        cpu_used: 75,
        cpu_ncores: 4,
        mem_used_bytes: 750,
        mem_total_bytes: 1000,
      },
      core: {
        session_used: 2,
        session_limit: 10,
        net_used_kbit: 2,
        net_limit_kbit: 4,
        memfs_used_bytes: 100,
        memfs_limit_bytes: 500,
        disk_used_bytes: 0,
        disk_limit_bytes: 0,
      },
    });
    restreamer._call = vi.fn().mockResolvedValue([null, new Error('offline')]);
    await expect(restreamer.Resources()).resolves.toBeNull();
  });

  it('delegates channel lists and stores expert and update preferences', async () => {
    const restreamer = client();
    restreamer._listRTMPChannels = vi.fn().mockResolvedValue(['rtmp']);
    restreamer._listSRTChannels = vi.fn().mockResolvedValue(['srt']);
    await expect(restreamer.ListRTMPChannels()).resolves.toEqual(['rtmp']);
    await expect(restreamer.ListSRTChannels()).resolves.toEqual(['srt']);

    const get = vi.spyOn(Storage, 'Get').mockReturnValue('false');
    const set = vi.spyOn(Storage, 'Set').mockImplementation(() => {});
    restreamer._checkForUpdates = vi.fn();
    expect(restreamer.IsExpert()).toBe(false);
    restreamer.SetExpert(1);
    expect(set).toHaveBeenCalledWith('expert', true);
    get.mockReturnValue('true');
    expect(restreamer.IsExpert()).toBe(true);
    expect(restreamer.CheckForUpdates()).toBe(true);
    expect(restreamer.HasUpdates()).toBe(false);
    expect(restreamer.HasService()).toBe(false);
    restreamer.hasUpdates = true;
    restreamer.hasService = true;
    expect(restreamer.HasUpdates()).toBe(true);
    expect(restreamer.HasService()).toBe(true);
    restreamer.SetCheckForUpdates(false);
    expect(set).toHaveBeenCalledWith('updates', false);
    expect(restreamer._checkForUpdates).toHaveBeenCalledOnce();
  });

  it('checks service versions and marks available UI and service updates', async () => {
    vi.useFakeTimers();
    const restreamer = client();
    vi.mocked(Storage.Get).mockReturnValue('true');
    const fetchMock = vi.fn().mockResolvedValue({
      headers: { get: () => 'application/json' },
      ok: true,
      json: () =>
        Promise.resolve({
          latest_version: 'restreamer-v2.13.0',
          service_version: 'service-v1.1.0',
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await restreamer._checkForUpdates();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://service.datarhei.com/api/v1/app_version',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(restreamer.HasUpdates()).toBe(true);
    expect(restreamer.HasService()).toBe(true);
    expect(restreamer.updates).not.toBeNull();
    vi.useRealTimers();
  });

  it('ignores failed update requests and reports no update for old versions', async () => {
    vi.useFakeTimers();
    const restreamer = client();
    vi.mocked(Storage.Get).mockReturnValue('true');
    const response = (contentType: string | null, ok: boolean, body = {}) => ({
      headers: { get: () => contentType },
      ok,
      json: () => Promise.resolve(body),
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce(response(null, true))
        .mockResolvedValueOnce(response('text/plain', true))
        .mockResolvedValueOnce(response('application/json', false))
        .mockResolvedValueOnce(
          response('application/json', true, {
            latest_version: 'invalid',
            service_version: 'invalid',
          }),
        ),
    );

    for (let i = 0; i < 5; i++) {
      await restreamer._checkForUpdates();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    }

    expect(restreamer.HasUpdates()).toBe(false);
    expect(restreamer.HasService()).toBe(false);
  });
});
