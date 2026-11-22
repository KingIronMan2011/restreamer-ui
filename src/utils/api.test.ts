import { beforeEach, describe, expect, it, vi } from 'vitest';

import API from './api';
import { fetch } from './fetch';

vi.mock('./fetch', () => ({ fetch: vi.fn() }));

const mockFetch = vi.mocked(fetch);
const jsonResponse = (body: unknown, status = 200, statusText = 'OK') => ({
  ok: status >= 200 && status < 300,
  status,
  statusText,
  headers: {
    get: (key: string) => (key === 'Content-Type' ? 'application/json' : null),
  },
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});
const textResponse = (body: string, status = 200, statusText = 'OK') => ({
  ok: status >= 200 && status < 300,
  status,
  statusText,
  headers: { get: () => 'text/plain' },
  json: vi.fn(),
  text: vi.fn().mockResolvedValue(body),
});

describe('API request handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('sends JSON requests with bearer tokens and trims trailing slashes', async () => {
    const api = new API('https://core.example');
    api.SetToken('access-token');
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }) as never);

    const result = await api._POST('/status/', { expect: 'json' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://core.example/api/status',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer access-token' },
      }),
    );
    expect(result).toEqual({ err: null, val: { ok: true } });
  });

  it('gets tokens from an async token provider and honors explicit tokens', async () => {
    const api = new API('https://core.example');
    const tokenProvider = vi.fn().mockResolvedValue('provider-token');
    api.SetToken(tokenProvider);
    mockFetch.mockResolvedValue(textResponse('ok') as never);

    await api._GET('/first');
    await api._GET('/second', { token: 'explicit-token' });

    expect(tokenProvider).toHaveBeenCalledOnce();
    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      headers: { Authorization: 'Bearer provider-token' },
    });
    expect(mockFetch.mock.calls[1][1]).toMatchObject({
      headers: { Authorization: 'Bearer explicit-token' },
    });
  });

  it('returns cached GET values without sharing mutable references', async () => {
    const api = new API('https://core.example');
    mockFetch.mockResolvedValue(jsonResponse({ value: 1 }) as never);

    const first = await api._GET('/cached');
    first.val.value = 99;
    const second = await api._GET('/cached');

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(second.val).toEqual({ value: 1 });
  });

  it('returns text responses and reports an unexpected non-JSON response', async () => {
    const api = new API('https://core.example');
    mockFetch.mockResolvedValue(textResponse('plain result') as never);

    await expect(api._GET('/text')).resolves.toMatchObject({
      err: null,
      val: 'plain result',
    });
    await expect(
      api._GET('/expected-json', { expect: 'json' }),
    ).resolves.toMatchObject({
      err: { code: -2, message: expect.stringContaining('text/plain') },
      val: null,
    });
  });

  it('parses JSON and text error responses', async () => {
    const api = new API('https://core.example');
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(
          { code: 401, message: 'Denied', status: 'unauthorized' },
          401,
          'Unauthorized',
        ) as never,
      )
      .mockResolvedValueOnce(
        textResponse('Unavailable', 503, 'Service Unavailable') as never,
      )
      .mockResolvedValueOnce(
        jsonResponse(['bad'], 400, 'Bad Request') as never,
      );

    await expect(api._GET('/json-error')).resolves.toMatchObject({
      err: { code: 401, message: 'Denied', status: 'unauthorized' },
    });
    await expect(api._GET('/text-error')).resolves.toMatchObject({
      err: { code: 503, message: 'Unavailable' },
    });
    await expect(api._GET('/array-error')).resolves.toMatchObject({
      err: { code: 400, message: 'bad' },
    });
  });

  it('converts network failures to API errors and clears cache when token changes', async () => {
    const api = new API('https://core.example');
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    await expect(api._GET('/offline')).resolves.toMatchObject({
      err: { code: -1, message: 'network down' },
    });

    mockFetch.mockResolvedValue(jsonResponse({ value: 1 }) as never);
    await api._GET('/cached');
    api.SetToken('new-token');
    await api._GET('/cached');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

describe('API endpoint wrappers', () => {
  const cases: Array<[string, unknown[], string, string]> = [
    ['Login', ['user', 'pass'], '_POST', '/login'],
    ['LoginWithToken', ['token'], '_POST', '/login'],
    ['RefreshToken', ['refresh'], '_GET', '/login/refresh'],
    ['About', [], '_GET', '/'],
    ['Skills', [], '_GET', '/v3/skills'],
    ['SkillsReload', [], '_GET', '/v3/skills/reload'],
    ['Config', ['active'], '_GET', '/v3/config'],
    ['ConfigSet', [{ enabled: true }], '_PUT', '/v3/config'],
    ['ConfigReload', ['active'], '_GET', '/v3/config/reload'],
    ['Log', [], '_GET', '/v3/log'],
    [
      'ActiveSessions',
      [['rtmp', 'srt']],
      '_GET',
      '/v3/session/active?collectors=rtmp%2Csrt',
    ],
    ['SetMetadata', ['x/y', { name: 'test' }], '_PUT', '/v3/metadata/x%2Fy'],
    ['GetMetadata', ['x/y'], '_GET', '/v3/metadata/x%2Fy'],
    ['DataHasFile', ['/image.png'], '_HEAD', '/v3/fs/disk/image.png'],
    ['DataPutFile', ['/image.png', 'data'], '_PUT', '/v3/fs/disk/image.png'],
    ['DataGetFile', ['/image.png'], '_GET', '/v3/fs/disk/image.png'],
    ['DataListFiles', ['*.png'], '_GET', '/v3/fs/disk?glob=*.png'],
    ['DataDeleteFile', ['/image.png'], '_DELETE', '/v3/fs/disk/image.png'],
    ['MemFSListFiles', ['*.m3u8'], '_GET', '/v3/fs/mem?glob=*.m3u8'],
    ['MemFSHasFile', ['/index.m3u8'], '_HEAD', '/v3/fs/mem/index.m3u8'],
    ['MemFSDeleteFile', ['/index.m3u8'], '_DELETE', '/v3/fs/mem/index.m3u8'],
    [
      'MemFSLinkFile',
      ['index.m3u8', 'target'],
      '_PATCH',
      '/v3/fs/mem/index.m3u8',
    ],
    ['ProcessConfig', ['a/b'], '_GET', '/v3/process/a%2Fb/config'],
    ['ProcessState', ['a/b'], '_GET', '/v3/process/a%2Fb/state'],
    ['ProcessReport', ['a/b'], '_GET', '/v3/process/a%2Fb/report'],
    ['ProcessCommand', ['a/b', 'restart'], '_PUT', '/v3/process/a%2Fb/command'],
    ['ProcessDelete', ['a/b'], '_DELETE', '/v3/process/a%2Fb'],
    ['ProcessUpdate', ['a/b', { name: 'x' }], '_PUT', '/v3/process/a%2Fb'],
    [
      'ProcessSetMetadata',
      ['a/b', 'x/y', { name: 'x' }],
      '_PUT',
      '/v3/process/a%2Fb/metadata/x%2Fy',
    ],
    [
      'ProcessGetMetadata',
      ['a/b', 'x/y'],
      '_GET',
      '/v3/process/a%2Fb/metadata/x%2Fy',
    ],
    ['ProcessAdd', [{ name: 'x' }], '_POST', '/v3/process'],
    ['ProcessProbe', ['a/b'], '_GET', '/v3/process/a%2Fb/probe'],
    ['Metrics', [{ query: 'x' }], '_POST', '/v3/metrics'],
  ];

  it.each(cases)('%s delegates to %s %s', async (name, args, method, path) => {
    const api = new API('https://core.example');
    const expected = { err: null, val: 'stubbed' };
    const call = vi.fn().mockResolvedValue(expected);
    (api as any)[method] = call;

    await (api as any)[name](...args);

    expect(call).toHaveBeenCalled();
    expect(call.mock.calls[0][0]).toBe(path);
  });

  it('encodes process list and filter query values', async () => {
    const api = new API('https://core.example');
    api._GET = vi.fn().mockResolvedValue({ err: null, val: [] });

    await api.Processes('my channel', ['one', 'two'], ['running', 'idle']);
    await api.Process('my channel', ['running', 'idle']);

    expect(api._GET).toHaveBeenNthCalledWith(
      1,
      '/v3/process?reference=my%20channel&id=one%2Ctwo&filter=running%2Cidle',
      { expect: 'json' },
    );
    expect(api._GET).toHaveBeenNthCalledWith(
      2,
      '/v3/process/my channel?filter=running%2Cidle',
      { expect: 'json' },
    );
  });

  it('normalizes RTMP and SRT channel lists and passes through errors', async () => {
    const api = new API('https://core.example');
    api._GET = vi
      .fn()
      .mockResolvedValueOnce({
        err: null,
        val: [{ name: 'one' }, { name: 'two' }],
      })
      .mockResolvedValueOnce({
        err: null,
        val: { publisher: { alpha: {}, beta: {} } },
      })
      .mockResolvedValueOnce({
        err: { code: 500, message: 'failed' },
        val: null,
      });

    await expect(api.RTMPChannels()).resolves.toMatchObject({
      val: ['one', 'two'],
    });
    await expect(api.SRTChannels()).resolves.toMatchObject({
      val: ['alpha', 'beta'],
    });
    await expect(api.RTMPChannels()).resolves.toMatchObject({
      err: { code: 500 },
    });
  });

  it('routes each HTTP helper through the shared call implementation', async () => {
    const api = new API('https://core.example');
    const call = vi.fn().mockResolvedValue({ err: null, val: null });
    api._call = call;

    await api._HEAD('/head');
    await api._POST('/post');
    await api._PUT('/put');
    await api._DELETE('/delete');
    await api._PATCH('/patch');

    expect(call.mock.calls.map(([method, path]) => [method, path])).toEqual([
      ['HEAD', '/head'],
      ['POST', '/post'],
      ['PUT', '/put'],
      ['DELETE', '/delete'],
      ['PATCH', '/patch'],
    ]);
  });

  it('updates the API address and expires stale GET cache entries', async () => {
    const api = new API('https://old.example');
    api.SetAddress('https://new.example');
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000);
    mockFetch.mockResolvedValue(jsonResponse({ value: 1 }) as never);

    await api._GET('/cached');
    now.mockReturnValue(2000);
    await api._GET('/cached');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      'https://new.example/api/cached',
      expect.any(Object),
    );
    now.mockRestore();
  });

  it('preserves structured JSON errors and returns SRT API errors unchanged', async () => {
    const api = new API('https://core.example');
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ reason: 'maintenance' }, 500) as never,
    );

    await expect(api._GET('/structured-error')).resolves.toMatchObject({
      err: { message: { reason: 'maintenance' } },
    });

    const error = { code: 500, message: 'failed' };
    api._GET = vi.fn().mockResolvedValue({ err: error, val: null });
    await expect(api.SRTChannels()).resolves.toEqual({ err: error, val: null });
  });

  it('handles absent content types and empty error bodies', async () => {
    const api = new API('https://core.example');
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => null },
      json: vi.fn(),
      text: vi.fn().mockResolvedValue(''),
    } as never);

    await expect(api._GET('/missing')).resolves.toMatchObject({
      err: { code: 404, message: 'Not Found' },
    });
  });

  it('stringifies JSON error arrays and null messages and ignores non-string status', async () => {
    const api = new API('https://core.example');
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({ code: 400, message: ['bad'], status: 4 }, 400) as never,
      )
      .mockResolvedValueOnce(
        jsonResponse({ code: 400, message: null }, 400) as never,
      );

    await expect(api._GET('/array')).resolves.toMatchObject({
      err: { code: 400, message: 'bad' },
    });
    await expect(api._GET('/null')).resolves.toMatchObject({
      err: { code: 400, message: 'null' },
    });
  });

  it('supports empty process queries', async () => {
    const api = new API('https://core.example');
    api._GET = vi.fn().mockResolvedValue({ err: null, val: [] });

    await api.Processes();
    await api.Process('all');

    expect(api._GET).toHaveBeenNthCalledWith(1, '/v3/process', {
      expect: 'json',
    });
    expect(api._GET).toHaveBeenNthCalledWith(2, '/v3/process/all', {
      expect: 'json',
    });
  });

  it('keeps the root path unchanged when the API base is empty', async () => {
    const api = new API('https://core.example');
    api.base = '/';
    mockFetch.mockResolvedValue(textResponse('root') as never);

    await api._call('GET', '');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://core.example/',
      expect.any(Object),
    );
  });
});
