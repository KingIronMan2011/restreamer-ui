import { describe, expect, it, vi } from 'vitest';

import { UpsertIngest } from './ingest';

function createControl(overrides: Record<string, any> = {}) {
  return {
    process: {
      autostart: true,
      reconnect: true,
      delay: '2',
      staleTimeout: '3',
      low_delay: false,
      ...overrides.process,
    },
    limits: { cpu_usage: '4', memory_mbytes: '5', waitfor_seconds: '6' },
    rtmp: { enable: false },
    srt: { enable: false },
    hls: {
      storage: 'memfs',
      master_playlist: false,
      segmentDuration: '4',
      listSize: '5',
      version: 6,
      lhls: false,
      cleanup: false,
      ...overrides.hls,
    },
    ...overrides,
  };
}

function createClient() {
  const channel = { id: 'ingest-id', channelid: 'channel-1', available: false };
  return {
    channel,
    client: {
      GetChannel: vi.fn(() => channel),
      ConfigActive: vi.fn(() => ({
        source: {
          network: { rtmp: { enabled: true }, srt: { enabled: true } },
        },
      })),
      GetPublicHTTPAddress: vi.fn(() => 'https://public.example'),
      _upsertProcess: vi.fn().mockResolvedValue(['process-id', null]),
      SetChannel: vi.fn(),
    },
  };
}

