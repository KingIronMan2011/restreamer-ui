import React from 'react';
import { vi } from 'vitest';

import Wizard from '.';
import NotifyContext from '../../../components/contexts/Notify';
import * as Metadata from '../../../utils/metadata';
import { render, fireEvent, act, screen } from '../../../utils/testing';
import Sources from './Sources';

let lastUpsertIngest = null;

const restreamer: any = {
  SelectChannel: () => {
    return 'test';
  },
  ListChannels: () => [{ channelid: 'test' }],
  GetChannel: () => {
    return {
      id: 'test',
      name: 'test',
    };
  },
  Skills: () => {
    return {
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
      sources: {
        network: [],
      },
      encoders: {
        audio: ['copy', 'none', 'aac'],
        video: ['copy', 'none', 'libx264'],
      },
      decoders: {
        audio: ['default'],
        video: ['default'],
      },
    };
  },
  RefreshSkills: () => {},
  ConfigActive: () => {
    return {
      source: {
        network: {
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
        },
      },
    };
  },
  Probe: (id: any, inputs: any) => {
    let streams: any[] = [];

    if (inputs[0].address === '{rtmp,name=external.stream}') {
      streams.push({
        url: inputs[0].address,
        format: 'rtmp',
        index: 0,
        stream: 0,
        language: 'und',
        type: 'video',
        codec: 'h264',
        coder: '',
        bitrate_kbps: 0,
        duration_sec: 0,
        fps: 0,
        pix_fmt: 'yuvj420p',
        width: 1280,
        height: 720,
        sampling_hz: 0,
        layout: '',
        channels: 0,
      });
      streams.push({
        url: inputs[0].address,
        format: 'rtmp',
        index: 0,
        stream: 1,
        language: 'und',
        type: 'audio',
        codec: 'aac',
        coder: '',
        bitrate_kbps: 0,
        duration_sec: 0,
        fps: 0,
        pix_fmt: 'yuvj420p',
        width: 1280,
        height: 720,
        sampling_hz: 44100,
        layout: 'stereo',
        channels: 2,
      });
    } else if (
      inputs[0].address.startsWith(
        '{srt,name=external.stream,mode=request,latency=',
      )
    ) {
      streams.push({
        url: inputs[0].address,
        format: 'srt',
        index: 0,
        stream: 0,
        language: 'und',
        type: 'video',
        codec: 'h264',
        coder: '',
        bitrate_kbps: 0,
        duration_sec: 0,
        fps: 0,
        pix_fmt: 'yuvj420p',
        width: 1280,
        height: 720,
        sampling_hz: 0,
        layout: '',
        channels: 0,
      });
      streams.push({
        url: inputs[0].address,
        format: 'srt',
        index: 0,
        stream: 1,
        language: 'und',
        type: 'audio',
        codec: 'aac',
        coder: '',
        bitrate_kbps: 0,
        duration_sec: 0,
        fps: 0,
        pix_fmt: 'yuvj420p',
        width: 1280,
        height: 720,
        sampling_hz: 44100,
        layout: 'stereo',
        channels: 2,
      });
    } else if (inputs[0].address === 'anullsrc=r=44100:cl=stereo') {
      streams.push({
        url: inputs[0].address,
        format: 'lavfi',
        index: 0,
        stream: 0,
        language: 'und',
        type: 'audio',
        codec: 'pcm',
        coder: '',
        bitrate_kbps: 0,
        duration_sec: 0,
        fps: 0,
        pix_fmt: 'yuvj420p',
        width: 1280,
        height: 720,
        sampling_hz: 44100,
        layout: 'stereo',
        channels: 2,
      });
    } else {
      const name = inputs[0].address.split('/').pop();
      const [video, audio] = name.split('-');

      switch (video) {
        case 'none':
          break;
        case 'h264':
          streams.push({
            url: 'rtsp://127.0.0.1/live/stream',
            format: 'rtsp',
            index: 0,
            stream: 0,
            language: 'und',
            type: 'video',
            codec: 'h264',
            coder: '',
            bitrate_kbps: 0,
            duration_sec: 0,
            fps: 0,
            pix_fmt: 'yuvj420p',
            width: 1280,
            height: 720,
            sampling_hz: 0,
            layout: '',
            channels: 0,
          });
          break;
        case 'other':
          streams.push({
            url: 'rtsp://127.0.0.1/live/stream',
            format: 'rtsp',
            index: 0,
            stream: 0,
            language: 'und',
            type: 'video',
            codec: 'mjpeg',
            coder: '',
            bitrate_kbps: 0,
            duration_sec: 0,
            fps: 0,
            pix_fmt: 'yuvj420p',
            width: 1280,
            height: 720,
            sampling_hz: 0,
            layout: '',
            channels: 0,
          });
          break;
        case 'unknown':
          streams.push({
            url: 'rtsp://127.0.0.1/live/stream',
            format: 'rtsp',
            index: 0,
            stream: 0,
            language: 'und',
            type: 'video',
            codec: 'xxx',
            coder: '',
            bitrate_kbps: 0,
            duration_sec: 0,
            fps: 0,
            pix_fmt: 'yuvj420p',
            width: 1280,
            height: 720,
            sampling_hz: 0,
            layout: '',
            channels: 0,
          });
          break;
        default:
          break;
      }

      switch (audio) {
        case 'none':
          break;
        case 'aac':
          streams.push({
            url: 'rtsp://127.0.0.1/live/stream',
            format: 'rtsp',
            index: 0,
            stream: 1,
            language: 'und',
            type: 'audio',
            codec: 'aac',
            coder: '',
            bitrate_kbps: 0,
            duration_sec: 0,
            fps: 0,
            pix_fmt: 'yuvj420p',
            width: 1280,
            height: 720,
            sampling_hz: 44100,
            layout: 'stereo',
            channels: 2,
          });
          break;
        case 'ogg':
          streams.push({
            url: 'rtsp://127.0.0.1/live/stream',
            format: 'rtsp',
            index: 0,
            stream: 1,
            language: 'und',
            type: 'audio',
            codec: 'ogg',
            coder: '',
            bitrate_kbps: 0,
            duration_sec: 0,
            fps: 0,
            pix_fmt: 'yuvj420p',
            width: 1280,
            height: 720,
            sampling_hz: 44100,
            layout: 'stereo',
            channels: 2,
          });
          break;
        case 'unknown':
          streams.push({
            url: 'rtsp://127.0.0.1/live/stream',
            format: 'rtsp',
            index: 0,
            stream: 1,
            language: 'und',
            type: 'audio',
            codec: 'xxx',
            coder: '',
            bitrate_kbps: 0,
            duration_sec: 0,
            fps: 0,
            pix_fmt: 'yuvj420p',
            width: 1280,
            height: 720,
            sampling_hz: 44100,
            layout: 'stereo',
            channels: 2,
          });
          break;
        default:
          break;
      }
    }

    return [{ streams: streams }, null];
  },
  UpsertIngest: (
    _channelid: any,
    global: any,
    inputs: any,
    outputs: any,
    control: any,
  ) => {
    lastUpsertIngest = { global, inputs, outputs, control };
    return [{}, null];
  },
  SetIngestMetadata: (_channelid: any, data: any) => {},
  UpsertIngestSnapshot: (_channelid: any, control: any) => {},
  UpdatePlayer: (_channelid: any) => {},
  UpdatePlayersite: () => {},
};

