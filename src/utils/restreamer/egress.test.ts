import { describe, expect, it, vi } from 'vitest';

import { UpdateEgress } from './egress';

const config = (source: string) => ({
  source: { source },
  process: {
    autostart: true,
    reconnect: true,
    delay: '2',
    staleTimeout: '3',
    low_delay: false,
  },
  limits: { cpu_usage: '4', memory_mbytes: '5', waitfor_seconds: '6' },
});

function createClient() {
  const channel = { channelid: 'channel-1', egresses: ['egress-1'] };
  const egress = { id: 'egress-1', channelid: 'channel-1' };
  const client = {
    GetChannel: vi.fn(() => channel),
    GetChannelEgress: vi.fn(() => egress),
    Skills: vi.fn(() => ({
      ffmpeg: { version_major: 6 },
      codecs: { video: { hevc: [], av1: [], vp9: [] } },
    })),
    _upsertProcess: vi.fn().mockResolvedValue(['process-1', null]),
  };
  return { client, channel, egress };
}

describe('UpdateEgress', () => {
  it('returns null if the channel, egress reference, or egress is missing', async () => {
    const { client, channel } = createClient();
    client.GetChannel.mockReturnValueOnce(null as never);
    await expect(
      UpdateEgress.call(
        client as never,
        'channel-1',
        'egress-1',
        [],
        [],
        [],
        config('srt'),
      ),
    ).resolves.toBeNull();

    client.GetChannel.mockReturnValue(channel);
    channel.egresses = [];
    await expect(
      UpdateEgress.call(
        client as never,
        'channel-1',
        'egress-1',
        [],
        [],
        [],
        config('srt'),
      ),
    ).resolves.toBeNull();

    channel.egresses = ['egress-1'];
    client.GetChannelEgress.mockReturnValueOnce(null as never);
    await expect(
      UpdateEgress.call(
        client as never,
        'channel-1',
        'egress-1',
        [],
        [],
        [],
        config('srt'),
      ),
    ).resolves.toBeNull();
    expect(client._upsertProcess).not.toHaveBeenCalled();
  });

  it.each([
    ['hls+memfs', '{memfs}/channel-1.m3u8', ['-re']],
    ['hls+diskfs', '{diskfs}/channel-1.m3u8', ['-re']],
    ['srt', '{srt,name=channel-1,mode=request}', []],
    ['other', '', []],
  ])(
    'builds the input address for %s sources',
    async (source, address, baseOptions) => {
      const { client } = createClient();
      const result = await UpdateEgress.call(
        client as never,
        'channel-1',
        'egress-1',
        ['-global'],
        [{ options: ['-input'] }],
        { address: 'rtmp://destination', options: ['-output'] },
        config(source),
      );

      expect(result).toEqual(['process-1', null]);
      const process = client._upsertProcess.mock.calls[0][1];
      expect(process.input[0]).toEqual({
        id: 'input_0',
        address,
        options: [...baseOptions, '-input'],
      });
      expect(process.output).toEqual([
        { id: 'output_0', address: 'rtmp://destination', options: ['-output'] },
      ]);
      expect(process.options).toEqual([
        '-loglevel',
        'level+info',
        '-err_detect',
        'ignore_err',
        '-global',
      ]);
      expect(process.limits).toEqual({
        cpu_usage: 4,
        memory_mbytes: 5,
        waitfor_seconds: 6,
      });
    },
  );

  it('adds available enhanced RTMP codecs for FFmpeg 6 or newer', async () => {
    const { client } = createClient();
    client.Skills.mockReturnValue({
      ffmpeg: { version_major: 7 },
      codecs: { video: { hevc: ['hevc'], av1: ['av1'], vp9: ['vp9'] } },
    } as never);
    await UpdateEgress.call(
      client as never,
      'channel-1',
      'egress-1',
      [],
      [{ options: [] }],
      [],
      config('rtmp'),
    );

    expect(client._upsertProcess.mock.calls[0][1].input[0]).toMatchObject({
      address: '{rtmp,name=channel-1.stream}',
      options: ['-rtmp_enhanced_codecs', 'hvc1,av01,vp09'],
    });
  });

  it('omits enhanced codecs for older FFmpeg and when none are available', async () => {
    const older = createClient();
    older.client.Skills.mockReturnValue({
      ffmpeg: { version_major: 5 },
      codecs: { video: { hevc: ['hevc'], av1: ['av1'], vp9: ['vp9'] } },
    } as never);
    await UpdateEgress.call(
      older.client as never,
      'channel-1',
      'egress-1',
      [],
      [{ options: [] }],
      [],
      config('rtmp'),
    );
    expect(
      older.client._upsertProcess.mock.calls[0][1].input[0].options,
    ).toEqual([]);

    const noCodecs = createClient();
    await UpdateEgress.call(
      noCodecs.client as never,
      'channel-1',
      'egress-1',
      [],
      [{ options: [] }],
      [],
      config('rtmp'),
    );
    expect(
      noCodecs.client._upsertProcess.mock.calls[0][1].input[0].options,
    ).toEqual([]);
  });

  it('converts non-array output options, applies low-delay flags, and emits per-output IDs', async () => {
    const { client } = createClient();
    const control = config('srt');
    control.process.low_delay = true;
    const outputs = [
      { address: 'first', options: null as never },
      { address: 'second', options: ['-c:v', 2] },
    ];

    await UpdateEgress.call(
      client as never,
      'channel-1',
      'egress-1',
      [],
      [{ options: [] }],
      outputs,
      control,
    );

    expect(client._upsertProcess.mock.calls[0][1].output).toEqual([
      { id: 'output_0', address: 'first', options: ['-flags', '+low_delay'] },
      {
        id: 'output_1',
        address: 'second',
        options: ['-flags', '+low_delay', '-c:v', '2'],
      },
    ]);
  });
});
