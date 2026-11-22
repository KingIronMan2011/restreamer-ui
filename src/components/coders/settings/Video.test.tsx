import React from 'react';
import { describe, expect, it } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import Video from './Video';

const customControls = [
  ['bitrate', Video.Bitrate, 'Bitrate', 'Custom bitrate (kbit/s)', true],
  [
    'keyframe interval',
    Video.GOP,
    'Keyframe interval (seconds)',
    'Custom keyframe interval',
    true,
  ],
  ['framerate', Video.Framerate, 'Framerate', 'Custom framerate', true],
  ['size', Video.Size, 'Size', 'Custom size', true],
  ['height', Video.Height, 'Height', 'Custom size', false],
  ['width', Video.Width, 'Width', 'Custom size', false],
  ['format', Video.Format, 'Format', 'Custom format', true],
  ['pixel format', Video.PixFormat, 'Pixel Format', 'Custom format', true],
] as const;

describe.each(customControls)(
  'video %s control',
  (_name, Control, label, customLabel, hasAuto) => {
    it('offers auto and custom values and accepts custom input', () => {
      const view = render(
        <Control
          label={label}
          customLabel={customLabel}
          value=""
          allowAuto={hasAuto}
          allowCustom
        />,
      );
      fireEvent.mouseDown(screen.getByRole('combobox'));
      if (hasAuto) {
        expect(
          screen.getByRole('option', { name: 'auto' }),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.queryByRole('option', { name: 'auto' }),
        ).not.toBeInTheDocument();
      }
      fireEvent.click(screen.getByRole('option', { name: 'Custom ...' }));
      fireEvent.change(screen.getByLabelText(customLabel), {
        target: { value: 'custom-value' },
      });
      expect(screen.getByLabelText(customLabel)).toHaveValue('custom-value');
      view.rerender(
        <Control
          label={label}
          customLabel={customLabel}
          value=""
          allowAuto={false}
          allowCustom={false}
        />,
      );
      fireEvent.mouseDown(screen.getByRole('combobox'));
      expect(
        screen.queryByRole('option', { name: 'Custom ...' }),
      ).not.toBeInTheDocument();
    });
  },
);

it('updates profile and framerate mode selections', () => {
  const profile = render(<Video.Profile value="auto" />);
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'high' }));
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  profile.unmount();

  render(<Video.FpsMode value="auto" />);
  fireEvent.mouseDown(screen.getByRole('combobox'));
  fireEvent.click(
    screen.getByRole('option', { name: 'Constant frame rate (CFR)' }),
  );
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('accepts a GPU index', () => {
  render(<Video.GPU value="0" />);
  fireEvent.change(screen.getByLabelText('GPU'), { target: { value: '1' } });
  expect(screen.getByLabelText('GPU')).toHaveValue(0);
});
