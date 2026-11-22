import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Resample from './Resample';

describe('aresample filter', () => {
  it('builds graphs for inherited and explicit audio properties', () => {
    expect(
      Resample.createGraph({ sampling: 'inherit', layout: 'inherit' }),
    ).toBe('');
    expect(Resample.createGraph({ sampling: '48000', layout: 'inherit' })).toBe(
      'aresample=osr=48000',
    );
    expect(Resample.createGraph({ sampling: 'inherit', layout: 'mono' })).toBe(
      'aresample=ochl=mono',
    );
    expect(Resample.defaults().graph).toBe('aresample=osr=44100:ochl=stereo');
  });

  it('updates layout, channel count, and sampling through the filter controls', () => {
    const onChange = vi.fn();
    render(<Resample.component onChange={onChange} />);

    const selects = screen.getAllByRole('combobox');
    fireEvent.mouseDown(selects[0]);
    fireEvent.click(screen.getByRole('option', { name: 'Inherit' }));
    expect(onChange.mock.lastCall?.[1]).toBe('aresample=ochl=stereo');

    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: 'mono' }));
    expect(onChange.mock.lastCall?.[0]).toMatchObject({
      layout: 'mono',
      channels: 1,
    });
    expect(onChange.mock.lastCall?.[1]).toBe('aresample=osr=44100:ochl=mono');
  });
});