test('wizard', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  expect(
    await screen.findByText(/Select whether you pull the stream from a/),
  ).toBeInTheDocument();

  expect(screen.queryByText('Network source')).toBeInTheDocument();
  expect(screen.queryByText('RTMP server')).toBeInTheDocument();
  expect(screen.queryByText('SRT server')).toBeInTheDocument();
});

test('wizard opens help from the source selection step', async () => {
  const open = vi.spyOn(window, 'open').mockImplementation(() => null);
  render(
    <Wizard restreamer={restreamer} />,
    {},
    '/wizard/test',
    '/wizard/:channelid',
  );

  await screen.findByText(/Select whether you pull the stream from a/);
  const headerButtons = screen.getAllByRole('button');
  fireEvent.click(headerButtons[1]);
  expect(open).toHaveBeenCalledOnce();
  open.mockRestore();
});

test('wizard advanced setup navigates to channel editing', async () => {
  render(
    <Wizard restreamer={restreamer} />,
    {},
    '/wizard/test',
    '/wizard/:channelid',
  );

  await screen.findByText(/Select whether you pull the stream from a/);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced setup' }));
  expect(
    screen.queryByText(/Select whether you pull the stream from a/),
  ).not.toBeInTheDocument();
});

test('wizard returns to source selection when a selected source is unavailable', async () => {
  const getSource = vi.spyOn(Sources, 'Get').mockReturnValue(null as any);
  try {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Network source' }),
    );
    expect(
      await screen.findByRole('button', { name: 'Network source' }),
    ).toBeInTheDocument();
  } finally {
    getSource.mockRestore();
  }
});

