import { describe, expect, it, vi } from 'vitest';

import * as ProcessOperations from './process';

const createCall = (value: any = {}, error: any = null) => {
  const call = vi.fn().mockResolvedValue([value, error]);
  return call;
};
const api = {
  Processes: vi.fn(),
  Process: vi.fn(),
  ProcessConfig: vi.fn(),
  ProcessState: vi.fn(),
  ProcessReport: vi.fn(),
  ProcessCommand: vi.fn(),
  ProcessUpdate: vi.fn(),
  ProcessAdd: vi.fn(),
  ProcessDelete: vi.fn(),
  ProcessSetMetadata: vi.fn(),
  ProcessGetMetadata: vi.fn(),
};
const sanitize = vi.fn((value) => ({ ...value, sanitized: true }));

describe('process operations', () => {
  it('lists and sanitizes processes, or returns an empty list on errors', async () => {
    const call = createCall([{ id: '1' }, { id: '2' }]);
    await expect(
      ProcessOperations.listProcesses(api, call, sanitize, ['running'], 'ref', [
        '1',
      ]),
    ).resolves.toEqual([
      { id: '1', sanitized: true },
      { id: '2', sanitized: true },
    ]);
    expect(call).toHaveBeenCalledWith(api.Processes, 'ref', ['1'], ['running']);

    await expect(
      ProcessOperations.listProcesses(
        api,
        createCall([], { code: 500 }),
        sanitize,
        [],
        '',
        [],
      ),
    ).resolves.toEqual([]);
  });

  it('gets and sanitizes one process and passes through related records', async () => {
    await expect(
      ProcessOperations.getProcess(
        api,
        createCall({ id: 'x' }),
        sanitize,
        'x',
        [],
      ),
    ).resolves.toEqual({ id: 'x', sanitized: true });
    await expect(
      ProcessOperations.getProcess(
        api,
        createCall(null, { code: 500 }),
        sanitize,
        'x',
        [],
      ),
    ).resolves.toBeNull();

    for (const [operation, method] of [
      [ProcessOperations.getProcessConfig, api.ProcessConfig],
      [ProcessOperations.getProcessState, api.ProcessState],
      [ProcessOperations.getProcessLog, api.ProcessReport],
      [ProcessOperations.getProcessMetadata, api.ProcessGetMetadata],
    ] as const) {
      await expect(operation(api, createCall('value'), 'x')).resolves.toBe(
        'value',
      );
      await expect(
        operation(api, createCall(null, { code: 500 }), 'x'),
      ).resolves.toBeNull();
      expect(method).toBeDefined();
    }
  });

  it('redacts URLs and secrets from populated process debug details', async () => {
    const process = {
      config: {
        options: [
          '-metadata',
          'rtmp://user:secret@localhost/live?token=private',
        ],
        input: [
          {
            address: 'https://source.example/live',
            options: ['srt://localhost?streamid=secret'],
          },
        ],
        output: [
          {
            address: 'https://output.example/live',
            options: ['rtmp://localhost/live?token=private'],
          },
        ],
      },
      state: {
        progress: {
          inputs: [{ address: 'https://source.example/path' }],
          outputs: [{ address: 'https://output.example/path' }],
        },
        last_logline: 'Failed at /channels/main/private',
      },
      report: {
        log: [[1, 'Connected to https://output.example/path']],
        history: [
          {
            prelude: ['https://source.example'],
            log: [[2, 'rtmp://localhost/live?token=hidden']],
          },
        ],
      },
    };
    const result = await ProcessOperations.getProcessDebug(
      api,
      createCall(process),
      'process-1',
    );

    expect(result.config.options[1]).toBe(
      'rtmp://***:***@localhost/live?token=***',
    );
    expect(result.config.input[0].address).toBe('https://[anonymized]');
    expect(result.config.input[0].options[0]).toContain('streamid=***');
    expect(result.state.command).toEqual([]);
    expect(result.state.progress.outputs[0].address).toBe(
      'https://[anonymized]',
    );
    expect(result.report.prelude).toEqual([]);
    expect(result.report.log[0][1]).toContain('https://[anonymized]');
    expect(result.report.history[0].prelude[0]).toBe('https://[anonymized]');
  });

  it('handles absent debug sections and process errors', async () => {
    const minimal = {
      state: {
        progress: { inputs: [], outputs: [] },
        command: ['start'],
        last_logline: '',
      },
    };
    await expect(
      ProcessOperations.getProcessDebug(api, createCall(minimal), 'x'),
    ).resolves.toBe(minimal);
    await expect(
      ProcessOperations.getProcessDebug(
        api,
        createCall(null, { code: 500 }),
        'x',
      ),
    ).resolves.toBeNull();

    const reportOnly = { report: { prelude: [], log: [], history: [] } };
    await expect(
      ProcessOperations.getProcessDebug(api, createCall(reportOnly), 'x'),
    ).resolves.toBe(reportOnly);
  });

  it('starts and stops processes based on Core success', async () => {
    expect(
      await ProcessOperations.startProcess(api, createCall(null), 'x'),
    ).toBe(true);
    expect(
      await ProcessOperations.stopProcess(
        api,
        createCall(null, { code: 500 }),
        'x',
      ),
    ).toBe(false);
  });

  it('adds missing processes after update 404 and otherwise returns update result', async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce([null, { code: 404 }])
      .mockResolvedValueOnce(['added', null]);
    const config = { name: 'x' };
    await expect(
      ProcessOperations.upsertProcess(api, call, 'x', config),
    ).resolves.toEqual(['added', null]);
    expect(call.mock.calls).toEqual([
      [api.ProcessUpdate, 'x', config],
      [api.ProcessAdd, config],
    ]);

    await expect(
      ProcessOperations.upsertProcess(
        api,
        createCall('updated', null),
        'x',
        {},
      ),
    ).resolves.toEqual(['updated', null]);
  });

  it('treats missing deletes as success and stores process metadata', async () => {
    expect(
      await ProcessOperations.deleteProcess(api, createCall(null), 'x'),
    ).toBe(true);
    expect(
      await ProcessOperations.deleteProcess(
        api,
        createCall(null, { code: 404 }),
        'x',
      ),
    ).toBe(true);
    expect(
      await ProcessOperations.deleteProcess(
        api,
        createCall(null, { code: 500 }),
        'x',
      ),
    ).toBe(false);
    expect(
      await ProcessOperations.setProcessMetadata(api, createCall(null), 'x', {
        name: 'a',
      }),
    ).toBe(true);
    expect(
      await ProcessOperations.setProcessMetadata(
        api,
        createCall(null, { code: 500 }),
        'x',
        {},
      ),
    ).toBe(false);
  });
});
