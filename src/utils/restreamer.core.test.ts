import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function createRestreamer(address = 'https://core.example/') {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  return new Restreamer(address);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Restreamer client basics', () => {
  it('normalizes valid addresses and falls back to the page origin for invalid ones', () => {
    const client = createRestreamer();
    expect(client.Address()).toBe('https://core.example');

    const invalid = createRestreamer('not a URL');
    expect(invalid.Address()).toBe(window.location.origin);
  });

  it('exposes about metadata and defensive copies of auth methods', () => {
    const client = createRestreamer();
    (client as any).about = {
      id: 'id-1',
      name: 'Core',
      created_at: new Date('2024-01-01T00:00:00Z'),
      version: { number: '2.0.0' },
      app: 'restreamer',
      auths: ['localjwt'],
    };

    expect(client.ID()).toBe('id-1');
    expect(client.Name()).toBe('Core');
    expect(client.Version()).toEqual({ number: '2.0.0' });
    expect(client.App()).toBe('restreamer');
    expect(client.CreatedAt()).toBeInstanceOf(Date);
    const auths = client.Auths();
    auths.push('changed');
    expect(client.Auths()).toEqual(['localjwt']);
  });

  it('updates valid addresses, accepts the current one, and rejects malformed ones', () => {
    const client = createRestreamer();
    const setAddress = vi.spyOn(client.api, 'SetAddress');

    expect(client.SetAddress('https://core.example')).toBe(true);
    expect(client.SetAddress('bad address')).toBe(false);
    expect(client.SetAddress('https://other.example')).toBeUndefined();
    expect(client.Address()).toBe('https://other.example');
    expect(setAddress).toHaveBeenCalledWith('https://other.example');
  });

  it('normalizes about data and resets all connection state', () => {
    const client = createRestreamer();
    const about = client._initAbout({
      created_at: '2024-03-04T05:06:07Z',
      auths: 'invalid',
      version: { number: '16.11.0' },
    });
    expect(about.created_at).toBeInstanceOf(Date);
    expect(about.auths).toEqual(['localjwt']);
    expect(about.version).toEqual({ number: '16.11.0' });

    client.connected = true;
    client.valid = true;
    client.skills = { ffmpeg: {} };
    client.config = { active: true };
    client._checkForUpdates = vi.fn();
    client.Reset();
    expect(client.connected).toBe(false);
    expect(client.valid).toBe(false);
    expect(client.skills).toBeNull();
    expect(client.config).toBeNull();
    expect(client._checkForUpdates).toHaveBeenCalledOnce();
  });

  it('rejects invalid dates and parses fractional and timezone offsets', () => {
    const client = createRestreamer();
    expect(
      client._initAbout({ created_at: 'not-a-date' }).created_at,
    ).toBeNull();
    expect(
      client._initAbout({ created_at: '2024-03-04 05:06:07' }).created_at,
    ).toEqual(new Date('2024-03-04T05:06:07Z'));
    expect(
      client._initAbout({ created_at: '2024-03-04T05:06:07.12+02:30' })
        .created_at,
    ).toBeInstanceOf(Date);
  });

  it('adds, removes, and dispatches only supported event severities', () => {
    const client = createRestreamer();
    const first = vi.fn();
    const second = vi.fn();
    expect(client.AddListener(first)).toBe(0);
    expect(client.AddListener(second)).toBe(1);
    client._dispatchEvent('warning', 'test', 'message', 'detail', 2);
    expect(first).toHaveBeenCalledWith({
      severity: 'warning',
      type: 'test',
      message: 'message: detail: 2',
    });
    client._dispatchEvent('invalid', 'test', 'ignored');
    expect(first).toHaveBeenCalledOnce();
    client.RemoveListener(0);
    client._dispatchEvent('info', 'test', 'plain');
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledWith({
      severity: 'info',
      type: 'test',
      message: 'plain',
    });
  });

  it('keeps connection and compatibility state consistent', () => {
    const client = createRestreamer();
    expect(client.IsConnected()).toBe(false);
    expect(client.Compatibility().compatible).toBe(false);
    client.valid = true;
    client.requiresLogin = false;
    expect(client.IsConnected()).toBe(true);
    client.about.version.number = '16.12.0';
    client.skills = { ffmpeg: { version: '8.1.0' } };
    expect(client.Compatibility()).toMatchObject({
      compatible: true,
      core: { compatible: true, have: '16.12.0' },
      ffmpeg: { compatible: true, have: '8.1.0' },
    });
    client.skills = null;
    expect(client.Compatibility()).toMatchObject({
      compatible: false,
      core: { compatible: true },
      ffmpeg: { compatible: false, have: '0.0.0' },
    });
  });

  it('dispatches API network and authentication errors and ignores suppressed errors', async () => {
    const client = createRestreamer();
    const listener = vi.fn();
    client.AddListener(listener);
    const request = vi.fn().mockResolvedValue({
      val: null,
      err: { code: -1, message: 'offline' },
    });
    client.api = {
      RefreshToken: vi.fn(),
      Login: vi.fn(),
      LoginWithToken: vi.fn(),
    } as never;
    client.api.RefreshToken = vi.fn();
    await expect(client._call(request, 'arg')).resolves.toEqual([
      null,
      { code: -1, message: 'offline' },
    ]);
    await client._call(request);
    expect(listener).toHaveBeenCalledWith({
      severity: 'error',
      type: 'network',
      message: 'offline',
    });

    request.mockResolvedValueOnce({
      val: null,
      err: { code: 401, message: 'expired' },
    });
    client.RefreshToken = vi.fn().mockResolvedValue(false);
    await client._call(request);
    expect(listener).toHaveBeenCalledWith({
      severity: 'error',
      type: 'auth',
      message: 'expired',
    });

    client.IgnoreAPIErrors(true);
    const calls = listener.mock.calls.length;
    request.mockResolvedValueOnce({
      val: null,
      err: { code: -1, message: 'ignored' },
    });
    await client._call(request);
    expect(listener).toHaveBeenCalledTimes(calls);
  });

  it('retries a request after a successful token refresh', async () => {
    const client = createRestreamer();
    const listener = vi.fn();
    client.AddListener(listener);
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        val: null,
        err: { code: 401, message: 'expired' },
      })
      .mockResolvedValueOnce({ val: 'ok', err: null });
    client.api = {
      RefreshToken: vi.fn(),
      Login: vi.fn(),
      LoginWithToken: vi.fn(),
    } as never;
    client.RefreshToken = vi.fn().mockResolvedValue(true);

    await expect(client._call(request, 'input')).resolves.toEqual(['ok', null]);
    expect(request).toHaveBeenCalledTimes(2);
    expect(listener).not.toHaveBeenCalled();
  });

  it('dispatches network and auth errors returned by a retried request', async () => {
    const client = createRestreamer();
    const listener = vi.fn();
    client.AddListener(listener);
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        val: null,
        err: { code: 401, message: 'expired' },
      })
      .mockResolvedValueOnce({
        val: null,
        err: { status: 'NETWORK_ERROR', message: 'offline' },
      })
      .mockResolvedValueOnce({
        val: null,
        err: { code: 401, message: 'expired again' },
      })
      .mockResolvedValueOnce({
        val: null,
        err: { code: 401, status: 'UNAUTHORIZED', message: 'expired again' },
      })
      .mockResolvedValueOnce({
        val: null,
        err: { code: 500, message: 'server error' },
      });
    client.api = {
      RefreshToken: vi.fn(),
      Login: vi.fn(),
      LoginWithToken: vi.fn(),
    } as never;
    client.RefreshToken = vi.fn().mockResolvedValue(true);

    await client._call(request);
    expect(listener).toHaveBeenLastCalledWith({
      severity: 'error',
      type: 'network',
      message: 'NETWORK_ERROR: offline',
    });

    await client._call(request);
    expect(listener).toHaveBeenLastCalledWith({
      severity: 'error',
      type: 'auth',
      message: 'UNAUTHORIZED: expired again',
    });

    const events = listener.mock.calls.length;
    await client._call(request);
    expect(listener).toHaveBeenCalledTimes(events);

    request
      .mockResolvedValueOnce({
        val: null,
        err: { code: 401, message: 'expired' },
      })
      .mockResolvedValueOnce({
        val: null,
        err: { code: 503, status: 'HTTP_ERROR', message: 'unavailable' },
      });
    await client._call(request);
    expect(listener).toHaveBeenCalledTimes(events);
  });

  it('handles refresh and login endpoints without unnecessary auth retries', async () => {
    const client = createRestreamer();
    const listener = vi.fn();
    client.AddListener(listener);
    const refreshRequest = vi.fn().mockResolvedValue({
      val: null,
      err: { code: 401, message: 'refresh expired' },
    });
    const loginRequest = vi.fn().mockResolvedValue({
      val: null,
      err: { code: 401, message: 'login rejected' },
    });
    const tokenLoginRequest = vi.fn().mockResolvedValue({
      val: null,
      err: { code: 401, message: 'token rejected' },
    });
    client.api = {
      RefreshToken: refreshRequest,
      Login: loginRequest,
      LoginWithToken: tokenLoginRequest,
    } as never;
    client.RefreshToken = vi.fn().mockResolvedValue(false);

    await client._call(refreshRequest);
    expect(client.RefreshToken).not.toHaveBeenCalled();
    expect(listener).toHaveBeenLastCalledWith({
      severity: 'error',
      type: 'auth',
      message: 'refresh expired',
    });

    listener.mockClear();
    await client._call(loginRequest);
    await client._call(tokenLoginRequest);
    expect(listener).not.toHaveBeenCalled();
  });

  it('returns ordinary HTTP errors without dispatching or retrying them', async () => {
    const client = createRestreamer();
    const listener = vi.fn();
    client.AddListener(listener);
    const request = vi.fn().mockResolvedValue({
      val: null,
      err: { code: 503, message: 'unavailable' },
    });

    await expect(client._call(request)).resolves.toEqual([
      null,
      { code: 503, message: 'unavailable' },
    ]);
    expect(request).toHaveBeenCalledOnce();
    expect(listener).not.toHaveBeenCalled();
  });

  it('sets and clears local auth tokens on logout', () => {
    const client = createRestreamer();
    const setToken = vi.spyOn(client.api, 'SetToken');
    client.Logout();
    client.refresh = window.setTimeout(() => {}, 10_000);
    client.Logout();
    expect(setToken).toHaveBeenCalledWith('');
    expect(client.refreshToken).toBeNull();
  });

  it('stores refresh tokens and accepts only decodable access tokens', () => {
    const client = createRestreamer();
    const setToken = vi.spyOn(client.api, 'SetToken');
    const scheduleRefresh = vi.spyOn(client, '_setTokenRefresh');
    client._setRefreshToken('refresh-token');
    expect(client._getRefreshToken()).toBe('refresh-token');

    const claims = btoa(JSON.stringify({ exi: 120 }));
    client._setAccessToken(`header.${claims}.signature`);
    expect(scheduleRefresh).toHaveBeenCalledWith(120);
    expect(setToken).toHaveBeenCalledWith(`header.${claims}.signature`);

    client._setAccessToken('invalid-token');
    expect(setToken).toHaveBeenLastCalledWith('');
    client._setAccessToken(null);
    client.Logout();
    expect(client._getRefreshToken()).toBe('false');
  });

  it('refreshes access tokens and loads only valid Core API metadata', async () => {
    const client = createRestreamer();
    client.requiresLogin = false;
    await expect(client.RefreshToken()).resolves.toBe(true);
    client.requiresLogin = true;
    client._getRefreshToken = vi.fn(() => null);
    await expect(client.RefreshToken()).resolves.toBe(false);

    client._getRefreshToken = vi.fn(() => 'refresh-token');
    client._call = vi.fn().mockResolvedValue([{ access_token: 'new' }, null]);
    client._setAccessToken = vi.fn();
    await expect(client.RefreshToken()).resolves.toBe(true);
    expect(client._setAccessToken).toHaveBeenCalledWith('new');

    client._call = vi.fn().mockResolvedValue([null, { message: 'expired' }]);
    await expect(client.RefreshToken()).resolves.toBe(false);
    client._call = vi.fn().mockResolvedValue([null, { message: 'offline' }]);
    await expect(client.About()).resolves.toBeNull();
    client._call = vi.fn().mockResolvedValue([null, null]);
    await expect(client.About()).resolves.toBeNull();
    client._call = vi.fn().mockResolvedValue(['not an object', null]);
    await expect(client.About()).resolves.toBeNull();
    client._call = vi.fn().mockResolvedValue([{ app: 'other' }, null]);
    await expect(client.About()).resolves.toBeNull();
    client._call = vi.fn().mockResolvedValue([
      {
        app: 'datarhei-core',
        id: 'id',
        auths: ['localjwt'],
        version: { number: '16.11.0' },
      },
      null,
    ]);
    await expect(client.About()).resolves.toMatchObject({
      id: 'id',
      app: 'datarhei-core',
    });
  });

  it('only initializes compatible cores and refreshes access before expiry', async () => {
    const client = createRestreamer();
    client.Compatibility = vi
      .fn()
      .mockReturnValue({ core: { compatible: false } });
    client._initConfig = vi.fn();
    client._discoverChannels = vi.fn();
    client._initSkills = vi.fn();
    await client._init();
    expect(client._initConfig).not.toHaveBeenCalled();

    client.Compatibility = vi
      .fn()
      .mockReturnValue({ core: { compatible: true } });
    await client._init();
    expect(client._initConfig).toHaveBeenCalledOnce();
    expect(client._discoverChannels).toHaveBeenCalledOnce();
    expect(client._initSkills).toHaveBeenCalledOnce();

    vi.useFakeTimers();
    client.RefreshToken = vi.fn().mockResolvedValue(true);
    client._setTokenRefresh(61);
    await vi.advanceTimersByTimeAsync(1000);
    expect(client.RefreshToken).toHaveBeenCalledOnce();
    client._setTokenRefresh(30);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(client.RefreshToken).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('validates unauthenticated cores and initializes connected ones', async () => {
    const client = createRestreamer();
    client._getRefreshToken = vi.fn(() => null);
    client.About = vi.fn().mockResolvedValue({
      id: '',
      name: 'Core',
      created_at: null,
      version: { number: '16.11.0' },
      auths: [],
    });
    await expect(client.Validate()).resolves.toBe(true);
    expect(client.valid).toBe(true);
    expect(client.requiresLogin).toBe(true);
    expect(client.connected).toBe(false);

    client.About = vi.fn().mockResolvedValue({
      id: 'core-1',
      name: 'Core',
      created_at: null,
      version: { number: '16.11.0' },
      auths: [],
    });
    client._init = vi.fn().mockResolvedValue(undefined);
    await expect(client.Validate()).resolves.toBe(true);
    expect(client.requiresLogin).toBe(false);
    expect(client.IsConnected()).toBe(true);

    const clearRefreshToken = vi.fn();
    client._getRefreshToken = vi.fn(() => 'expired-refresh-token');
    client.RefreshToken = vi.fn().mockResolvedValue(false);
    client._setRefreshToken = clearRefreshToken;
    await expect(client.Validate()).resolves.toBe(true);
    expect(clearRefreshToken).toHaveBeenCalledWith(null);
  });

  it.each([
    ['Login', ['username', 'password']],
    ['LoginWithToken', ['token']],
  ])(
    'covers %s bypass, error, and successful login paths',
    async (method, args) => {
      const restreamer = createRestreamer();
      const init = vi.fn().mockResolvedValue(undefined);
      restreamer._init = init;
      restreamer.requiresLogin = false;
      await expect((restreamer as any)[method](...args)).resolves.toBe(true);
      expect(init).toHaveBeenCalledOnce();

      restreamer.requiresLogin = true;
      restreamer._call = vi
        .fn()
        .mockResolvedValue([null, { message: 'denied' }]);
      await expect((restreamer as any)[method](...args)).resolves.toBe(false);

      restreamer._call = vi
        .fn()
        .mockResolvedValue([
          { access_token: 'access', refresh_token: 'refresh' },
          null,
        ]);
      restreamer.About = vi.fn().mockResolvedValue(null);
      await expect((restreamer as any)[method](...args)).resolves.toBe(false);

      restreamer.About = vi
        .fn()
        .mockResolvedValue({ id: '', version: {}, auths: [] });
      await expect((restreamer as any)[method](...args)).resolves.toBe(false);

      restreamer.About = vi.fn().mockResolvedValue({
        id: 'core-1',
        version: { number: '16.11.0' },
        auths: ['localjwt'],
      });
      await expect((restreamer as any)[method](...args)).resolves.toBe(true);
      expect(restreamer.connected).toBe(true);
      expect(init).toHaveBeenCalledTimes(2);
    },
  );

  it('returns false for unavailable API details and initializes a logged in core', async () => {
    const client = createRestreamer();
    client._getRefreshToken = vi.fn(() => null);
    client.About = vi.fn().mockResolvedValue(null);
    await expect(client.Validate()).resolves.toBe(false);

    client._getRefreshToken = vi.fn(() => 'refresh-token');
    client.RefreshToken = vi.fn().mockResolvedValue(true);
    client.About = vi.fn().mockResolvedValue({
      id: 'core-1',
      name: 'Core',
      created_at: null,
      version: { number: '16.11.0' },
      auths: [],
    });
    client._init = vi.fn().mockResolvedValue(undefined);
    await expect(client.Validate()).resolves.toBe(true);
    expect(client.connected).toBe(true);
    expect(client._init).toHaveBeenCalledOnce();
  });
});