test('wizard lists hardware video sources reported by FFmpeg', async () => {
  const getSkills = restreamer.Skills;
  const originalRefreshSkills = restreamer.RefreshSkills;
  restreamer.Skills = async () => ({
    ...(await getSkills()),
    sources: {
      network: [],
      video4linux2: [],
      raspicam: [],
      avfoundation: [],
    },
  });
  try {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    expect(
      await screen.findByRole('button', { name: 'Hardware device' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Raspberry Pi camera' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Connected device' }),
    ).toBeInTheDocument();
  } finally {
    restreamer.Skills = getSkills;
    restreamer.RefreshSkills = originalRefreshSkills;
  }
});

test('wizard hardware source can refresh devices and return to source selection', async () => {
  const getSkills = restreamer.Skills;
  const originalRefreshSkills = restreamer.RefreshSkills;
  const refreshSkills = vi.fn();
  restreamer.RefreshSkills = refreshSkills;
  restreamer.Skills = async () => ({
    ...(await getSkills()),
    sources: {
      network: [],
      video4linux2: [
        { id: '/dev/video0', name: 'Camera', media: 'video', extra: '' },
      ],
    },
  });

  try {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Hardware device' }),
    );
    expect(await screen.findByText('Select a device:')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await vi.waitFor(() => expect(refreshSkills).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(
      await screen.findByRole('button', { name: 'Hardware device' }),
    ).toBeInTheDocument();
  } finally {
    restreamer.Skills = getSkills;
    restreamer.RefreshSkills = originalRefreshSkills;
  }
});

test('wizard abort can be cancelled when it is the only channel', async () => {
  const view = render(
    <Wizard restreamer={restreamer} />,
    {},
    '/wizard/test',
    '/wizard/:channelid',
  );
  await screen.findByText(/Select whether you pull the stream from a/);

  await act(async () => {
    fireEvent.click(view.container.querySelector('button')!);
  });

  expect(screen.getByText(/You can't abort the wizard/)).toBeInTheDocument();
  const back = screen.getByRole('button', { name: 'Back' });
  await act(async () => fireEvent.click(back));
  expect(
    screen.getByText(/Select whether you pull the stream from a/),
  ).toBeInTheDocument();
});

test('wizard redirects invalid channels before loading skills', async () => {
  const selectChannel = restreamer.SelectChannel;
  const skills = restreamer.Skills;
  let skillsCalls = 0;
  restreamer.SelectChannel = () => '';
  restreamer.Skills = () => {
    skillsCalls++;
    return {};
  };

  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/missing',
      '/wizard/:channelid',
    );
  });

  expect(skillsCalls).toBe(0);
  restreamer.SelectChannel = selectChannel;
  restreamer.Skills = skills;
});