describe('UpsertIngest', () => {
  it('returns an error for an unknown channel', async () => {
    const { client } = createClient();
    client.GetChannel.mockReturnValue(null as never);

    await expect(
      UpsertIngest.call(
        client as never,
        'missing',
        [],
        [],
        [],
        createControl(),
      ),
    ).resolves.toEqual([null, { message: 'Unknown channel ID' }]);
    expect(client._upsertProcess).not.toHaveBeenCalled();
  });

  it('handles an ingest with no input addresses', async () => {
    const { client } = createClient();
    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [],
      [{ options: [] }],
      createControl(),
    );
    expect(client._upsertProcess).toHaveBeenCalledOnce();
  });

  it('creates a basic memfs HLS output and marks the channel available', async () => {
    const { client, channel } = createClient();
    const outputs = [{ options: ['-c:v', 'copy'] }];

    await expect(
      UpsertIngest.call(
        client as never,
        'channel-1',
        ['-global'],
        [{ address: 'rtmp://input', options: ['-i'] }],
        outputs,
        createControl(),
      ),
    ).resolves.toEqual(['process-id', null]);

    const process = client._upsertProcess.mock.calls[0][1];
    expect(process.input[0]).toEqual({
      id: 'input_0',
      address: 'rtmp://input',
      options: ['-i'],
    });
    expect(process.output[0].address).toBe('{memfs}/channel-1.m3u8');
    expect(process.output[0].options).toContain(
      'title=https://public.example/channel-1/oembed.json',
    );
    expect(process.output[0].options).toContain(
      'service_provider=datarhei-Restreamer',
    );
    expect(process.output[0].options).toContain('-hls_segment_filename');
    expect(process.output[0].options.join(' ')).toContain('channel-1_%04d.ts');
    expect(process.options).toContain('-y');
    expect(process.limits).toEqual({
      cpu_usage: 4,
      memory_mbytes: 5,
      waitfor_seconds: 6,
    });
    expect(client.SetChannel).toHaveBeenCalledWith('channel-1', {
      ...channel,
      available: true,
    });
  });

  it('builds disk HLS v7 master playlists, fMP4 cleanup, and AAC bitstream filters', async () => {
    const { client } = createClient();
    const control = createControl({
      process: { low_delay: true },
      hls: {
        storage: 'diskfs',
        master_playlist: true,
        segmentDuration: '6',
        listSize: '3',
        version: 7,
        lhls: false,
        cleanup: true,
      },
    });

    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [{ address: 'file', options: [] }],
      [{ options: ['-codec:a', 'copy'] }],
      control,
    );

    const output = client._upsertProcess.mock.calls[0][1].output[0];
    expect(output.address).toBe('{diskfs}/channel-1_{outputid}.m3u8');
    expect(output.options.join(' ')).toContain(
      'channel-1/{outputid}/%Y%m%d/%s.mp4',
    );
    expect(output.options).toContain('aac_adtstoasc');
    expect(output.cleanup).toHaveLength(5);
    expect(output.cleanup[1].max_file_age_seconds).toBe(54);
    expect(output.cleanup[2].max_files).toBe(9);
    expect(output.cleanup[3].pattern).toBe('diskfs:/channel-1.m3u8');
    expect(output.cleanup[4].pattern).toBe('diskfs:/channel-1.mp4');
  });

  it('uses tee output for enabled network destinations', async () => {
    const { client } = createClient();
    const control = createControl({
      process: { low_delay: true },
      rtmp: { enable: true },
      srt: { enable: true },
      hls: {
        storage: 'memfs',
        version: 7,
        master_playlist: false,
        segmentDuration: '4',
        listSize: '5',
      },
    });

    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [{ address: 'https://source.example/live', options: [] }],
      [{ options: ['-codec:a', 'copy'] }],
      control,
    );

    const output = client._upsertProcess.mock.calls[0][1].output[0];
    expect(output.address).toContain('[bsfs/a=aac_adtstoasc:');
    expect(output.address).toContain('|[f=flv]{rtmp,name=channel-1.stream}');
    expect(output.address).toContain(
      '|[f=mpegts]{srt,name=channel-1,mode=publish}',
    );
    expect(output.options).toContain('+low_delay+global_header');
    expect(output.options).toContain('-f');
    expect(control.rtmp.enable).toBe(true);
    expect(control.srt.enable).toBe(true);

    control.process.low_delay = false;
    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [{ address: 'https://source.example/live', options: [] }],
      [{ options: [] }],
      control,
    );
    const standardTeeOutput = client._upsertProcess.mock.calls[1][1].output[0];
    expect(standardTeeOutput.options).toContain('+global_header');
    expect(standardTeeOutput.options).not.toContain('+low_delay+global_header');
  });

  it('enables RTMP and SRT controls when inputs use local Restreamer streams', async () => {
    const { client } = createClient();
    const control = createControl({
      rtmp: { enable: false },
      srt: { enable: true },
    });

    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [
        {
          address: '{rtmp,name=channel-1.stream} {srt,name=channel-1}',
          options: [],
        },
      ],
      [{ options: [] }],
      control,
    );

    const output = client._upsertProcess.mock.calls[0][1].output[0];
    expect(output.address).toBe('{memfs}/channel-1.m3u8');
    expect(control.rtmp.enable).toBe(true);
    expect(control.srt.enable).toBe(true);
  });

  it('handles ingest-marked local RTMP and zero-size disk HLS cleanup cases', async () => {
    const { client } = createClient();
    const control = createControl({
      rtmp: { enable: true },
      hls: {
        storage: 'diskfs',
        master_playlist: false,
        segmentDuration: '4',
        listSize: '0',
        version: 7,
        lhls: false,
        cleanup: true,
      },
    });

    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [{ address: 'rtmp://localhost/channel-1/ingest', options: [] }],
      [{ options: [] }],
      control,
    );
    let output = client._upsertProcess.mock.calls[0][1].output[0];
    expect(output.address).toContain('|[f=flv]{rtmp,name=channel-1.stream}');
    expect(output.address).not.toContain('|[f=mpegts]');
    expect(output.cleanup).toHaveLength(4);
    expect(output.cleanup[1].max_file_age_seconds).toBe(0);
    expect(output.cleanup[3].max_file_age_seconds).toBe(0);

    control.hls.master_playlist = true;
    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [{ address: 'https://source.example/live', options: [] }],
      [{ options: [] }],
      control,
    );
    output = client._upsertProcess.mock.calls[1][1].output[0];
    expect(output.cleanup).toHaveLength(5);
    expect(output.cleanup[3].max_file_age_seconds).toBe(0);
    expect(output.cleanup[4].max_file_age_seconds).toBe(0);
  });

  it('creates SRT-only tee outputs', async () => {
    const { client } = createClient();
    const control = createControl({ srt: { enable: true } });
    await UpsertIngest.call(
      client as never,
      'channel-1',
      [],
      [{ address: 'https://source.example/live', options: [] }],
      [{ options: [] }],
      control,
    );

    const address = client._upsertProcess.mock.calls[0][1].output[0].address;
    expect(address).toContain('|[f=mpegts]{srt,name=channel-1,mode=publish}');
    expect(address).not.toContain('|[f=flv]');
  });

  it('uses legacy HLS parameters, cleanup without a playlist, and returns upsert errors', async () => {
    const { client } = createClient();
    client._upsertProcess.mockResolvedValue(['value', { code: 500 }]);
    const control = createControl({
      hls: {
        storage: 'memfs',
        version: 4,
        master_playlist: false,
        listSize: '0',
        cleanup: true,
        lhls: true,
      },
    });

    await expect(
      UpsertIngest.call(
        client as never,
        'channel-1',
        [],
        [{ address: '', options: [] }],
        [{ options: [] }],
        control,
      ),
    ).resolves.toEqual(['value', { code: 500 }]);
    const output = client._upsertProcess.mock.calls[0][1].output[0];
    expect(output.options).toContain('-hls_time');
    expect(output.options).toContain('-hls_list_size');
    expect(output.cleanup).toHaveLength(3);
    expect(output.cleanup[1].max_file_age_seconds).toBe(0);
    expect(client.SetChannel).not.toHaveBeenCalled();
  });
});
