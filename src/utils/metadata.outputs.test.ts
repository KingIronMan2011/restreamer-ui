import * as Metadata from './metadata';

const createSource = () => ({
  inputs: [{ address: 'https://source.example/live.m3u8', options: [] }],
  streams: [
    {
      index: 0,
      stream: 0,
      type: 'video',
      codec: 'h264',
      width: 1280,
      height: 720,
    },
  ] as any[],
});

const createProfile = (overrides: Record<string, any> = {}) => {
  const { video: videoOverrides = {}, ...profileOverrides } = overrides;
  return Metadata.initProfile({
    ...profileOverrides,
    video: {
      source: 0,
      stream: 0,
      ...videoOverrides,
      encoder: {
        coder: 'libx264',
        ...videoOverrides.encoder,
        mapping: {
          global: [],
          local: ['-c:v', 'libx264'],
          filter: [],
          ...videoOverrides.encoder?.mapping,
        },
      },
    },
  });
};

describe('metadata output generation', () => {
  it('maps the selected video stream and disables absent audio', () => {
    const [global, inputs, outputs] = Metadata.createInputsOutputs(
      [createSource()],
      [createProfile()],
    );

    expect(global).toEqual([]);
    expect(inputs).toHaveLength(1);
    expect(outputs[0].options).toEqual([
      '-map',
      '0:0',
      '-c:v',
      'libx264',
      '-an',
    ]);
  });

  it('combines profile and encoder filters in order', () => {
    const profile = createProfile({
      video: {
        filter: { graph: 'scale=1280:720' },
        encoder: {
          mapping: {
            filter: ['format=yuv420p'],
          },
        },
      },
    });

    const [, , outputs] = Metadata.createInputsOutputs(
      [createSource()],
      [profile],
    );

    expect(outputs[0].options).toContain('-filter:v');
    expect(outputs[0].options).toContain('scale=1280:720,format=yuv420p');
  });

  it('keeps a profile-level video filter when no encoder filters are set', () => {
    const profile = createProfile({
      video: { filter: { graph: 'scale=640:360' } },
    });
    const [, , outputs] = Metadata.createInputsOutputs(
      [createSource()],
      [profile],
    );

    expect(outputs[0].options).toContain('scale=640:360');
  });

  it('builds a separate overlay graph for each output profile', () => {
    const profile = createProfile({
      video: {
        overlays: [
          {
            path: '/channels/channel/logo.png',
            width: '200',
            height: '',
            x: '10',
            y: '20',
          },
        ],
        encoder: { mapping: { filter: ['format=yuv420p'] } },
      },
    });

    const [, inputs, outputs] = Metadata.createInputsOutputs(
      [createSource()],
      [profile, structuredClone(profile)],
    );

    expect(inputs).toHaveLength(3);
    expect(outputs[0].options.join(' ')).toContain('overlay_profile_0');
    expect(outputs[1].options.join(' ')).toContain('overlay_profile_1');
    expect(outputs[0].options.join(' ')).toContain('x=10:y=20');
    expect(outputs[1].options.join(' ')).toContain('x=10:y=20');
  });

  it('rejects overlays when video is configured for stream copy', () => {
    const profile = createProfile({
      video: {
        encoder: {
          coder: 'copy',
        },
        overlays: [{ path: '/channels/channel/logo.png' }],
      },
    });

    expect(Metadata.validateProfile([createSource()], profile)).toBe(false);
  });

  it('treats absent overlays as empty when validating and generating options', () => {
    const profile = createProfile({
      video: { encoder: { coder: 'copy' }, overlays: null },
    });

    expect(Metadata.validateProfile([createSource()], profile)).toBe(true);
    const [, , outputs] = Metadata.createInputsOutputs(
      [createSource()],
      [profile],
    );
    expect(outputs[0].options).toContain('-map');
    expect(outputs[0].options).not.toContain('-filter_complex');
  });

  it('builds centered overlays for hardware decode and VAAPI output', () => {
    const profile = createProfile({
      video: {
        decoder: { coder: 'h264_cuvid' },
        filter: { graph: 'scale=640:360' },
        encoder: {
          coder: 'h264_vaapi',
          mapping: {
            filter: ['format=nv12', 'hwupload', 'deinterlace_vaapi'],
          },
        },
        overlays: [
          {
            path: '{diskfs}/logo.png',
            width: '9000',
            height: 'invalid',
            x: '',
            y: 'invalid',
          },
        ],
      },
    });

    const [, inputs, outputs] = Metadata.createInputsOutputs(
      [createSource()],
      [profile],
    );
    const options = outputs[0].options.join(' ');

    expect(inputs[1].address).toBe('{diskfs}/logo.png');
    expect(options).toContain('hwdownload,format=nv12,scale=640:360');
    expect(options).toContain('null[overlay_profile_0_image_0]');
    expect(options).toContain('overlay=x=(W-w)/2:y=(H-h)/2');
    expect(options).toContain('deinterlace_vaapi,format=nv12,hwupload');
  });

  it('combines audio filters and reuses a shared input', () => {
    const source = createSource();
    source.streams.push({
      index: 0,
      stream: 1,
      type: 'audio',
      codec: 'opus',
      channels: 2,
      layout: 'stereo',
      sampling_hz: 48000,
    });
    const profile = createProfile({
      audio: {
        source: 0,
        stream: 1,
        encoder: {
          coder: 'aac',
          mapping: {
            global: [],
            local: ['-c:a', 'aac'],
            filter: ['aresample=48000'],
          },
        },
        filter: { graph: 'volume=0.5' },
      },
    });

    const [, inputs, outputs] = Metadata.createInputsOutputs(
      [source],
      [profile],
    );

    expect(inputs).toHaveLength(1);
    expect(outputs[0].options).toContain('0:1');
    expect(outputs[0].options).toContain('volume=0.5,aresample=48000');
  });

  it('keeps a profile-level audio filter when no encoder filters are set', () => {
    const source = createSource();
    source.streams.push({
      index: 0,
      stream: 1,
      type: 'audio',
      codec: 'aac',
      channels: 2,
      layout: 'stereo',
      sampling_hz: 48000,
    });
    const profile = createProfile({
      audio: {
        source: 0,
        stream: 1,
        encoder: { coder: 'aac' },
        filter: { graph: 'volume=0.5' },
      },
    });
    const [, , outputs] = Metadata.createInputsOutputs([source], [profile]);

    expect(outputs[0].options).toContain('volume=0.5');
  });

  it('skips incomplete profiles and audio streams with the wrong media type', () => {
    const source = createSource();
    const incomplete = createProfile({
      video: { source: -1, stream: -1, encoder: { coder: 'none' } },
    });
    expect(Metadata.createInputsOutputs([source], [incomplete])).toEqual([
      [],
      [],
      [],
    ]);

    const wrongAudioType = createProfile({
      audio: {
        source: 0,
        stream: 0,
        encoder: { coder: 'aac' },
      },
    });
    expect(Metadata.validateProfile([source], wrongAudioType, false)).toBe(
      true,
    );
    expect(wrongAudioType.audio.source).toBe(0);
  });
});
