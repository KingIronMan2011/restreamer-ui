import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as VirtualAudio from './VirtualAudio';

describe('virtual audio source', () => {
  it('initializes defaults and creates each supported lavfi input', () => {
    expect(VirtualAudio.func.initSettings(null)).toEqual({
      source: 'silence',
      layout: 'stereo',
      sampling: '44100',
      color: 'white',
      frequency: 440,
      beepfactor: 4,
      amplitude: 1,
    });
    expect(
      VirtualAudio.func.initSettings({ source: 'noise', amplitude: 0.5 }),
    ).toMatchObject({
      source: 'noise',
      amplitude: 0.5,
      layout: 'stereo',
    });
    const options = ['-f', 'lavfi', '-re'];
    expect(
      VirtualAudio.func.createInputs({
        source: 'silence',
        sampling: '48000',
        layout: 'mono',
      }),
    ).toEqual([{ address: 'anullsrc=r=48000:cl=mono', options }]);
    expect(
      VirtualAudio.func.createInputs({
        source: 'noise',
        sampling: '22050',
        color: 'pink',
        amplitude: 0.4,
      }),
    ).toEqual([
      { address: 'anoisesrc=r=22050:color=pink:amplitude=0.4', options },
    ]);
    expect(
      VirtualAudio.func.createInputs({
        source: 'sine',
        sampling: '96000',
        frequency: 880,
        beepfactor: 2,
      }),
    ).toEqual([
      { address: 'sine=r=96000:frequency=880:beep_factor=2', options },
    ]);
    expect(VirtualAudio.func.createInputs({ source: 'unsupported' })).toEqual(
      [],
    );
  });

  it('shows source specific controls, forwards changes, and probes the current config', () => {
    const onChange = vi.fn();
    const onProbe = vi.fn();
    const view = render(
      <VirtualAudio.component onChange={onChange} onProbe={onProbe} />,
    );
    expect(screen.getByText('Select audio source:')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'mono' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ layout: 'mono' }),
    );

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Noise' }));
    view.rerender(
      <VirtualAudio.component
        settings={{ source: 'noise' }}
        onChange={onChange}
        onProbe={onProbe}
      />,
    );
    expect(screen.getByLabelText('Amplitude')).toHaveValue('1');
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'pink' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ source: 'noise', color: 'pink' }),
    );

    view.rerender(
      <VirtualAudio.component
        settings={{ source: 'sine' }}
        onChange={onChange}
        onProbe={onProbe}
      />,
    );
    expect(screen.getByLabelText('Frequency (Hz)')).toHaveValue('440');
    expect(screen.getByLabelText('Beep factor')).toHaveValue('4');
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(onProbe).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'sine', frequency: 440 }),
      VirtualAudio.func.createInputs({
        source: 'sine',
        frequency: 440,
        sampling: '44100',
        beepfactor: 4,
      }),
    );
  });

  it('runs default handlers and renders the source icon', () => {
    render(<VirtualAudio.component />);
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Noise' }));
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    render(<VirtualAudio.icon data-testid="virtual-audio-icon" />);
    expect(screen.getByTestId('virtual-audio-icon')).toBeInTheDocument();
  });
});
