import * as Metadata from './metadata';

describe('metadata defaults and normalization', () => {
  it('returns independent defaults and preserves configured values', () => {
    const first = Metadata.getDefaultMetadata();
    first.playersite.title = 'changed';
    expect(Metadata.getDefaultMetadata().playersite.title).not.toBe('changed');

    expect(Metadata.initMetadata(null)).toMatchObject({
      playersite: {},
      bundle: {},
    });
    expect(
      Metadata.mergeMetadata({ playersite: { title: 'Site' } }).playersite,
    ).toMatchObject({
      title: 'Site',
    });
  });

  it('fills ingest and egress defaults and normalizes child arrays', () => {
    const ingest = Metadata.initIngestMetadata({
      meta: { name: 'Channel' },
      sources: [
        { type: 'network', inputs: [{ address: 'https://source.example' }] },
      ],
      profiles: [
        {
          video: { encoder: { mapping: ['-preset', 'fast'] } },
          audio: { source: 1 },
        },
      ],
      streams: [{ type: 'video', codec: 'h264' }],
    });
    expect(ingest.meta).toMatchObject({
      name: 'Channel',
      author: { name: '' },
    });
    expect(ingest.sources[0]).toMatchObject({
      type: 'network',
      settings: {},
      streams: [],
    });
    expect(ingest.profiles[0].video.encoder.mapping).toEqual({
      global: [],
      local: ['-preset', 'fast'],
      filter: [],
    });
    expect(ingest.profiles[0].custom).toMatchObject({
      selected: true,
      stream: -2,
    });
    expect(ingest.streams[0]).toMatchObject({
      width: 0,
      height: 0,
      type: 'video',
    });

    const empty = Metadata.mergeIngestMetadata({
      sources: {},
      profiles: {},
      streams: {},
    });
    expect(empty.sources).toEqual([]);
    expect(empty.profiles).toHaveLength(1);
    expect(empty.streams).toEqual([]);

    const egress = Metadata.initEgressMetadata({
      outputs: [{ address: 'rtmp://destination' }],
      profiles: [{ audio: { decoder: { mapping: ['-ac', '2'] } } }],
      streams: [{ type: 'audio', codec: 'aac' }],
    });
    expect(egress.outputs[0]).toEqual({
      address: 'rtmp://destination',
      options: [],
    });
    expect(egress.profiles[0].audio.decoder.mapping).toEqual({
      global: [],
      local: ['-ac', '2'],
      filter: [],
    });
    expect(egress.streams[0]).toMatchObject({ channels: 0, codec: 'aac' });
    expect(
      Metadata.mergeEgressMetadata({
        outputs: null,
        profiles: null,
        streams: null,
      }),
    ).toMatchObject({
      outputs: [],
      profiles: [{}],
      streams: [],
    });
  });

  it('migrates legacy audio filters while leaving copy and disabled encoders alone', () => {
    const migrated = Metadata.initIngestMetadata({
      version: '1.1.0',
      profiles: [
        {
          audio: {
            encoder: {
              coder: 'aac',
              settings: { channels: 2, layout: 'stereo', sampling: 48000 },
            },
          },
        },
        { audio: { encoder: { coder: 'copy', settings: {} } } },
        { audio: { encoder: { coder: 'none', settings: {} } } },
      ],
    });

    expect(migrated.version).toBe('1.2.0');
    expect(migrated.profiles[0].audio.encoder.settings).not.toHaveProperty(
      'channels',
    );
    expect(migrated.profiles[0].audio.filter.graph).toContain('aresample');
    expect(migrated.profiles[1].audio.filter.graph).toBe('');
    expect(migrated.profiles[2].audio.filter.graph).toBe('');
  });

  it('normalizes profiles with array and object mappings and removes unused sources', () => {
    const profile = Metadata.initProfile({
      video: {
        encoder: { mapping: ['-crf', '20'] },
        decoder: { mapping: { local: ['-threads', '2'] } },
        overlays: 'invalid',
      },
      audio: {
        source: 1,
        encoder: { mapping: ['-b:a', '128k'] },
        decoder: { mapping: { global: ['-ar', '48000'] } },
      },
    });
    expect(profile.video.encoder.mapping.local).toEqual(['-crf', '20']);
    expect(profile.video.decoder.mapping).toMatchObject({
      global: [],
      local: ['-threads', '2'],
      filter: [],
    });
    expect(profile.video.overlays).toEqual([]);
    expect(profile.audio.encoder.mapping.local).toEqual(['-b:a', '128k']);
    expect(profile.audio.decoder.mapping).toMatchObject({
      global: ['-ar', '48000'],
      local: [],
      filter: [],
    });
    expect(
      Metadata.cleanupSources({ video: 'v', audio: 'a', unused: 'x' }),
    ).toEqual(['v', 'a']);

    profile.video.stream = 0;
    profile.audio.stream = 1;
    expect(Metadata.cleanupProfile(profile)).toMatchObject({
      video: { source: 0 },
      audio: { source: 1 },
      custom: { selected: true },
    });
    profile.video.stream = -1;
    profile.audio.stream = -1;
    expect(Metadata.cleanupProfile(profile)).toMatchObject({
      video: { source: -1 },
      audio: { source: -1 },
    });
  });
});

