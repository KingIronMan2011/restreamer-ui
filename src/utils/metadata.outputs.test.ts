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
  ],
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
});
