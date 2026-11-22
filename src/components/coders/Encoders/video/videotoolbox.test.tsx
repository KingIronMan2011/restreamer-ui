import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as H264VideoToolbox } from './h264_videotoolbox';
import { component as HevcVideoToolbox } from './hevc_videotoolbox';

const encoders = [
  [
    'H.264 VideoToolbox',
    H264VideoToolbox,
    3,
    'high',
    'cabac',
    'h264_videotoolbox',
  ],
  [
    'HEVC VideoToolbox',
    HevcVideoToolbox,
    3,
    'main10',
    null,
    'hevc_videotoolbox',
  ],
] as const;

function choose(index: number, option: string) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  fireEvent.click(screen.getByRole('option', { name: option }));
}

describe.each(encoders)(
  '%s settings',
  (_name, Encoder, profileIndex, profile, entropy, codec) => {
    it('maps GOP and profile settings, including H.264 entropy coding', () => {
      const onChange = vi.fn();
      render(<Encoder onChange={onChange} />);

      choose(2, 'auto');
      choose(profileIndex, profile);
      if (entropy) {
        choose(profileIndex + 1, entropy === 'cabac' ? 'CABAC' : entropy);
      }

      const calls = onChange.mock.calls as [Record<string, string>, any][];
      expect(calls.map(([settings]) => settings)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ gop: 'auto' }),
          expect.objectContaining({ profile }),
          ...(entropy ? [expect.objectContaining({ entropy })] : []),
        ]),
      );
      const gopMapping = calls.find(([settings]) => settings.gop === 'auto')![1]
        .local;
      expect(gopMapping).toContain(codec);
      expect(gopMapping).not.toContain('-g');
      const profileMapping = calls.find(
        ([settings]) => settings.profile === profile,
      )![1].local;
      expect(profileMapping).toEqual(
        expect.arrayContaining(['-profile:v', profile]),
      );
      if (entropy) {
        const entropyMapping = calls.find(
          ([settings]) => settings.entropy === entropy,
        )![1].local;
        expect(entropyMapping).toEqual(
          expect.arrayContaining(['-coder:v', entropy]),
        );
      }
    });
  },
);