describe('stream analysis', () => {
  it.each([
    ['video', [], 'error'],
    ['audio', [], 'error'],
    ['video', [{ type: 'audio' }], 'nostream'],
    ['audio', [{ type: 'video' }], 'nostream'],
    ['unknown', [{ type: 'subtitle' }], 'error'],
    ['video', [{ type: 'audio' }, { type: 'video' }], 'success'],
    ['audio', [{ type: 'video' }, { type: 'audio' }], 'success'],
  ])('analyzes %s streams into %s', (type, streams, expected) => {
    expect(Metadata.analyzeStreams(type, streams)).toBe(expected);
  });
});

describe('profile selection and validation', () => {
  const profile = (overrides: Record<string, any> = {}) =>
    Metadata.initProfile({
      video: {
        source: -1,
        stream: -1,
        encoder: { coder: 'none' },
        ...overrides.video,
      },
      audio: {
        source: -1,
        stream: -1,
        encoder: { coder: 'none' },
        ...overrides.audio,
      },
      ...overrides,
    });

  it('validates selected streams and handles video requirements and overlays', () => {
    const sources = [
      {
        inputs: [{}],
        streams: [
          { index: 0, type: 'video' },
          { index: 0, type: 'audio' },
        ],
      },
    ];
    expect(
      Metadata.validateProfile(
        sources as never,
        profile({
          video: { source: 0, stream: 0, encoder: { coder: 'libx264' } },
          audio: { source: 0, stream: 1, encoder: { coder: 'aac' } },
        }) as never,
      ),
    ).toBe(true);

    expect(Metadata.validateProfile(sources as never, profile(), false)).toBe(
      true,
    );
    expect(Metadata.validateProfile(sources as never, profile(), true)).toBe(
      false,
    );
    expect(
      Metadata.validateProfile(
        sources as never,
        profile({
          video: {
            source: 0,
            stream: 0,
            encoder: { coder: 'copy' },
            overlays: [{ path: '/logo.png' }],
          },
        }) as never,
      ),
    ).toBe(false);
    expect(
      Metadata.validateProfile(
        sources as never,
        profile({
          video: { source: 0, stream: 9, encoder: { coder: 'libx264' } },
        }) as never,
      ),
    ).toBe(false);
  });

  it('preselects copied streams, encoders, and missing-stream defaults', () => {
    const streams = [
      { type: 'video', codec: 'h264' },
      { type: 'audio', codec: 'aac' },
    ];
    const selected = Metadata.preselectProfile('video', streams, profile(), {
      video: [],
      audio: [],
    });
    expect(selected.video).toMatchObject({
      source: 0,
      stream: 0,
      encoder: { coder: 'copy' },
    });
    expect(selected.audio).toMatchObject({
      source: 0,
      stream: 1,
      encoder: { coder: 'copy' },
    });
    expect(selected.custom).toMatchObject({ selected: false, stream: 1 });

    const missing = Metadata.preselectProfile('video', [], profile(), {
      video: [],
      audio: [],
    });
    expect(missing.video).toMatchObject({
      stream: -1,
      encoder: { coder: 'none' },
    });
    expect(missing.audio).toMatchObject({
      stream: -1,
      encoder: { coder: 'none' },
    });
    expect(missing.custom).toMatchObject({ selected: false, stream: -1 });

    const unselectedAudio = profile();
    Metadata.preselectProfile(
      'video',
      streams,
      unselectedAudio,
      { video: [], audio: [] },
      false,
    );
    expect(unselectedAudio.audio.stream).toBe(-1);
  });

  it('preselects audio-only profiles and keeps plausible encoder choices', () => {
    const audio = profile();
    Metadata.preselectProfile(
      'audio',
      [{ type: 'audio', codec: 'mp3' }],
      audio,
      {
        audio: [],
        video: [],
      },
    );
    expect(audio.audio).toMatchObject({
      source: 1,
      stream: 0,
      encoder: { coder: 'copy' },
    });

    const video = profile({
      video: { source: 0, stream: 0, encoder: { coder: 'copy' } },
      audio: { source: 0, stream: 1, encoder: { coder: 'copy' } },
    });
    Metadata.preselectProfile(
      'video',
      [
        { type: 'video', codec: 'h264' },
        { type: 'audio', codec: 'aac' },
      ],
      video,
      { audio: [], video: [] },
    );
    expect(video.video.encoder.coder).toBe('copy');
    expect(video.audio.encoder.coder).toBe('copy');
  });
});

