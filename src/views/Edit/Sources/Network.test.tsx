import React from 'react';
import { vi } from 'vitest';

import { render, fireEvent, screen, waitFor } from '../../../utils/testing';
import * as Network from './Network';

const $skills_ffmpeg6 = {
  ffmpeg: {
    version: '6.1.1',
    version_major: 6,
    version_minor: 1,
  },
  formats: {
    demuxers: ['rtsp'],
  },
  protocols: {
    input: ['http', 'https', 'rtmp', 'rtmps', 'srt'],
  },
  codecs: {
    audio: {},
    video: {
      av1: ['librav1e'],
      hevc: ['hevc'],
      vp9: ['libvpx-vp9'],
    },
  },
};

const $skills_ffmpeg5 = {
  ffmpeg: {
    version: '5.1.2',
    version_major: 5,
    version_minor: 1,
  },
  formats: {
    demuxers: ['rtsp'],
  },
  protocols: {
    input: ['http', 'https', 'rtmp', 'rtmps', 'srt'],
  },
};

const $skills_ffmpeg4 = {
  ffmpeg: {
    version: '4.4.1',
    version_major: 4,
    version_minor: 4,
  },
  formats: {
    demuxers: ['rtsp'],
  },
  protocols: {
    input: ['http', 'https', 'rtmp', 'rtmps', 'srt'],
  },
};

const $config = {
  channelid: 'external',
  rtmp: {
    enabled: true,
    app: '/live',
    token: 'foobar',
  },
  srt: {
    enabled: true,
    token: 'foobar',
    passphrase: 'bazfoobazfoo',
  },
};

test('source:network pull', async () => {
  let $settings: Record<string, any> = {
    mode: 'pull',
  };
  const handleChange = (settings: any) => {
    $settings = settings;
  };

  const Source = Network.component;
  let { getByLabelText, queryByText, rerender } = render(
    <Source onChange={handleChange} knownDevices={[]} />,
  );

  expect(
    queryByText(
      `This protocol is unknown or not supported by the available FFmpeg binary.`,
    ),
  ).toBe(null);

  const input = getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/stream' },
  });

  expect($settings.mode).toBe('pull');
  expect($settings.address).toBe('rtsp://127.0.0.1/live/stream');

  rerender(
    <Source settings={$settings} onChange={handleChange} knownDevices={[]} />,
  );

  expect(
    queryByText(
      `This protocol is unknown or not supported by the available FFmpeg binary.`,
    ),
  ).toBeInTheDocument();

  rerender(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg4}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(
    queryByText(
      `This protocol is unknown or not supported by the available FFmpeg binary.`,
    ),
  ).toBe(null);

  rerender(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg5}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(
    queryByText(
      `This protocol is unknown or not supported by the available FFmpeg binary.`,
    ),
  ).toBe(null);

  rerender(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg6}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(
    queryByText(
      `This protocol is unknown or not supported by the available FFmpeg binary.`,
    ),
  ).toBe(null);
});

test('source:network pull disables probing without an address', () => {
  const onProbe = vi.fn();
  render(
    <Network.component
      settings={{ mode: 'pull', address: '' }}
      onProbe={onProbe}
      knownDevices={[]}
    />,
  );

  expect(screen.getByRole('button', { name: 'Probe' })).toBeDisabled();
  expect(onProbe).not.toHaveBeenCalled();
});

test('source:network pull shows a schema error for malformed addresses', async () => {
  const onProbe = vi.fn();
  render(
    <Network.component
      settings={{ mode: 'pull', address: 'rtsp://bad host' }}
      skills={$skills_ffmpeg6}
      onProbe={onProbe}
      knownDevices={[]}
    />,
  );

  const probe = screen.getByRole('button', { name: 'Probe' });
  expect(probe).toBeEnabled();
  fireEvent.click(probe);
  expect(
    await screen.findByText('Enter a valid URL with a protocol and host.'),
  ).toBeInTheDocument();
  expect(onProbe).not.toHaveBeenCalled();
});

