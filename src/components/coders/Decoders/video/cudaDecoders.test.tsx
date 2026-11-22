import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import * as Av1Cuvid from './av1_cuvid';
import { component as H264Cuvid } from './h264_cuvid';
import { component as HevcCuvid } from './hevc_cuvid';
import { component as MjpegCuvid } from './mjpeg_cuvid';
import { component as Mpeg1Cuvid } from './mpeg1_cuvid';
import { component as Mpeg2Cuvid } from './mpeg2_cuvid';
import { component as Mpeg4Cuvid } from './mpeg4_cuvid';
import { component as Nvdec } from './nvdec';
import { component as Vc1Cuvid } from './vc1_cuvid';
import { component as Vp8Cuvid } from './vp8_cuvid';
import { component as Vp9Cuvid } from './vp9_cuvid';

const cuvidDecoders = [
  ['H.264 CUVID', H264Cuvid],
  ['HEVC CUVID', HevcCuvid],
  ['MJPEG CUVID', MjpegCuvid],
  ['MPEG-1 CUVID', Mpeg1Cuvid],
  ['MPEG-2 CUVID', Mpeg2Cuvid],
  ['MPEG-4 CUVID', Mpeg4Cuvid],
  ['VC-1 CUVID', Vc1Cuvid],
  ['VP8 CUVID', Vp8Cuvid],
  ['VP9 CUVID', Vp9Cuvid],
] as const;

describe.each(cuvidDecoders)('%s controls', (_name, Decoder) => {
  it('updates resize and GPU mappings', () => {
    const onChange = vi.fn();
    render(<Decoder onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(
      screen.getByRole('option', { name: '1920x1080 (Full HD)' }),
    );
    fireEvent.change(screen.getByLabelText('GPU'), {
      target: { value: '1' },
    });

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resize: '1920x1080' }),
        expect.objectContaining({ gpu: '1' }),
      ]),
    );
    expect(
      calls.find(([settings]) => settings.resize === '1920x1080')![1].local,
    ).toEqual(expect.arrayContaining(['-resize', '1920x1080']));
    expect(calls.find(([settings]) => settings.gpu === '1')![1].local).toEqual(
      expect.arrayContaining(['-gpu', '1']),
    );
  });
});

it('maps AV1 CUVID without additional device controls', () => {
  const onChange = vi.fn();
  render(<Av1Cuvid.component onChange={onChange} />);
  expect(onChange.mock.lastCall?.[2]).toBe(true);
  expect(onChange.mock.lastCall?.[1].local).toEqual([
    '-hwaccel',
    'cuda',
    '-c:v',
    'av1_cuvid',
  ]);
});

it('updates the NVDEC device index', () => {
  const onChange = vi.fn();
  render(<Nvdec onChange={onChange} />);
  fireEvent.change(screen.getByLabelText('GPU'), {
    target: { value: '2' },
  });
  expect(onChange.mock.lastCall?.[0]).toMatchObject({ gpu: '2' });
  expect(onChange.mock.lastCall?.[1].local).toEqual(
    expect.arrayContaining(['-hwaccel_device', '2']),
  );
});
