import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import Audio from './Audio';

describe('Audio coder settings', () => {
  it('offers auto and custom bitrate values', () => {
    const onChange = vi.fn();
    render(
      <Audio.Bitrate
        label="Bitrate"
        value="128"
        allowAuto
        allowCustom
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'auto' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Custom ...' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: '256 kbit/s' }));
    expect(onChange).toHaveBeenCalledWith({ target: { value: '256' } });
  });

  it('adds extended layouts and inherit sampling options', () => {
    render(
      <>
        <Audio.Layout
          label="Layout"
          extended
          allowInherit
          allowAuto
          allowCustom
        />
        <Audio.Sampling label="Sampling" allowInherit allowAuto allowCustom />
      </>,
    );
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    expect(screen.getByRole('option', { name: '22.2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inherit' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'stereo' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    expect(
      screen.getByRole('option', { name: '96000 Hz' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inherit' })).toBeInTheDocument();
  });
});