const pullmatrix = {
  settings: {
    mode: 'pull',
    address: '',
    username: 'admin',
    password: 'foobar',
    rtsp: {
      udp: false,
      stimeout: 5000000,
    },
    http: {
      readNative: true,
      forceFramerate: true,
      framerate: 25,
      userAgent: 'foobaz/1',
      referer: 'http://example.com',
      http_proxy: '',
    },
    general: {
      analyzeduration: 5000000,
      analyzeduration_rtmp: 3000000,
      analyzeduration_http: 20000000,
      probesize: 5000000,
      max_probe_packets: 2500,
      fflags: ['genpts'],
      thread_queue_size: 512,
      copyts: false,
      start_at_zero: false,
      use_wallclock_as_timestamps: false,
      avoid_negative_ts: 'auto',
    },
  },
  tests: [] as any[],
};

pullmatrix.tests = [
  {
    name: 'RTSP',
    settings: {
      ...pullmatrix.settings,
      address: 'rtsp://127.0.0.1/live/stream',
    },
    skills: $skills_ffmpeg4,
    input: {
      address: 'rtsp://admin:foobar@127.0.0.1/live/stream',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
        '-stimeout',
        5000000,
        '-rtsp_transport',
        'tcp',
      ],
    },
  },
  {
    name: 'RTMP',
    settings: {
      ...pullmatrix.settings,
      address: 'rtmp://127.0.0.1/live/stream',
    },
    skills: $skills_ffmpeg4,
    input: {
      address: 'rtmp://admin:foobar@127.0.0.1/live/stream',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        3000000,
      ],
    },
  },
  {
    name: 'HTTP',
    settings: {
      ...pullmatrix.settings,
      address: 'http://127.0.0.1/live/stream.m3u8',
    },
    skills: $skills_ffmpeg4,
    input: {
      address: 'http://admin:foobar@127.0.0.1/live/stream.m3u8',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        20000000,
        '-re',
        '-r',
        25,
        '-user_agent',
        'foobaz/1',
        '-referer',
        'http://example.com',
      ],
    },
  },
  {
    name: 'SRT',
    settings: {
      ...pullmatrix.settings,
      address: 'srt://127.0.0.1?mode=caller&streamid=foobar',
    },
    skills: $skills_ffmpeg4,
    input: {
      address: 'srt://127.0.0.1?mode=caller&streamid=foobar',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
      ],
    },
  },
  {
    name: 'RTSP',
    settings: {
      ...pullmatrix.settings,
      address: 'rtsp://127.0.0.1/live/stream',
    },
    skills: $skills_ffmpeg5,
    input: {
      address: 'rtsp://admin:foobar@127.0.0.1/live/stream',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
        '-timeout',
        5000000,
        '-rtsp_transport',
        'tcp',
      ],
    },
  },
  {
    name: 'RTMP',
    settings: {
      ...pullmatrix.settings,
      address: 'rtmp://127.0.0.1/live/stream',
    },
    skills: $skills_ffmpeg5,
    input: {
      address: 'rtmp://admin:foobar@127.0.0.1/live/stream',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        3000000,
      ],
    },
  },
  {
    name: 'HTTP',
    settings: {
      ...pullmatrix.settings,
      address: 'http://127.0.0.1/live/stream.m3u8',
    },
    skills: $skills_ffmpeg5,
    input: {
      address: 'http://admin:foobar@127.0.0.1/live/stream.m3u8',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        20000000,
        '-re',
        '-r',
        25,
        '-user_agent',
        'foobaz/1',
        '-referer',
        'http://example.com',
      ],
    },
  },
  {
    name: 'SRT',
    settings: {
      ...pullmatrix.settings,
      address: 'srt://127.0.0.1?mode=caller&streamid=foobar',
    },
    skills: $skills_ffmpeg5,
    input: {
      address: 'srt://127.0.0.1?mode=caller&streamid=foobar',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
      ],
    },
  },
  {
    name: 'RTSP',
    settings: {
      ...pullmatrix.settings,
      address: 'rtsp://127.0.0.1/live/stream',
    },
    skills: $skills_ffmpeg6,
    input: {
      address: 'rtsp://admin:foobar@127.0.0.1/live/stream',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
        '-timeout',
        5000000,
        '-rtsp_transport',
        'tcp',
      ],
    },
  },
  {
    name: 'RTMP',
    settings: {
      ...pullmatrix.settings,
      address: 'rtmp://127.0.0.1/live/stream',
    },
    skills: $skills_ffmpeg6,
    input: {
      address: 'rtmp://admin:foobar@127.0.0.1/live/stream',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        3000000,
        '-rtmp_enhanced_codecs',
        'hvc1,av01,vp09',
      ],
    },
  },
  {
    name: 'HTTP',
    settings: {
      ...pullmatrix.settings,
      address: 'http://127.0.0.1/live/stream.m3u8',
    },
    skills: $skills_ffmpeg6,
    input: {
      address: 'http://admin:foobar@127.0.0.1/live/stream.m3u8',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        20000000,
        '-re',
        '-r',
        25,
        '-user_agent',
        'foobaz/1',
        '-referer',
        'http://example.com',
      ],
    },
  },
  {
    name: 'SRT',
    settings: {
      ...pullmatrix.settings,
      address: 'srt://127.0.0.1?mode=caller&streamid=foobar',
    },
    skills: $skills_ffmpeg6,
    input: {
      address: 'srt://127.0.0.1?mode=caller&streamid=foobar',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
      ],
    },
  },
];

