import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as H264Vaapi } from './h264_vaapi';
import { component as HevcVaapi } from './hevc_vaapi';
import { component as Vp9Vaapi } from './vp9_vaapi';

const vaapiEncoders = [
  ['H.264 VAAPI', H264Vaapi, 'h264_vaapi', false],
  ['HEVC VAAPI', HevcVaapi, 'hevc_vaapi', true],
  ['VP9 VAAPI', Vp9Vaapi, 'vp9_vaapi', true],
] as const;

function choose(index: number, option: string) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  fireEvent.click(screen.getByRole('option', { name: option }));
}

describe.each(vaapiEncoders)(
  '%s encoder controls',
  (_name, Encoder, codec, alwaysGop) => {
    it('updates rate control, profile, and GOP mapping', () => {
      const onChange = vi.fn();
      render(<Encoder onChange={onChange} />);

      choose(0, 'Constant-bitrate');
      choose(3, 'auto');
      choose(4, 'high');
      fireEvent.change(screen.getByLabelText('Quality'), {
        target: { value: '20' },
      });

      const calls = onChange.mock.calls as [Record<string, string>, any][];
      expect(calls.map(([settings]) => settings)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ rc_mode: '2' }),
          expect.objectContaining({ gop: 'auto' }),
          expect.objectContaining({ profile: '100' }),
          expect.objectContaining({ quality: '20' }),
        ]),
      );
      const gopMapping = calls.find(
        ([settings]) => settings.gop === 'auto',
      )![1];
      expect(gopMapping.local).toContain(codec);
      if (alwaysGop) {
        expect(gopMapping.local).toContain('auto');
      } else {
        expect(gopMapping.local).not.toContain('-g');
      }
      expect(gopMapping.global).toEqual([
        ['-vaapi_device', '/dev/dri/renderD128'],
      ]);
      expect(gopMapping.filter).toEqual(['format=nv12', 'hwupload']);
    });
  },
);
