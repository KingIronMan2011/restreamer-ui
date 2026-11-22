import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function client() {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  return new Restreamer('https://core.example');
}

afterEach(() => vi.restoreAllMocks());

describe('Restreamer process and metadata adapters', () => {
  it('sanitizes incomplete process records and extracts namespaced metadata', () => {
    const restreamer = client();
    const empty = restreamer._sanitizeProcess({});
    expect(empty).toMatchObject({
      id: '',
      config: null,
      state: null,
      report: null,
      metadata: {},
      progress: { valid: false, state: 'disconnected' },
    });

    const populated = restreamer._sanitizeProcess({
      id: 'process-1',
      config: {},
      state: null,
      report: {},
      metadata: {
        'restreamer-ui': { name: 'Stream' },
        other: { secret: true },
      },
    });
    expect(populated.metadata).toEqual({ name: 'Stream' });
    expect(populated.id).toBe('process-1');

    populated.metadata = { other: { secret: true } };
    expect(restreamer._sanitizeProcess(populated).metadata).toEqual({});
  });

  it('sets and gets application metadata and handles Core errors', async () => {
    const restreamer = client();
    const call = vi
      .fn()
      .mockResolvedValueOnce([null, null])
      .mockResolvedValueOnce([{ theme: 'dark' }, null])
      .mockResolvedValueOnce([null, { code: 500 }])
      .mockResolvedValueOnce([null, { code: 500 }]);
    restreamer._call = call;

    await expect(restreamer._setMetadata({ theme: 'dark' })).resolves.toBe(
      true,
    );
    await expect(restreamer._getMetadata()).resolves.toEqual({ theme: 'dark' });
    await expect(restreamer._setMetadata({})).resolves.toBe(false);
    await expect(restreamer._getMetadata()).resolves.toBeNull();
    expect(call.mock.calls[0].slice(1)).toEqual([
      'restreamer-ui',
      { theme: 'dark' },
    ]);
  });

  it('lists, fetches, and sanitizes processes through the API adapter', async () => {
    const restreamer = client();
    const call = vi
      .fn()
      .mockResolvedValueOnce([[{ id: 'one' }, { id: 'two' }], null])
      .mockResolvedValueOnce([null, { code: 500 }])
      .mockResolvedValueOnce([{ id: 'one' }, null])
      .mockResolvedValueOnce([null, { code: 500 }]);
    restreamer._call = call;

    await expect(
      restreamer._listProcesses(['running'], 'channel', ['one']),
    ).resolves.toMatchObject([
      { id: 'one', progress: { valid: false }, metadata: {} },
      { id: 'two', progress: { valid: false }, metadata: {} },
    ]);
    await expect(restreamer._listProcesses()).resolves.toEqual([]);
    await expect(restreamer._getProcess('one')).resolves.toMatchObject({
      id: 'one',
      progress: { valid: false },
      metadata: {},
    });
    await expect(restreamer._getProcess('bad')).resolves.toBeNull();
  });

  it('delegates process state, report, debug, and metadata accessors', async () => {
    const restreamer = client();
    const responses = [
      [{ config: true }, null],
      [{ state: true }, null],
      [{ report: true }, null],
      [{ config: null, state: null, report: null }, null],
      [null, null],
      [null, null],
      [null, { code: 500 }],
      [{ metadata: true }, null],
      [null, { code: 500 }],
    ];
    const call = vi.fn();
    for (const response of responses) call.mockResolvedValueOnce(response);
    restreamer._call = call;

    await expect(restreamer._getProcessConfig('one')).resolves.toEqual({
      config: true,
    });
    await expect(restreamer._getProcessState('one')).resolves.toEqual({
      state: true,
    });
    await expect(restreamer._getProcessLog('one')).resolves.toEqual({
      report: true,
    });
    await expect(restreamer._getProcessDebug('one')).resolves.toMatchObject({
      config: null,
      state: null,
      report: null,
    });
    await expect(restreamer._startProcess('one')).resolves.toBe(true);
    await expect(restreamer._stopProcess('one')).resolves.toBe(true);
    await expect(restreamer._upsertProcess('one', {})).resolves.toEqual([
      null,
      { code: 500 },
    ]);
    await expect(restreamer._getProcessMetadata('one')).resolves.toEqual({
      metadata: true,
    });
    await expect(restreamer._getProcessMetadata('one')).resolves.toBeNull();
  });

  it('adds after missing updates and handles deletes and metadata writes', async () => {
    const restreamer = client();
    const call = vi
      .fn()
      .mockResolvedValueOnce([null, { code: 404 }])
      .mockResolvedValueOnce([{ id: 'new' }, null])
      .mockResolvedValueOnce([null, { code: 404 }])
      .mockResolvedValueOnce([null, { code: 500 }])
      .mockResolvedValueOnce([null, null])
      .mockResolvedValueOnce([null, { code: 500 }]);
    restreamer._call = call;

    await expect(
      restreamer._upsertProcess('one', { name: 'x' }),
    ).resolves.toEqual([{ id: 'new' }, null]);
    await expect(restreamer._deleteProcess('one')).resolves.toBe(true);
    await expect(restreamer._deleteProcess('two')).resolves.toBe(false);
    await expect(
      restreamer._setProcessMetadata('one', { name: 'stream' }),
    ).resolves.toBe(true);
    await expect(restreamer._setProcessMetadata('one', {})).resolves.toBe(
      false,
    );
  });
});
