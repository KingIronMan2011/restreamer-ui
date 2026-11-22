import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as H264Libx264 } from './h264_libx264';
import { component as HevcLibx265 } from './hevc_libx265';

const softwareEncoders = [
  ['H.264 libx264', H264Libx264],
  ['HEVC libx265', HevcLibx265],
] as const;

function choose(index: number, option: string) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  fireEvent.click(screen.getByRole('option', { name: option }));
}

describe.each(softwareEncoders)('%s options', (_name, Encoder) => {
  it('covers optional mapping flags with older FFmpeg and changed controls', () => {
    const onChange = vi.fn();
    render(
      <Encoder onChange={onChange} skills={{ ffmpeg: { version_major: 4 } }} />,
    );

    expect(screen.queryByText('Framerate mode')).not.toBeInTheDocument();
    choose(2, 'auto');
    choose(3, 'slow');
    choose(4, 'baseline');
    choose(5, 'none');

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gop: 'auto' }),
        expect.objectContaining({ preset: 'slow' }),
        expect.objectContaining({ profile: 'baseline' }),
        expect.objectContaining({ tune: 'none' }),
      ]),
    );
    const gopMapping = calls.find(([settings]) => settings.gop === 'auto')![1]
      .local;
    expect(gopMapping).not.toContain('-g');
    expect(
      calls.some(([, mapping]) => mapping.local.includes('-fps_mode')),
    ).toBe(false);
    expect(
      calls.some(([, mapping]) => mapping.local.includes('-profile:v')),
    ).toBe(true);
    const tuneMapping = calls.find(([settings]) => settings.tune === 'none')![1]
      .local;
    expect(tuneMapping).not.toContain('-tune:v');
  });

  it('maps selected framerate mode for FFmpeg 5+', () => {
    const onChange = vi.fn();
    render(<Encoder onChange={onChange} />);
    choose(3, 'Constant frame rate (CFR)');
    expect(onChange.mock.lastCall?.[0]).toMatchObject({ fps_mode: 'cfr' });
    expect(onChange.mock.lastCall?.[1].local).toEqual(
      expect.arrayContaining(['-fps_mode', 'cfr']),
    );
  });
});