test.each(pullmatrix.tests)(
  'source:network pull $name input with ffmpeg $skills.ffmpeg.version',
  async (data) => {
    let $inputs: any[] = [];
    const handleProbe = (_: any, inputs: any) => {
      $inputs = inputs;
    };

    const Source = Network.component;

    let { getByText, getByRole } = render(
      <Source
        settings={data.settings}
        skills={data.skills}
        onProbe={handleProbe}
        knownDevices={[]}
      />,
    );

    expect(getByText('Probe')).toBeInTheDocument();

    const button = getByRole('button', { name: 'Probe' });
    fireEvent.click(button, { bubbles: true });

    await waitFor(() => expect($inputs.length).toBe(1));
    expect($inputs[0]).toStrictEqual(data.input);
  },
);

test('source:network push', async () => {
  let $settings = {
    mode: 'push',
    push: {
      type: 'rtmp',
      name: 'external',
    },
  };
  const handleChange = (settings: any) => {
    $settings = settings;
  };

  const Source = Network.component;
  let { queryByText, rerender } = render(
    <Source settings={$settings} onChange={handleChange} knownDevices={[]} />,
  );

  expect($settings.mode).toBe('push');

  expect(
    queryByText(
      `The available FFmpeg binary doesn't support any of the required protocols.`,
    ),
  ).toBeInTheDocument();

  rerender(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg4}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(
    queryByText(
      `The available FFmpeg binary doesn't support any of the required protocols.`,
    ),
  ).toBe(null);

  rerender(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg5}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(
    queryByText(
      `The available FFmpeg binary doesn't support any of the required protocols.`,
    ),
  ).toBe(null);

  rerender(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg6}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(
    queryByText(
      `The available FFmpeg binary doesn't support any of the required protocols.`,
    ),
  ).toBe(null);
});

