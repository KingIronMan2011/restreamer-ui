import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetch } from './fetch';
import API from './api';

vi.mock('./fetch', () => ({ fetch: vi.fn() }));

const mockFetch = vi.mocked(fetch);
const jsonResponse = (body: unknown, status = 200, statusText = 'OK') => ({
  ok: status >= 200 && status < 300,
  status,
  statusText,
  headers: { get: (key: string) => key === 'Content-Type' ? 'application/json' : null },
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
    await expect(api._GET('/expected-json', { expect: 'json' })).resolves.toMatchObject({
      err: { code: -2, message: expect.stringContaining('text/plain') },
      val: null,
    });
  });

  it('parses JSON and text error responses', async () => {
    const api = new API('https://core.example');
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({ code: 401, message: 'Denied', status: 'unauthorized' }, 401, 'Unauthorized') as never,
      )
      .mockResolvedValueOnce(textResponse('Unavailable', 503, 'Service Unavailable') as never)
      .mockResolvedValueOnce(jsonResponse(['bad'], 400, 'Bad Request') as never);

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
