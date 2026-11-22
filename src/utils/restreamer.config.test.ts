import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function client(address = 'https://core.example') {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  return new Restreamer(address);
}

afterEach(() => vi.restoreAllMocks());

describe('Restreamer config and metadata helpers', () => {
  it('gets, sets, and initializes metadata with or without defaults', async () => {
    const restreamer = client();
    restreamer._getMetadata = vi
      .fn()
      .mockResolvedValue({ player: { enabled: true } });
    const raw = await restreamer.GetMetadata(false);
    expect(raw).toEqual({ player: { enabled: true } });

    const initialized = await restreamer.GetMetadata();
    expect(initialized).toMatchObject({ player: { enabled: true } });
    restreamer._setMetadata = vi.fn().mockResolvedValue(true);
    await expect(restreamer.SetMetadata({ player: {} })).resolves.toBe(true);
    expect(restreamer._setMetadata).toHaveBeenCalledWith({ player: {} });
  });

  it('loads config dates and returns null or false on Core errors', async () => {
    const restreamer = client();
    restreamer._call = vi
      .fn()
      .mockResolvedValueOnce([
        {
          created_at: '2024-01-01T00:00:00Z',
          loaded_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
        },
        null,
      ])
      .mockResolvedValueOnce([null, { code: 500 }])
      .mockResolvedValueOnce([null, { code: 500 }]);

    const config = await restreamer.Config();
    expect(config.created_at).toBeInstanceOf(Date);
    expect(config.loaded_at).toBeInstanceOf(Date);
    expect(config.updated_at).toBeInstanceOf(Date);
    await expect(restreamer.Config()).resolves.toBeNull();
    await expect(restreamer.ConfigReload()).resolves.toBe(false);

    restreamer._call = vi.fn().mockResolvedValue([null, null]);
    await expect(restreamer.ConfigReload()).resolves.toBe(true);
    await expect(restreamer.ConfigSet({})).resolves.toEqual([null, null]);
  });

  it('initializes safe defaults when Core config is unavailable', async () => {
    const restreamer = client();
    restreamer.Config = vi.fn().mockResolvedValue(null);

    await restreamer._initConfig();

    expect(restreamer.config).toMatchObject({
      hostname: '',
      http: { secure: false, host: '' },
      source: {
        network: {
          rtmp: { enabled: false, local: 'localhost' },
          srt: { enabled: false, local: 'localhost' },
          hls: { secure: false, local: 'localhost' },
        },
      },
      memfs: { auth: { enable: false, username: '', password: '' } },
      overrides: [],
    });
  });

  it('uses the configured public hostname when the core address uses a DNS name', async () => {
    const restreamer = client('https://core.example:8080');
    restreamer.Config = vi.fn().mockResolvedValue({
      config: {
        host: { name: ['public.example'] },
        tls: { enable: true, address: '0.0.0.0:8443' },
        address: '0.0.0.0:8080',
        rtmp: {
          enable: false,
          enable_tls: false,
          token: '',
          app: '/',
          address: '0.0.0.0:1935',
          address_tls: '0.0.0.0:1935',
        },
        srt: {
          enable: false,
          passphrase: '',
          token: '',
          address: '0.0.0.0:9000',
        },
        storage: {
          memory: { auth: { enable: false, username: '', password: '' } },
        },
        api: { auth: { enable: false, username: '', password: '' } },
      },
      overrides: [],
    });

    await restreamer._initConfig();

    const config = restreamer.config!;
    expect(config.hostname).toBe('core.example');
    expect(config.http.host).toBe('core.example:8443');
  });

  it('derives public hosts, protocol ports, credentials, and endpoint settings', async () => {
    const restreamer = client();
    restreamer.SetAddress('https://127.0.0.1/api');
    restreamer.Config = vi.fn().mockResolvedValue({
      config: {
        host: { name: ['core.example'] },
        tls: { enable: true, address: '0.0.0.0:8443' },
        address: '0.0.0.0:8080',
        rtmp: {
          enable: true,
          enable_tls: true,
          token: 'a b',
          app: '///live//',
          address: '0.0.0.0:1936',
          address_tls: '0.0.0.0:1937',
        },
        srt: {
          enable: true,
          passphrase: 'pass phrase',
          token: 'srt-token',
          address: '127.0.0.1:9000',
        },
        storage: {
          memory: {
            auth: { enable: true, username: 'user name', password: 'p/ss' },
          },
        },
        api: { auth: { enable: true, username: 'admin', password: 'secret' } },
      },
      overrides: ['source.network.rtmp'],
    });

    await restreamer._initConfig();

    expect(restreamer.config).toMatchObject({
      hostname: 'core.example',
      http: { secure: true, host: 'core.example:8443' },
      source: {
        network: {
          hls: {
            secure: true,
            host: 'core.example:8443',
            local: '0.0.0.0:8080',
            credentials: 'user%20name:p%2Fss',
          },
          rtmp: {
            enabled: true,
            secure: true,
            token: 'a%20b',
            app: '/live',
            host: 'core.example:1937',
            local: '0.0.0.0:1936',
          },
          srt: {
            enabled: true,
            token: 'srt-token',
            passphrase: 'pass phrase',
            host: 'core.example:9000',
            local: '127.0.0.1:9000',
          },
        },
      },
      api: { auth: { enable: true, username: 'admin', password: 'secret' } },
      overrides: ['source.network.rtmp'],
    });
  });

  it('uses caller hostnames and default HTTP ports when config addresses omit ports', async () => {
    const restreamer = client('http://localhost');
    restreamer.Config = vi.fn().mockResolvedValue({
      config: {
        host: { name: [] },
        tls: { enable: false, address: 'localhost:443' },
        address: 'localhost:80',
        rtmp: {
          enable: false,
          enable_tls: false,
          token: '',
          app: '/',
          address: 'localhost:1935',
          address_tls: 'localhost:1935',
        },
        srt: {
          enable: false,
          passphrase: '',
          token: '',
          address: 'localhost:9000',
        },
        storage: {
          memory: { auth: { enable: false, username: '', password: '' } },
        },
        api: { auth: { enable: false, username: '', password: '' } },
      },
      overrides: [],
    });
    await restreamer._initConfig();

    expect(restreamer.config).toMatchObject({
      hostname: 'localhost',
      http: { secure: false, host: 'localhost' },
      source: {
        network: {
          rtmp: { app: '', host: 'localhost', local: 'localhost' },
          srt: { host: 'localhost:9000', local: 'localhost:9000' },
          hls: { host: 'localhost', local: 'localhost' },
        },
      },
    });
  });

  it('parses IPv6 API hosts and port-only bind addresses', async () => {
    const restreamer = client('https://[::1]');
    restreamer.Config = vi.fn().mockResolvedValue({
      config: {
        host: { name: [] },
        tls: { enable: false, address: '443' },
        address: '8080',
        rtmp: {
          enable: true,
          enable_tls: false,
          token: '',
          app: 'live',
          address: '1936',
          address_tls: '1935',
        },
        srt: {
          enable: true,
          passphrase: '',
          token: '',
          address: '9000',
        },
        storage: {
          memory: { auth: { enable: false, username: '', password: '' } },
        },
        api: { auth: { enable: false, username: '', password: '' } },
      },
      overrides: [],
    });

    await restreamer._initConfig();

    expect(restreamer.config).toMatchObject({
      hostname: '[::1]',
      http: { secure: true, host: '[::1]' },
      source: {
        network: {
          hls: { local: 'localhost:8080' },
          rtmp: { app: '/live', host: '[::1]:1936', local: 'localhost:1936' },
          srt: { host: '[::1]:9000', local: 'localhost:9000' },
        },
      },
    });
  });

  it('uses the HTTPS default port when TLS bind address is empty', async () => {
    const restreamer = client('https://core.example');
    restreamer.Config = vi.fn().mockResolvedValue({
      config: {
        host: { name: [] },
        tls: { enable: false, address: '' },
        address: 'localhost',
        rtmp: {
          enable: true,
          enable_tls: true,
          token: '',
          app: '',
          address: 'localhost:1935',
          address_tls: 'localhost:1935',
        },
        srt: {
          enable: false,
          passphrase: '',
          token: '',
          address: 'localhost:9000',
        },
        storage: {
          memory: { auth: { enable: false, username: '', password: '' } },
        },
        api: { auth: { enable: false, username: '', password: '' } },
      },
      overrides: [],
    });

    await restreamer._initConfig();

    const config = restreamer.config!;
    expect(config.http).toEqual({
      secure: true,
      host: 'core.example',
    });
    expect(config.source.network.rtmp).toMatchObject({
      secure: true,
      host: 'core.example',
    });
  });

  it('returns config values, overrides, and a channel-scoped clone', () => {
    const restreamer = client();
    restreamer.channel = { channelid: 'channel-1' };
    restreamer.config = {
      overrides: ['source.network.rtmp'],
      source: { network: { rtmp: { enabled: true } } },
    };
    expect(restreamer.ConfigOverrides('source.network.rtmp')).toBe(true);
    expect(restreamer.ConfigOverrides('unknown')).toBe(false);
    expect(restreamer.ConfigValue('source.network.rtmp.enabled')).toBe(true);
    expect(restreamer.ConfigValue('source.missing')).toBeNull();
    const active = restreamer.ConfigActive();
    expect(active.source.network.channelid).toBe('channel-1');
    expect(restreamer.config.source.network).not.toHaveProperty('channelid');

    restreamer.config = null;
    expect(restreamer.ConfigOverrides('x')).toBe(false);
    expect(restreamer.ConfigValue('x')).toBeNull();
  });

  it('builds public HTTP and stream addresses across supported protocols', () => {
    const restreamer = client();
    restreamer.channel = { channelid: 'channel-1' };
    restreamer.config = {
      hostname: 'stream.example',
      http: { secure: true, host: 'stream.example:444' },
      source: {
        network: {
          rtmp: {
            host: 'stream.example:1936',
            secure: true,
            app: '/live',
            token: 'a b',
          },
          srt: {
            host: 'stream.example:9000',
            token: 'token',
            passphrase: 'secret',
          },
          hls: { host: 'stream.example:8080' },
        },
      },
    };
    restreamer.GetChannelPosterPath = vi.fn(
      (id, storage) => `${storage}/${id}.jpg`,
    );
    restreamer.GetChannelManifestPath = vi.fn(
      (id, storage) => `${storage}/${id}.m3u8`,
    );
    restreamer.GetChannelPlayerPath = vi.fn(() => 'player.html');

    expect(restreamer.GetPublicHTTPAddress()).toBe(
      'https://stream.example:444',
    );
    expect(restreamer.PrefixPublicHTTPAddress('poster.jpg')).toBe(
      'https://stream.example:444/poster.jpg',
    );
    expect(restreamer.PrefixPublicHTTPAddress('/poster.jpg')).toBe(
      'https://stream.example:444/poster.jpg',
    );
    expect(
      restreamer.PrefixPublicHTTPAddress('https://cdn.example/poster.jpg'),
    ).toBe('https://cdn.example/poster.jpg');
    expect(restreamer.GetPublicAddress('rtmp', 'channel-1')).toBe(
      'rtmps://stream.example:1936/live/channel-1.stream?token=a b',
    );
    expect(restreamer.GetPublicAddress('srt', 'channel-1')).toContain(
      'streamid=channel-1,mode:request,token:token&passphrase=secret',
    );
    expect(restreamer.GetPublicAddress('snapshot+memfs', 'channel-1')).toBe(
      'https://stream.example:8080/memfs/channel-1.jpg',
    );
    expect(restreamer.GetPublicAddress('snapshot+diskfs', 'channel-1')).toBe(
      'https://stream.example:8080/diskfs/channel-1.jpg',
    );
    expect(restreamer.GetPublicAddress('hls+memfs', 'channel-1')).toBe(
      'https://stream.example:8080/memfs/channel-1.m3u8',
    );
    expect(restreamer.GetPublicAddress('hls+diskfs', 'channel-1')).toBe(
      'https://stream.example:8080/diskfs/channel-1.m3u8',
    );
    expect(restreamer.GetPublicAddress('player', 'channel-1')).toBe(
      'https://stream.example:444/player.html',
    );
    expect(restreamer.GetPublicAddress('unknown', 'channel-1')).toBe('');
  });

  it('omits optional ports, tokens, and app paths for unsecured public addresses', () => {
    const restreamer = client();
    restreamer.channel = { channelid: 'channel' };
    restreamer.config = {
      hostname: 'stream.example',
      http: { secure: false, host: 'stream.example' },
      source: {
        network: {
          rtmp: { host: 'stream.example', secure: false, app: '', token: '' },
          srt: { host: 'stream.example', token: '', passphrase: '' },
          hls: { host: 'stream.example' },
        },
      },
    };
    restreamer.GetChannelPosterPath = vi.fn(() => 'memfs/channel.jpg');
    restreamer.GetChannelManifestPath = vi.fn(() => 'channel.m3u8');
    restreamer.GetChannelPlayerPath = vi.fn(() => 'channel.html');

    expect(restreamer.GetPublicAddress('rtmp', 'channel')).toBe(
      'rtmp://stream.example/channel.stream',
    );
    expect(restreamer.GetPublicAddress('srt', 'channel')).toBe(
      'srt://stream.example/?mode=caller&transtype=live&streamid=channel,mode:request',
    );
    expect(restreamer.GetPublicAddress('snapshot+memfs', 'channel')).toBe(
      'http://stream.example/memfs/channel.jpg',
    );
    expect(restreamer.GetPublicAddress('player', 'channel')).toBe(
      'http://stream.example/channel.html',
    );
  });

  it('returns logs and resources with error fallbacks', async () => {
    const restreamer = client();
    restreamer._call = vi
      .fn()
      .mockResolvedValueOnce([['line'], null])
      .mockResolvedValueOnce([null, { code: 500 }]);
    await expect(restreamer.Log()).resolves.toEqual(['line']);
    await expect(restreamer.Log()).resolves.toEqual([]);
    restreamer._getResources = vi.fn().mockResolvedValue({ cpu: 1 });
    await expect(restreamer.Resources()).resolves.toEqual({ cpu: 1 });
  });
});