test('source:network push RTMP', async () => {
  let $settings = {
    mode: 'push',
    push: {
      type: 'rtmp',
      name: 'external',
    },
  };
  const handleChange = (settings: any) => {
    $settings = settings;
  };

  const Source = Network.component;
  let { getByText, queryByText, rerender } = render(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg5}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect($settings.mode).toBe('push');
  expect($settings.push.type).toBe('rtmp');

  expect(queryByText(`Enable RTMP server ...`)).toBeInTheDocument();

  rerender(
    <Source
      settings={$settings}
      config={$config}
      skills={$skills_ffmpeg5}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(getByText('Probe')).toBeInTheDocument();
});

test('source:network push SRT', async () => {
  let $settings = {
    mode: 'push',
    push: {
      type: 'srt',
      name: 'external',
    },
  };
  const handleChange = (settings: any) => {
    $settings = settings;
  };

  const Source = Network.component;
  let { getByText, queryByText, rerender } = render(
    <Source
      settings={$settings}
      skills={$skills_ffmpeg5}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect($settings.mode).toBe('push');
  expect($settings.push.type).toBe('srt');

  expect(queryByText(`Enable SRT server ...`)).toBeInTheDocument();

  rerender(
    <Source
      settings={$settings}
      config={$config}
      skills={$skills_ffmpeg5}
      onChange={handleChange}
      knownDevices={[]}
    />,
  );

  expect(getByText('Probe')).toBeInTheDocument();
});

test.each([
  ['RTMP', 'rtmp', { id: 'rtmp-camera', name: 'RTMP camera', media: 'rtmp' }],
  ['SRT', 'srt', { id: 'srt-camera', name: 'SRT camera', media: 'srt' }],
])(
  'source:network enabled %s push refreshes and selects discovered streams',
  async (label, type, device) => {
    let settings: any = { mode: 'push', push: { type, name: 'external' } };
    const onChange = (next: any) => {
      settings = next;
    };
    const onRefresh = vi.fn();
    const onProbe = vi.fn();
    const props = {
      config: $config,
      skills: $skills_ffmpeg5,
      knownDevices: [
        device,
        { id: 'ignored', name: 'Ignored device', media: 'other' },
      ],
      onChange,
      onRefresh,
      onProbe,
    };
    const view = render(<Network.component {...props} settings={settings} />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    expect(
      screen.getByRole('option', { name: device.name }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Ignored device' })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: device.name }));
    expect(settings.push.name).toBe(device.id);
    view.rerender(<Network.component {...props} settings={settings} />);
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    await waitFor(() =>
      expect(onProbe).toHaveBeenCalledWith(
        settings,
        Network.func.createInputs(settings, $config, $skills_ffmpeg5),
      ),
    );
  },
);

test.each([
  ['RTMP', 'rtmp', 'Enable RTMP server ...'],
  ['SRT', 'srt', 'Enable SRT server ...'],
])(
  'source:network %s disabled-server link navigates to its settings',
  (_label, type, action) => {
    render(
      <Network.component
        settings={{ mode: 'push', push: { type, name: 'external' } }}
        skills={$skills_ffmpeg5}
        knownDevices={[]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: action }));
    expect(screen.queryByRole('button', { name: action })).toBeNull();
  },
);

test.each([
  ['RTMP', 'rtmp', 'rtmp://localhost/live/external.stream/foobar'],
  ['SRT', 'srt', /mode:publish.*token:foobar/],
])(
  'source:network %s server output selection shows its publish address',
  (_label, type, expectedAddress) => {
    const settings = { mode: 'push', push: { type, name: 'external' } };
    const view = render(
      <Network.component
        settings={settings}
        config={$config}
        skills={$skills_ffmpeg5}
        knownDevices={[]}
      />,
    );
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(
      screen.getByRole('option', { name: 'Send stream to address ...' }),
    );
    view.rerender(
      <Network.component
        settings={{ ...settings, push: { type, name: 'external' } }}
        config={$config}
        skills={$skills_ffmpeg5}
        knownDevices={[]}
      />,
    );
    expect(screen.getByText(expectedAddress)).toBeInTheDocument();
  },
);

test('source:network protocol selection resets to the channel and edits SRT latency', () => {
  let settings: any = {
    mode: 'push',
    push: { type: 'rtmp', name: 'rtmp-camera' },
  };
  const onChange = (next: any) => {
    settings = next;
  };
  const props = {
    config: $config,
    skills: $skills_ffmpeg5,
    onChange,
    knownDevices: [],
  };
  const view = render(<Network.component {...props} settings={settings} />);
  fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
  fireEvent.click(screen.getByRole('option', { name: 'SRT' }));
  expect(settings.push).toMatchObject({ type: 'srt', name: 'external' });
  view.rerender(<Network.component {...props} settings={settings} />);
  fireEvent.click(screen.getByText('Advanced settings'));
  fireEvent.change(screen.getByLabelText('Latency (milliseconds)'), {
    target: { value: '50' },
  });
  expect(settings.srt.latency).toBe('50');
});

test('source:network mode selector switches into push mode', () => {
  let settings: any = { mode: 'pull', address: 'rtsp://camera/live' };
  const onChange = (next: any) => {
    settings = next;
  };
  const view = render(
    <Network.component
      settings={settings}
      skills={$skills_ffmpeg5}
      onChange={onChange}
    />,
  );
  fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
  fireEvent.click(screen.getByRole('option', { name: 'Receive Mode' }));
  expect(settings.mode).toBe('push');
  view.rerender(
    <Network.component
      settings={settings}
      skills={$skills_ffmpeg5}
      onChange={onChange}
    />,
  );
  expect(screen.getAllByText('Protocol').length).toBeGreaterThan(0);
});

const pushmatrix: Record<string, any> = {
  settings: {
    mode: 'push',
    push: {
      type: '',
      name: 'external',
    },
  },
  tests: [] as any[],
};

pushmatrix.tests = [
  {
    name: 'RTMP',
    settings: {
      ...pushmatrix.settings,
      push: { ...pushmatrix.push, type: 'rtmp' },
    },
    skills: $skills_ffmpeg4,
    config: $config,
    input: {
      address: '{rtmp,name=external.stream}',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        3000000,
      ],
    },
  },
  {
    name: 'SRT',
    settings: {
      ...pushmatrix.settings,
      push: { ...pushmatrix.push, type: 'srt' },
    },
    skills: $skills_ffmpeg4,
    config: $config,
    input: {
      address: '{srt,name=external.stream,mode=request,latency=20000}',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
      ],
    },
  },
  {
    name: 'RTMP',
    settings: {
      ...pushmatrix.settings,
      push: { ...pushmatrix.push, type: 'rtmp' },
    },
    skills: $skills_ffmpeg5,
    config: $config,
    input: {
      address: '{rtmp,name=external.stream}',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        3000000,
      ],
    },
  },
  {
    name: 'SRT',
    settings: {
      ...pushmatrix.settings,
      push: { ...pushmatrix.push, type: 'srt' },
    },
    skills: $skills_ffmpeg5,
    config: $config,
    input: {
      address: '{srt,name=external.stream,mode=request,latency=20000}',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
      ],
    },
  },
  {
    name: 'RTMP',
    settings: {
      ...pushmatrix.settings,
      push: { ...pushmatrix.push, type: 'rtmp' },
    },
    skills: $skills_ffmpeg6,
    config: $config,
    input: {
      address: '{rtmp,name=external.stream}',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        3000000,
        '-rtmp_enhanced_codecs',
        'hvc1,av01,vp09',
      ],
    },
  },
  {
    name: 'SRT',
    settings: {
      ...pushmatrix.settings,
      push: { ...pushmatrix.push, type: 'srt' },
    },
    skills: $skills_ffmpeg6,
    config: $config,
    input: {
      address: '{srt,name=external.stream,mode=request,latency=20000}',
      options: [
        '-fflags',
        '+genpts',
        '-thread_queue_size',
        512,
        '-probesize',
        5000000,
        '-analyzeduration',
        5000000,
      ],
    },
  },
];