test('wizard abort deletes the current channel when another channel exists', async () => {
  const listChannels = restreamer.ListChannels;
  const selectChannel = restreamer.SelectChannel;
  const deleteChannel = restreamer.DeleteChannel;
  const deleted: string[] = [];
  const selected: string[] = [];
  restreamer.ListChannels = () => [
    { channelid: 'test' },
    { channelid: 'other' },
  ];
  restreamer.SelectChannel = (id: string) => {
    selected.push(id);
    return id;
  };
  restreamer.DeleteChannel = (id: string) => {
    deleted.push(id);
  };

  const view = render(
    <Wizard restreamer={restreamer} />,
    {},
    '/wizard/test',
    '/wizard/:channelid',
  );
  await screen.findByText(/Select whether you pull the stream from a/);
  await act(async () =>
    fireEvent.click(view.container.querySelector('button')!),
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Yes' })),
  );

  expect(deleted).toEqual(['test']);
  expect(selected).toEqual(['test', 'test']);
  restreamer.ListChannels = listChannels;
  restreamer.SelectChannel = selectChannel;
  restreamer.DeleteChannel = deleteChannel;
});

test('wizard: rtmp source video h264-aac', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'RTMP server' });
  fireEvent.click(button);

  expect(screen.queryByText(/Address:/)).toBeInTheDocument();

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(
      /The video source is compatible. Select the desired resolution:/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      /Your stream needs to be encoded. Choose the desired encoder:/,
    ),
  ).not.toBeInTheDocument();

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Audio from device/)).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();

  // Confirm selected audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Metadata/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Coverage test stream' },
  });

  // Confirm metadata
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/License/)).toBeInTheDocument();

  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'CC BY 4.0' }));
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByText(/Metadata/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  // Confirm license
  button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });
});

