import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as H264Omx } from './h264_omx';
import { component as H264V4l2 } from './h264_v4l2m2m';

function choose(index: number, option: string) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  fireEvent.click(screen.getByRole('option', { name: option }));
}

describe('Raspberry Pi H.264 encoders', () => {
  it('covers V4L2 buffer, keyframe, profile, and FFmpeg 5 options', () => {
    const onChange = vi.fn();
    render(<H264V4l2 onChange={onChange} settings={{ profile: 'high' }} />);

    choose(2, 'auto');
    choose(3, 'Constant frame rate (CFR)');
    fireEvent.change(screen.getByLabelText('Force key frames'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByLabelText('Capture buffer'), {
      target: { value: '128' },
    });
    fireEvent.change(screen.getByLabelText('Output buffer'), {
      target: { value: '256' },
    });

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gop: 'auto' }),
        expect.objectContaining({ fps_mode: 'cfr' }),
        expect.objectContaining({ force_key_frames: '' }),
        expect.objectContaining({ num_capture_buffers: '128' }),
        expect.objectContaining({ num_output_buffers: '256' }),
      ]),
    );
    const keyframeMapping = calls.find(
      ([settings]) => settings.force_key_frames === '',
    )![1].local;
    expect(keyframeMapping).not.toContain('-force_key_frames');
    expect(keyframeMapping).toContain('-profile:v');
    expect(
      calls.find(([settings]) => settings.gop === 'auto')![1].local,
    ).not.toContain('-keyint_min');
    expect(
      calls.find(([settings]) => settings.fps_mode === 'cfr')![1].local,
    ).toEqual(expect.arrayContaining(['-fps_mode', 'cfr']));
  });

  it('omits fps_mode for FFmpeg versions below 5', () => {
    const onChange = vi.fn();
    render(
      <H264V4l2
        onChange={onChange}
        skills={{ ffmpeg: { version_major: 4 } }}
      />,
    );

    expect(onChange.mock.lastCall?.[1].local).not.toContain('-fps_mode');
  });

  it('covers OMX GOP and profile mappings', () => {
    const onChange = vi.fn();
    render(<H264Omx onChange={onChange} />);
    choose(2, 'auto');
    choose(3, 'high');

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gop: 'auto' }),
        expect.objectContaining({ profile: 'high' }),
      ]),
    );
    expect(
      calls.find(([settings]) => settings.gop === 'auto')![1].local,
    ).not.toContain('-g');
    expect(
      calls.find(([settings]) => settings.profile === 'high')![1].local,
    ).toEqual(expect.arrayContaining(['-profile:v', 'high']));
  });
});