test.each(pushmatrix.tests as any[])(
  'source:network push $name input with ffmpeg $skills.ffmpeg.version',
  async (data) => {
    let $inputs: any[] = [];
    const handleProbe = (_: any, inputs: any) => {
      $inputs = inputs;
    };

    const Source = Network.component;
    let { getByText, getByRole } = render(
      <Source
        settings={data.settings}
        config={data.config}
        skills={data.skills}
        onProbe={handleProbe}
        knownDevices={[]}
      />,
    );

    expect(getByText('Probe')).toBeInTheDocument();

    const button = getByRole('button', { name: 'Probe' });
    fireEvent.click(button, { bubbles: true });

    await waitFor(() => expect($inputs.length).toBe(1));
    expect($inputs[0]).toStrictEqual(data.input);
  },
);

test('source:network advanced RTSP controls call their change handlers', () => {
  let settings: any = { mode: 'pull', address: 'rtsp://camera/live' };
  const onChange = (next: any) => {
    settings = next;
  };
  render(
    <Network.component
      settings={settings}
      skills={$skills_ffmpeg5}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByText('Advanced settings'));
  fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
  fireEvent.click(screen.getByRole('option', { name: 'UDP' }));
  expect(settings.rtsp.transport).toBe('udp');
  fireEvent.change(screen.getByLabelText('thread_queue_size'), {
    target: { value: '1024' },
  });
  expect(settings.general.thread_queue_size).toBe('1024');
  fireEvent.click(screen.getByLabelText('copyts'));
  expect(settings.general.copyts).toBe(true);
});