test('wizard audio setup handles stream changes, silence, no audio, and back navigation', async () => {
  render(
    <Wizard restreamer={restreamer} />,
    {},
    '/wizard/test',
    '/wizard/:channelid',
  );

  fireEvent.click(await screen.findByRole('button', { name: 'RTMP server' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }));

  expect(
    await screen.findByRole('radio', { name: 'Silence Audio' }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Silence Audio' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Audio from device' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Silence Audio' }));
  fireEvent.click(screen.getByRole('radio', { name: 'No audio' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  expect(await screen.findByText('Metadata')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByText('Audio setup')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(
    await screen.findByText(
      /The video source is compatible. Select the desired resolution:/,
    ),
  ).toBeInTheDocument();
});

test('wizard rejects an incomplete ingest before saving', async () => {
  const createInputsOutputs = vi
    .spyOn(Metadata, 'createInputsOutputs')
    .mockReturnValue([{}, [], []] as any);
  const dispatch = vi.fn();
  try {
    render(
      <NotifyContext.Provider value={{ Dispatch: dispatch }}>
        <Wizard restreamer={restreamer} />
      </NotifyContext.Provider>,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    fireEvent.click(await screen.findByRole('button', { name: 'RTMP server' }));
    for (let step = 0; step < 2; step++) {
      await act(async () =>
        fireEvent.click(screen.getByRole('button', { name: 'Next' })),
      );
    }
    fireEvent.click(await screen.findByRole('radio', { name: 'No audio' }));
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next' })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next' })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Save' })),
    );
    expect(dispatch).toHaveBeenCalledWith(
      'error',
      'save:ingest',
      expect.stringMatching(/input profile is not complete/i),
    );
  } finally {
    createInputsOutputs.mockRestore();
  }
});

test('wizard selects a non-default audio stream', async () => {
  const originalProbe = restreamer.Probe;
  restreamer.Probe = async (...args: any[]) => {
    const [result, error] = await originalProbe(...args);
    const audio = result.streams.find((stream: any) => stream.type === 'audio');
    return [
      {
        ...result,
        streams: [
          ...result.streams,
          { ...audio, stream: 2, codec: 'opus', layout: 'stereo' },
        ],
      },
      error,
    ];
  };

  try {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Network source' }),
    );
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'rtsp://127.0.0.1/live/h264-aac' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Audio setup')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /OPUS stereo/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Metadata')).toBeInTheDocument();
  } finally {
    restreamer.Probe = originalProbe;
  }
});

test('wizard updates video stream, decoder, and encoder and falls back to silence', async () => {
  const originalProbe = restreamer.Probe;
  const originalSkills = restreamer.Skills;
  restreamer.Skills = async () => ({
    ...(await originalSkills()),
    decoders: {
      audio: ['default'],
      video: ['default', 'vp9_cuvid'],
    },
    encoders: {
      audio: ['copy', 'none', 'aac'],
      video: ['copy', 'none', 'libx264', 'h264_nvenc'],
    },
  });
  restreamer.Probe = async (...args: any[]) => {
    const [result, error] = await originalProbe(...args);
    const video = result.streams.find((stream: any) => stream.type === 'video');
    return [
      {
        streams: [
          { ...video, codec: 'vp9', stream: 0 },
          { ...video, codec: 'vp9', stream: 1, width: 640, height: 360 },
        ],
        log: result.log,
      },
      error,
    ];
  };

  try {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    fireEvent.click(await screen.findByRole('button', { name: 'RTMP server' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByText(/Your stream needs to be encoded/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getAllByText('Input stream').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText(/Your stream needs to be encoded/),
    ).toBeInTheDocument();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: /640x360, VP9/i }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: /VP9 \(CUVID\)/i }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: /H\.264 \(NVENC\)/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      await screen.findByRole('radio', { name: 'Silence Audio' }),
    ).toBeChecked();
  } finally {
    restreamer.Probe = originalProbe;
    restreamer.Skills = originalSkills;
  }
});

test('wizard uses a hardware video source with a selectable ALSA audio device', async () => {
  const originalProbe = restreamer.Probe;
  const originalSkills = restreamer.Skills;
  restreamer.Skills = async () => ({
    ...(await originalSkills()),
    sources: {
      network: [],
      video4linux2: [
        { id: '/dev/video0', name: 'USB camera', media: 'video', extra: 'UVC' },
      ],
      alsa: [
        { id: 'hw:1,0', name: 'USB microphone', media: 'audio' },
        { id: 'hw:2,0', name: 'Studio microphone', media: 'audio' },
      ],
    },
  });
  restreamer.Probe = async (_id: string, inputs: any[]) => {
    const audioInput = inputs[0].options.includes('alsa');
    return [
      {
        streams: [
          {
            index: 0,
            stream: 0,
            type: audioInput ? 'audio' : 'video',
            codec: audioInput ? 'aac' : 'h264',
            width: audioInput ? 0 : 1280,
            height: audioInput ? 0 : 720,
            channels: audioInput ? 2 : 0,
            layout: audioInput ? 'stereo' : '',
            sampling_hz: audioInput ? 44100 : 0,
          },
        ],
        log: [],
      },
      null,
    ];
  };

  try {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Hardware device' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
    expect(
      await screen.findByText(
        /The video source is compatible. Select the desired resolution:/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Audio setup')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Audio from device' }));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(
      screen.getByRole('option', { name: /Studio microphone \(hw:2,0\)/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Metadata')).toBeInTheDocument();
  } finally {
    restreamer.Probe = originalProbe;
    restreamer.Skills = originalSkills;
  }
});

test('wizard: srt source video h264-aac', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'SRT server' });
  fireEvent.click(button);

  expect(screen.queryByText(/Address:/)).toBeInTheDocument();

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(
      /The video source is compatible. Select the desired resolution:/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      /Your stream needs to be encoded. Choose the desired encoder:/,
    ),
  ).not.toBeInTheDocument();

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Audio from device/)).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();

  // Confirm selected audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Metadata/)).toBeInTheDocument();

  // Confirm metadata
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/License/)).toBeInTheDocument();

  // Confirm license
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'CC BY 4.0' }));
  button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });
});

