import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as HFlip from './HFlip';

describe('horizontal flip filter', () => {
  it('updates the enabled filter graph', () => {
    expect(HFlip.createGraph({ enabled: false })).toBe('');
    expect(HFlip.createGraph({ enabled: true })).toBe('hflip');
    expect(HFlip.defaults().graph).toBe('');
    expect(HFlip.summarize({})).toBe('Horizonal Flip');

    const onChange = vi.fn();
    render(<HFlip.component onChange={onChange} />);
    expect(onChange.mock.lastCall?.[2]).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Horizontal Flip' }));
    expect(onChange.mock.lastCall?.[1]).toBe('hflip');
  });
});