test('source:network advanced HTTP controls reveal and update the forced framerate', () => {
  let settings: any = {
    mode: 'pull',
    address: 'https://example.test/stream.m3u8',
  };
  const onChange = (next: any) => {
    settings = next;
  };
  const view = render(
    <Network.component
      settings={settings}
      skills={$skills_ffmpeg5}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByText('Advanced settings'));
  fireEvent.click(screen.getByLabelText('Force input framerate'));
  view.rerender(
    <Network.component
      settings={settings}
      skills={$skills_ffmpeg5}
      onChange={onChange}
    />,
  );
  expect(screen.getByLabelText('Framerate')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Framerate'), {
    target: { value: '30' },
  });
  expect(settings.http).toMatchObject({
    forceFramerate: true,
    framerate: '30',
  });
});

test('source:network advanced controls toggle HTTP and general settings', () => {
  let settings: any = {
    mode: 'pull',
    address: 'https://example.test/stream.m3u8',
  };
  const onChange = (next: any) => {
    settings = next;
  };
  const view = render(
    <Network.component
      settings={settings}
      skills={$skills_ffmpeg5}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByText('Advanced settings'));
  fireEvent.click(screen.getByLabelText('Read input at native speed'));
  fireEvent.click(screen.getByLabelText('copyts'));
  fireEvent.click(screen.getByLabelText('start_at_zero'));
  fireEvent.click(screen.getByLabelText('use_wallclock_as_timestamps'));
  fireEvent.change(screen.getByLabelText('User-Agent'), {
    target: { value: 'custom-agent' },
  });
  fireEvent.change(screen.getByLabelText('Referrer'), {
    target: { value: 'https://referrer.test' },
  });
  fireEvent.change(screen.getByLabelText('Headers'), {
    target: { value: 'X-One: 1\n\nX-Two: 2' },
  });
  fireEvent.change(screen.getByLabelText('HTTP proxy'), {
    target: { value: 'http://proxy.test' },
  });
  fireEvent.change(screen.getByLabelText('max_probe_packets'), {
    target: { value: '500' },
  });
  expect(settings.http).toMatchObject({
    readNative: false,
    userAgent: 'custom-agent',
    referer: 'https://referrer.test',
    headers: 'X-One: 1\n\nX-Two: 2',
    http_proxy: 'http://proxy.test',
  });
  expect(settings.general).toMatchObject({
    copyts: true,
    start_at_zero: true,
    use_wallclock_as_timestamps: true,
    max_probe_packets: '500',
  });
  view.unmount();
});

