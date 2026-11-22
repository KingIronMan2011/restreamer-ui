import React from 'react';

import Wizard from '.';
import { render, fireEvent, act, screen } from '../../../utils/testing';

let lastUpsertIngest = null;

const restreamer = {
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

  // Confirm metadata
  button = screen.getByRole('button', { name: 'Next' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });

  expect(screen.queryByText(/License/)).toBeInTheDocument();

  // Confirm license
  button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });
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

test('wizard: network source video h264', async () => {
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
  button = screen.getByRole('button', { name: 'Save' });
  expect(button).toBeEnabled();

  await act(async () => {
    fireEvent.click(button);
  });
});
