import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import Audio from './Audio';

describe('audio encoder settings', () => {
  it('offers bitrate auto and custom values', () => {
    const onChange = vi.fn();
    render(
      <Audio.Bitrate value="64" allowAuto allowCustom onChange={onChange} />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'auto' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Custom ...' }));
    fireEvent.change(screen.getByLabelText('Custom bitrate (kbit/s)'), {
      target: { value: '96' },
    });
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Custom bitrate (kbit/s)')).toHaveValue('96');
  });

  it('offers extended layouts, inherited values, and custom layout and sampling', () => {
    const onLayoutChange = vi.fn();
    const layout = render(
      <Audio.Layout
        value="stereo"
        extended
        allowAuto
        allowInherit
        allowCustom
        onChange={onLayoutChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Inherit' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'auto' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: '22.2' }));
    expect(onLayoutChange).toHaveBeenCalled();
    layout.unmount();

    const onSamplingChange = vi.fn();
    render(
      <Audio.Sampling
        value="44100"
        allowAuto
        allowInherit
        allowCustom
        onChange={onSamplingChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Inherit' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Custom ...' }));
    fireEvent.change(screen.getByLabelText('Custom sampling (Hz)'), {
      target: { value: '32000' },
    });
    expect(onSamplingChange).toHaveBeenCalled();
  });

  it('runs default handlers for bitrate, layout, and sampling changes', () => {
    const bitrate = render(<Audio.Bitrate value="64" />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '128 kbit/s' }));
    bitrate.unmount();

    const layout = render(<Audio.Layout value="stereo" />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'mono' }));
    layout.unmount();

    render(<Audio.Sampling value="44100" />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '48000 Hz' }));
  });
});