test('source:network input builder handles HTTP headers, proxy, timestamps, and RTSP defaults', () => {
  const settings = Network.func.initSettings(
    {
      mode: 'pull',
      address: 'https://example.test/live',
      http: {
        readNative: false,
        forceFramerate: true,
        framerate: 30,
        headers: 'X-One: 1\n\nX-Two: 2',
        http_proxy: 'http://proxy.test',
      },
      general: {
        fflags: [],
        max_probe_packets: 500,
        copyts: true,
        start_at_zero: true,
        use_wallclock_as_timestamps: true,
        avoid_negative_ts: 'disabled',
      },
    },
    { channelid: 'test' },
  );
  const input = Network.func.createInputs(
    settings,
    { channelid: 'test' },
    $skills_ffmpeg5,
  )[0];
  expect(input.options).toEqual(
    expect.arrayContaining([
      '-max_probe_packets',
      500,
      '-copyts',
      '-start_at_zero',
      '-use_wallclock_as_timestamps',
      '1',
      '-headers',
      'X-One: 1\r\nX-Two: 2\r\n',
      '-http_proxy',
      'http://proxy.test',
      '-r',
      30,
    ]),
  );
  expect(
    Network.func.initSettings({ rtsp: { udp: true } }, { channelid: 'test' })
      .rtsp.transport,
  ).toBe('udp');
  const rtspSkills = Network.func.initSkills({
    formats: { demuxers: ['rtsp'] },
    protocols: { input: ['tls', 'rtsp'] },
  });
  expect(rtspSkills.protocols.input).toContain('rtsps');
  expect(
    Network.func.initSkills({
      formats: { demuxers: ['rtsp'] },
      protocols: { input: ['rtsp'] },
    }).protocols.input,
  ).not.toContain('rtsps');

  const emptyCodecSkills = Network.func.initSkills({
    ffmpeg: { version: '6.1.0', version_major: 6, version_minor: 1 },
    formats: { demuxers: [] },
    protocols: { input: ['rtmp'] },
    codecs: { audio: {}, video: { hevc: [], av1: [], vp9: [] } },
  });
  const rtmpInput = Network.func.createInputs(
    Network.func.initSettings(
      { mode: 'push', push: { type: 'rtmp', name: 'test' } },
      $config,
    ),
    $config,
    emptyCodecSkills,
  )[0];
  expect(rtmpInput.options).not.toContain('-rtmp_enhanced_codecs');
});

test('source:network icon renders', () => {
  const { container } = render(<Network.icon />);
  expect(container.querySelector('svg')).toBeInTheDocument();
});

test('classifies malformed, MMS, and unsupported network protocols', () => {
  expect(Network.func.getProtocolClass(null)).toBe('');
  expect(Network.func.getProtocolClass('mmsh://example.test/live')).toBe('mms');
  expect(Network.func.getProtocolClass('custom://example.test/live')).toBe(
    'custom',
  );
  expect(Network.func.isAuthProtocol('custom://example.test/live')).toBe(false);
  expect(Network.func.isAuthProtocol('amqp://example.test')).toBe(true);
  expect(Network.func.isAuthProtocol('ftp://example.test')).toBe(true);
  expect(Network.func.isSupportedProtocol('invalid', ['http'])).toBe(false);
  expect(
    Network.func.isSupportedProtocol('https://example.test', ['https']),
  ).toBe(true);
});

test('source:network input builder omits disabled HTTP flags and supports password-only auth', () => {
  const config = { channelid: 'test' };
  const settings = Network.func.initSettings(
    {
      mode: 'pull',
      address: 'https://example.test/live',
      username: '',
      password: 'secret',
      http: { readNative: false, forceFramerate: false, userAgent: '' },
    },
    config,
  );
  const input = Network.func.createInputs(settings, config, $skills_ffmpeg6)[0];

  expect(input.address).toBe('https://:secret@example.test/live');
  expect(input.options).not.toContain('-re');
  expect(input.options).not.toContain('-r');
  expect(input.options).not.toContain('-user_agent');
});

test('initializes Network settings when no settings object is provided', () => {
  expect(
    Network.func.initSettings(null, { channelid: 'channel' }),
  ).toMatchObject({
    address: '',
    mode: 'pull',
  });
});

test('source:network HLS push replaces the none name with the channel ID', () => {
  const inputs = Network.func.createInputs(
    { mode: 'push', push: { type: 'hls', name: 'none' } },
    { channelid: 'channel-1', hls: { local: 'localhost' } },
    $skills_ffmpeg5,
  );
  expect(inputs[0].address).toBe('http://localhost/memfs/channel-1.m3u8');
});

