import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as AudioLoop from './AudioLoop';
import * as VideoLoop from './VideoLoop';

describe.each([
  {
    label: 'audio',
    source: AudioLoop,
    sourceId: 'audioloop',
    type: 'audio',
    mime: 'audio/mpeg',
    accept: 'audio/*',
    address: '/media/audio.mp3',
  },
  {
    label: 'video',
    source: VideoLoop,
    sourceId: 'videoloop',
    type: 'video',
    mime: 'image/png',
    accept: 'image/*',
    address: '/media/video.png',
  },
])(
  '$label loop source',
  ({ source, sourceId, type, mime, accept, address }) => {
    it('initializes settings and builds a looped, real-time input', () => {
      expect(source.func.initSettings(null)).toEqual({
        address: '',
        mimetype: '',
      });
      expect(
        source.func.initSettings({ address: '/file', mimetype: mime }),
      ).toMatchObject({
        address: '/file',
        mimetype: mime,
      });
      const input = source.func.createInputs({ address, mimetype: mime })[0];
      expect(input.address).toBe(`{diskfs}${address}`);
      expect(input.options).toContain('-re');
      if (type === 'audio') {
        expect(input.options).toEqual(['-stream_loop', '-1', '-re']);
      } else {
        expect(input.options).toEqual(['-framerate', '1', '-loop', '1', '-re']);
        expect(
          source.func.createInputs({ address, mimetype: 'video/mp4' })[0]
            .options,
        ).toEqual(['-stream_loop', '-1', '-re']);
      }
    });

    it('uploads accepted media and probes with the stored path', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onProbe = vi.fn();
      const onStore = vi.fn(async (_name, _data, progress) => {
        progress(true, 0.5, 10);
        progress(false, 0, 10);
        return address;
      });
      const view = render(
        <source.component
          onChange={onChange}
          onProbe={onProbe}
          onStore={onStore}
        />,
      );
      const file = new File(
        ['media'],
        type === 'audio' ? 'sound.mp3' : 'image.png',
        { type: mime },
      );
      await user.upload(screen.getByLabelText('Upload'), file);
      expect(onStore).toHaveBeenCalledWith(
        `${sourceId}.source`,
        file,
        expect.any(Function),
      );
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ address, mimetype: accept }),
      );

      view.rerender(
        <source.component
          settings={{ address, mimetype: mime }}
          onChange={onChange}
          onProbe={onProbe}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
      expect(onProbe).toHaveBeenCalledWith(
        expect.objectContaining({ address, mimetype: mime }),
        source.func.createInputs({ address, mimetype: mime }),
      );
    });

    it('supports file upload and probe with default callbacks', async () => {
      const user = userEvent.setup();
      const Icon = source.icon;
      const { container } = render(
        <>
          <Icon />
          <source.component settings={{ address, mimetype: mime }} />
        </>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
      await user.upload(
        screen.getByLabelText('Upload'),
        new File(['media'], type === 'audio' ? 'default.mp3' : 'default.png', {
          type: mime,
        }),
      );

      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  },
);