describe('Restreamer process progress conversion', () => {
  const state = (overrides: Record<string, any> = {}) => ({
    order: 'start',
    command: ['ffmpeg'],
    exec: 'running',
    runtime_seconds: 12,
    cpu_usage: 2,
    memory_bytes: 3,
    reconnect_seconds: undefined,
    last_logline: '',
    progress: {
      fps: 1,
      bitrate_kbit: 2,
      speed: 3,
      quality: 4,
      frames: 5,
      drop: 6,
      dup: 7,
      outputs: [],
      ...overrides.progress,
    },
    ...overrides,
  });

  it('returns the initialized disconnected progress for null state', () => {
    const client = createRestreamer();
    expect(client._getProgressFromState(null)).toEqual({
      valid: false,
      order: 'stop',
      state: 'disconnected',
      error: '',
      reconnect: -1,
      bitrate: 0,
      fps: 0,
      time: 0,
      speed: 0,
      q: -1,
      frames: 0,
      drop: 0,
      dup: 0,
      command: [],
      cpu: 0,
      memory: 0,
      video_codec: '',
      audio_codec: '',
    });
  });

  it.each([
    ['starting', 'connecting'],
    ['finishing', 'disconnecting'],
    ['finished', 'disconnected'],
    ['killed', 'error'],
    ['failed', 'error'],
    ['other', 'disconnected'],
  ])('maps %s process state to %s', (exec, expected) => {
    const client = createRestreamer();
    const result = client._getProgressFromState(state({ exec }));
    expect(result).toMatchObject({
      valid: true,
      state: expected,
      order: 'start',
      command: ['ffmpeg'],
    });
  });

  it('only reports a running process as connected after ten seconds and with FPS', () => {
    const client = createRestreamer();
    expect(
      client._getProgressFromState(state({ runtime_seconds: 9 })).state,
    ).toBe('connecting');
    expect(
      client._getProgressFromState(state({ progress: { fps: 0 } })).state,
    ).toBe('connecting');
    expect(client._getProgressFromState(state()).state).toBe('connected');
  });

  it('extracts runtime metrics and audio/video codecs for connected states', () => {
    const client = createRestreamer();
    const result = client._getProgressFromState(
      state({
        progress: {
          fps: 30,
          bitrate_kbit: 1000,
          speed: 1.5,
          quality: 20,
          frames: 600,
          drop: 2,
          dup: 3,
          outputs: [
            { type: 'video', codec: 'h264' },
            { type: 'audio', codec: 'aac' },
          ],
        },
        runtime_seconds: 20,
        cpu_usage: 25,
        memory_bytes: 512,
      }),
    );

    expect(result).toMatchObject({
      state: 'connected',
      bitrate: 1000,
      fps: 30,
      time: 20,
      speed: 1.5,
      q: 20,
      frames: 600,
      drop: 2,
      dup: 3,
      cpu: 25,
      memory: 512,
      video_codec: 'h264',
      audio_codec: 'aac',
    });
  });

  it('uses fallback values for missing metrics and logs', () => {
    const client = createRestreamer();
    const result = client._getProgressFromState(
      state({
        progress: { fps: 30, outputs: [{ type: 'subtitle' }] },
        cpu_usage: undefined,
        memory_bytes: undefined,
      }),
    );
    expect(result).toMatchObject({
      state: 'connected',
      bitrate: 0,
      speed: 0,
      q: -1,
      frames: 0,
      drop: 0,
      dup: 0,
      cpu: 0,
      memory: 0,
      video_codec: '',
      audio_codec: '',
    });

    expect(
      client._getProgressFromState(
        state({ exec: 'failed', last_logline: 'failure' }),
      ),
    ).toMatchObject({ state: 'error', error: 'failure', reconnect: -1 });
    expect(
      client._getProgressFromState(
        state({ exec: 'finished', reconnect_seconds: 8 }),
      ),
    ).toMatchObject({ state: 'disconnected', reconnect: 8 });
  });
});