describe('generated stream and input output mappings', () => {
  it('creates encoded and copied output streams and skips incomplete profiles', () => {
    const sources = [
      {
        inputs: [{ address: 'input', options: [] }],
        streams: [
          {
            index: 0,
            stream: 4,
            type: 'video',
            codec: 'h264',
            width: 1920,
            height: 1080,
          },
          {
            index: 0,
            stream: 5,
            type: 'audio',
            codec: 'aac',
            sampling_hz: 48000,
            layout: 'stereo',
            channels: 2,
          },
        ],
      },
    ];
    const profiles = [
      Metadata.initProfile({
        video: { source: 0, stream: 0, encoder: { coder: 'copy' } },
        audio: { source: 0, stream: 1, encoder: { coder: 'copy' } },
      }),
      Metadata.initProfile({
        video: { source: 0, stream: 0, encoder: { coder: 'libx264' } },
        audio: { source: 0, stream: 1, encoder: { coder: 'aac' } },
      }),
      Metadata.initProfile({}),
    ];

    expect(
      Metadata.createOutputStreams(sources as never, profiles as never),
    ).toMatchObject([
      { stream: 0, type: 'video', codec: 'h264', width: 1920, height: 1080 },
      {
        stream: 1,
        type: 'audio',
        codec: 'aac',
        sampling_hz: 48000,
        channels: 2,
      },
      { stream: 2, type: 'video', codec: 'h264' },
      { stream: 3, type: 'audio', codec: 'aac' },
    ]);
  });

  it('deduplicates shared input streams, applies filters, and combines global options', () => {
    const sources = [
      {
        inputs: [{ address: 'input', options: ['-thread_queue_size', '10'] }],
        streams: [
          {
            index: 0,
            stream: 0,
            type: 'video',
            codec: 'h264',
            width: 1280,
            height: 720,
          },
          { index: 0, stream: 1, type: 'audio', codec: 'aac', channels: 2 },
        ],
      },
    ];
    const profile = Metadata.initProfile({
      video: {
        source: 0,
        stream: 0,
        encoder: {
          coder: 'libx264',
          mapping: {
            global: [['-y'], ['-y']],
            local: ['-c:v', 'libx264'],
            filter: ['format=yuv420p'],
          },
        },
        decoder: {
          mapping: { global: [['-hide_banner']], local: ['-threads', '1'] },
        },
        filter: { graph: 'scale=640:360' },
      },
      audio: {
        source: 0,
        stream: 1,
        encoder: {
          coder: 'copy',
          mapping: { global: [['-y']], local: ['-c:a', 'copy'] },
        },
        decoder: { mapping: { global: [], local: ['-threads', '1'] } },
      },
    });

    const [global, inputs, outputs] = Metadata.createInputsOutputs(
      sources as never,
      [profile as never],
    );
    expect(inputs).toHaveLength(1);
    expect(inputs[0].options).toEqual([
      '-threads',
      '1',
      '-threads',
      '1',
      '-thread_queue_size',
      '10',
    ]);
    expect(global).toEqual(['-hide_banner', '-y']);
    expect(outputs[0].options).toContain('0:0');
    expect(outputs[0].options).toContain('0:1');
    expect(outputs[0].options).toContain('scale=640:360,format=yuv420p');
  });
});
