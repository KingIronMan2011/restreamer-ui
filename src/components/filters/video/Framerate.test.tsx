import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Framerate from './Framerate';

describe('framerate filter', () => {
  it('creates a graph only when frame interpolation is enabled', () => {
    expect(Framerate.createGraph({ enabled: false, fps: '24' })).toBe('');
    expect(Framerate.createGraph({ enabled: true, fps: '24' })).toBe(
      'framerate=fps=24',
    );
    expect(Framerate.defaults().graph).toBe('');
    expect(Framerate.summarize({ fps: '24' })).toBe(
      'Frame Interpolation (24fps)',
    );
  });

  it('reports automatic settings and updates enabled interpolation controls', () => {
    const onChange = vi.fn();
    const view = render(<Framerate.component onChange={onChange} />);
    expect(onChange.mock.lastCall?.[2]).toBe(true);
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Framerate conversion (frame interpolation)',
      }),
    );
    expect(onChange.mock.lastCall?.[1]).toBe('framerate=fps=30');
    view.unmount();

    render(
      <Framerate.component
        settings={{ enabled: true, fps: '30' }}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '25 (PAL)' }));
    expect(
      onChange.mock.calls.some(([settings]) => settings.fps === '25'),
    ).toBe(true);
    expect(
      screen.getByRole('checkbox', {
        name: 'Framerate conversion (frame interpolation)',
      }),
    ).toBeChecked();
  });
});
