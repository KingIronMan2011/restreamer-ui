import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as VFlip from './VFlip';

describe('vertical flip filter', () => {
  it('updates the enabled filter graph', () => {
    expect(VFlip.createGraph({ enabled: false })).toBe('');
    expect(VFlip.createGraph({ enabled: true })).toBe('vflip');
    expect(VFlip.defaults().graph).toBe('');
    expect(VFlip.summarize({})).toBe('Vertical Flip');

    const onChange = vi.fn();
    render(<VFlip.component onChange={onChange} />);
    expect(onChange.mock.lastCall?.[2]).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Vertical Flip' }));
    expect(onChange.mock.lastCall?.[1]).toBe('vflip');
  });
});