test('source:network builds insecure RTMP, SRT, and HLS output addresses', () => {
  const config = {
    channelid: 'channel',
    hls: { host: 'stream.example', credentials: '', secure: false },
    rtmp: { host: 'stream.example', app: '/live', token: '', secure: false },
    srt: { host: 'stream.example:9000', token: '', passphrase: '' },
  };
  expect(Network.func.getHLS(config)).toBe(
    'http://stream.example/memfs/channel.m3u8',
  );
  expect(Network.func.getRTMP(config)).toBe(
    'rtmp://stream.example/live/channel.stream',
  );
  expect(
    Network.func.getRTMP({
      ...config,
      rtmp: { ...config.rtmp, secure: true },
    }),
  ).toBe('rtmps://stream.example/live/channel.stream');
  expect(Network.func.getSRT(config)).toContain('mode:publish');
});

test('source:network renders HLS push output and extension controls', async () => {
  const onProbe = vi.fn();
  const onChange = vi.fn();
  const settings = { mode: 'push', push: { type: 'hls', name: 'external' } };
  const config = {
    channelid: 'external',
    hls: { secure: true, host: 'stream.example.test', credentials: 'token' },
  };
  const skills = {
    ...$skills_ffmpeg5,
    protocols: { input: [...$skills_ffmpeg5.protocols.input, 'playout'] },
  };
  render(
    <Network.component
      settings={settings}
      config={config}
      skills={skills}
      onChange={onChange}
      onProbe={onProbe}
    />,
  );
  expect(screen.getByText('Send stream to this address:')).toBeInTheDocument();
  expect(screen.getByText(/memfs\/external\.m3u8/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Extention settings'));
  fireEvent.mouseDown(screen.getAllByRole('combobox').at(-1)!);
  fireEvent.click(
    screen.getByRole('option', { name: 'Protect: Video channel' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      extentions: expect.objectContaining({ liveguard: 'video' }),
    }),
  );
  await waitFor(() =>
    expect(onProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'push',
        push: expect.objectContaining({ type: 'hls' }),
      }),
      Network.func.createInputs(onChange.mock.calls[0][0], config, skills),
    ),
  );
});

test('source:network HLS push can protect video and audio', () => {
  const onChange = vi.fn();
  const settings = { mode: 'push', push: { type: 'hls', name: 'external' } };
  const config = {
    channelid: 'external',
    hls: { secure: true, host: 'stream.example.test', credentials: 'token' },
  };
  const skills = {
    ...$skills_ffmpeg5,
    protocols: { input: [...$skills_ffmpeg5.protocols.input, 'playout'] },
  };
  render(
    <Network.component
      settings={settings}
      config={config}
      skills={skills}
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByText('Extention settings'));
  fireEvent.mouseDown(screen.getAllByRole('combobox').at(-1)!);
  fireEvent.click(
    screen.getByRole('option', { name: 'Protect: Video and audio channel' }),
  );

  const updatedSettings = onChange.mock.calls[0][0];
  expect(updatedSettings.extentions.liveguard).toBe('video_audio');
  expect(Network.func.createInputs(updatedSettings, config, skills)[0]).toEqual(
    expect.objectContaining({
      address: expect.stringMatching(/^playout:/),
      options: expect.arrayContaining(['-playout_audio', '1']),
    }),
  );
});

test('source:network unsupported push type has no destination address', () => {
  expect(
    Network.func.createInputs(
      { mode: 'push', push: { type: 'unsupported', name: 'external' } },
      { channelid: 'external' },
      $skills_ffmpeg5,
    )[0].address,
  ).toBe('');
});

test('source:network default pull callbacks handle address changes and probe', () => {
  render(
    <Network.component settings={{ mode: 'pull' }} skills={$skills_ffmpeg6} />,
  );
  const address = screen.getByLabelText('Address');
  fireEvent.change(address, {
    target: { value: 'https://example.test/live.m3u8' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
});

test('source:network default push callbacks handle refresh and probe', () => {
  render(
    <Network.component
      settings={{ mode: 'push', push: { type: 'rtmp', name: 'external' } }}
      config={$config}
      skills={$skills_ffmpeg6}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
});
