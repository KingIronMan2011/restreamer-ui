import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Transpose from './Transpose';

describe('transpose filter', () => {
  it('maps none, clockwise, half-turn, and counterclockwise settings', () => {
    const clockwise = 'transpose=dir=clock:passthrough=none';
    const counterclockwise = 'transpose=dir=cclock:passthrough=none';
    expect(Transpose.createGraph({ value: 'none' })).toBe('');
    expect(Transpose.createGraph({ value: '90' })).toBe(clockwise);
    expect(Transpose.createGraph({ value: '180' })).toBe(
      `${clockwise},${clockwise}`,
    );
    expect(Transpose.createGraph({ value: '270' })).toBe(counterclockwise);
    expect(Transpose.defaults().graph).toBe('');
    expect(Transpose.summarize({ value: '90' })).toBe(
      'Transpose (90° clockwise)',
    );
  });

  it('reports a changed rotation', () => {
    const onChange = vi.fn();
    render(<Transpose.component onChange={onChange} />);
    expect(onChange.mock.lastCall?.[2]).toBe(true);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '180°' }));
    expect(onChange.mock.lastCall?.[0]).toMatchObject({ value: '180' });
    expect(onChange.mock.lastCall?.[1]).toBe(
      'transpose=dir=clock:passthrough=none,transpose=dir=clock:passthrough=none',
    );
  });

  it('accepts the default change callback', () => {
    render(<Transpose.component />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '90°' }));
  });
});