test('wizard: network source error', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/none-none' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(
      /Failed to verify the source. Please check the address./,
    ),
  ).toBeInTheDocument();

  // Add a stream address
  input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/none-aac' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(
      /The source doesn't provide any video streams. Please check the device./,
    ),
  ).toBeInTheDocument();
});

test('wizard displays a probe error response', async () => {
  const originalProbe = restreamer.Probe;
  restreamer.Probe = async () => [null, { message: 'probe failed' }];
  try {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    await screen.findByRole('button', { name: 'Network source' });
    fireEvent.click(screen.getByRole('button', { name: 'Network source' }));
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'rtsp://127.0.0.1/live/test' },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next' })),
    );
    expect(
      await screen.findByText(/Failed to verify the source/),
    ).toBeInTheDocument();
  } finally {
    restreamer.Probe = originalProbe;
  }
});

test('wizard shows an error when saving the ingest fails', async () => {
  const originalUpsert = restreamer.UpsertIngest;
  const dispatch = vi.fn();
  restreamer.UpsertIngest = async () => [null, { message: 'save failed' }];
  try {
    render(
      <NotifyContext.Provider value={{ Dispatch: dispatch }}>
        <Wizard restreamer={restreamer} />
      </NotifyContext.Provider>,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
    await screen.findByRole('button', { name: 'Network source' });
    fireEvent.click(screen.getByRole('button', { name: 'Network source' }));
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'rtsp://127.0.0.1/live/h264-aac' },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next' })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next' })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next' })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Next' })),
    );
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Save' })),
    );
    expect(dispatch).toHaveBeenCalledWith(
      'error',
      'save:ingest',
      'save failed',
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByText(/Select whether you pull the stream from a/),
    ).toBeInTheDocument();
  } finally {
    restreamer.UpsertIngest = originalUpsert;
  }
});

test('wizard: network source video h264', async () => {
  const originalPreselectProfile = Metadata.preselectProfile;
  const preselectProfile = vi
    .spyOn(Metadata, 'preselectProfile')
    .mockImplementation(
      (type: any, streams: any, profile: any, encoders: any) => {
        const result = originalPreselectProfile(
          type,
          streams,
          profile,
          encoders,
        );
        if (type === 'video') {
          result.video.encoder.coder = 'none';
        }
        return result;
      },
    );
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/h264-none' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    await screen.findByText(/doesn't provide any compatible video streams/i),
  ).toBeInTheDocument();
  preselectProfile.mockRestore();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  });

  expect(
    screen.queryByText(
      /The video source is compatible. Select the desired resolution:/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      /Your stream needs to be encoded. Choose the desired encoder:/,
    ),
  ).not.toBeInTheDocument();

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(
      /The video source doesn't provide any compatible audio stream./,
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();
});

test('wizard: network source video non-h264', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/other-none' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(
      /The video source is compatible. Select the desired resolution:/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      /Your stream needs to be encoded. Choose the desired encoder:/,
    ),
  ).toBeInTheDocument();

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(
      /The video source doesn't provide any compatible audio stream./,
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();
});

test('wizard: network source audio aac', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/h264-aac' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Audio from device/)).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();

  // Select suggested audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Metadata/)).toBeInTheDocument();
});

test('wizard: network source audio non-aac', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/h264-ogg' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Audio from device/)).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();

  // Select suggested audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Metadata/)).toBeInTheDocument();
});

