import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as Aac } from './aac';
import * as AacModule from './aac';
import { component as AacAudiotoolbox } from './aac_audiotoolbox';
import * as AacAudiotoolboxModule from './aac_audiotoolbox';
import { component as AacLibfdk } from './aac_libfdk';
import * as AacLibfdkModule from './aac_libfdk';
import { component as Mp3Libmp3lame } from './mp3_libmp3lame';
import * as Mp3Module from './mp3_libmp3lame';
import { component as Vorbis } from './vorbis';
import * as VorbisModule from './vorbis';
import { component as Libvorbis } from './vorbis_libvorbis';
import * as LibvorbisModule from './vorbis_libvorbis';

const encoders = [
  ['AAC', Aac, AacModule, true],
  ['AAC AudioToolbox', AacAudiotoolbox, AacAudiotoolboxModule, true],
  ['AAC libfdk', AacLibfdk, AacLibfdkModule, true],
  ['MP3 libmp3lame', Mp3Libmp3lame, Mp3Module, false],
  ['Vorbis', Vorbis, VorbisModule, false],
  ['Vorbis libvorbis', Libvorbis, LibvorbisModule, false],
] as const;

describe.each(encoders)(
  '%s bitrate encoder',
  (_name, Encoder, module, hasAacFilter) => {
    it('changes bitrate and maps AAC stream filtering correctly', () => {
      const onChange = vi.fn();
      render(<Encoder stream={{ codec: 'aac' }} onChange={onChange} />);
      fireEvent.mouseDown(screen.getByRole('combobox'));
      fireEvent.click(screen.getByRole('option', { name: '128 kbit/s' }));

      expect(onChange.mock.lastCall?.[0]).toMatchObject({ bitrate: '128' });
      expect(onChange.mock.lastCall?.[1].local).toEqual(
        expect.arrayContaining(['-b:a', '128k']),
      );
      expect(onChange.mock.lastCall?.[1].local.includes('-bsf:a')).toBe(
        hasAacFilter,
      );
      expect(module.defaults({}, {}).mapping.local.includes('-bsf:a')).toBe(
        false,
      );
    });
  },
);