test('wizard: network source silence audio', async () => {
  const originalPreselectProfile = Metadata.preselectProfile;
  const preselectProfile = vi
    .spyOn(Metadata, 'preselectProfile')
    .mockImplementation(
      (type: any, streams: any, profile: any, encoders: any) => {
        const result = originalPreselectProfile(
          type,
          streams,
          profile,
          encoders,
        );
        if (type === 'audio') {
          result.audio.encoder.coder = 'none';
        }
        return result;
      },
    );
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/h264-aac' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Audio from device/)).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();

  expect(screen.queryByLabelText('Audio from device')).toBeChecked();
  expect(screen.queryByLabelText('Silence Audio')).not.toBeChecked();
  expect(screen.queryByLabelText('No audio')).not.toBeChecked();

  input = screen.getByLabelText('Silence Audio');

  await act(async () => {
    fireEvent.click(input);
  });

  expect(screen.queryByLabelText('Audio from device')).not.toBeChecked();
  expect(screen.queryByLabelText('Silence Audio')).toBeChecked();
  expect(screen.queryByLabelText('No audio')).not.toBeChecked();

  // Confirm selected audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(
    screen.queryByText(/doesn't provide any compatible audio streams/i),
  ).toBeInTheDocument();
  preselectProfile.mockRestore();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  });

  expect(screen.queryByText(/Metadata/)).toBeInTheDocument();

  // Confirm metadata
  button = screen.getByRole('button', { name: 'Next' });
  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/License/)).toBeInTheDocument();

  // Save and verify that silence remains a dedicated second input.
  lastUpsertIngest = null;
  button = screen.getByRole('button', { name: 'Save' });
  await act(async () => {
    fireEvent.click(button);
  });

  expect(lastUpsertIngest).not.toBeNull();
  expect(lastUpsertIngest!.inputs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        address: 'anullsrc=r=44100:cl=stereo',
        options: expect.arrayContaining(['-f', 'lavfi']),
      }),
    ]),
  );

  const outputOptions = lastUpsertIngest!.outputs[0].options;
  expect(outputOptions).toEqual(
    expect.arrayContaining(['-map', '0:0', '-map', '1:0']),
  );
});

test('wizard: network source no audio', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/h264-aac' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Audio from device/)).toBeInTheDocument();
  expect(screen.queryByText(/Silence Audio/)).toBeInTheDocument();
  expect(screen.queryByText(/No audio/)).toBeInTheDocument();

  expect(screen.queryByLabelText('Audio from device')).toBeChecked();
  expect(screen.queryByLabelText('Silence Audio')).not.toBeChecked();
  expect(screen.queryByLabelText('No audio')).not.toBeChecked();

  input = screen.getByLabelText('No audio');

  await act(async () => {
    fireEvent.click(input);
  });

  expect(screen.queryByLabelText('Audio from device')).not.toBeChecked();
  expect(screen.queryByLabelText('Silence Audio')).not.toBeChecked();
  expect(screen.queryByLabelText('No audio')).toBeChecked();

  // Confirm selected audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Metadata/)).toBeInTheDocument();
});

test('wizard: metadata', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/h264-aac' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Confirm selected audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/Metadata/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Name')).toHaveValue('test');
  expect(screen.queryByLabelText('Description')).toHaveValue(
    'Live from earth. Powered by datarhei Restreamer.',
  );

  // Confirm metadata
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/License/)).toBeInTheDocument();
});

test('wizard: license', async () => {
  await act(async () => {
    render(
      <Wizard restreamer={restreamer} />,
      {},
      '/wizard/test',
      '/wizard/:channelid',
    );
  });

  // Choose network source
  let button = screen.getByRole('button', { name: 'Network source' });
  fireEvent.click(button);

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeDisabled();

  // Add a stream address
  let input = screen.getByLabelText('Address');
  fireEvent.change(input, {
    target: { value: 'rtsp://127.0.0.1/live/h264-aac' },
  });

  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Select suggested video stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Confirm selected audio stream
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  // Confirm metadata
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/License/)).toBeInTheDocument();

  // Confirm license
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'CC0 1.0' }));
  button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });
});
