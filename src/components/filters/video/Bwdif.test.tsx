import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Bwdif from './Bwdif';

describe('bwdif filter', () => {
  it('creates enabled and disabled filter graphs', () => {
    expect(Bwdif.createGraph({ enabled: false })).toBe('');
    expect(
      Bwdif.createGraph({ enabled: true, mode: '0', parity: '1', deint: '1' }),
    ).toBe('bwdif=mode=0:parity=1:deint=1');
    expect(Bwdif.defaults().graph).toBe('');
  });

  it('updates mode, field parity, deinterlace scope, and enabled state', () => {
    const onChange = vi.fn();
    render(
      <Bwdif.component
        settings={{ enabled: true, mode: '1', parity: '-1', deint: '0' }}
        onChange={onChange}
      />,
    );

    const options = ['Each frames', 'Bottom field', 'Marked frames'];
    for (const [index, option] of options.entries()) {
      fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
      fireEvent.click(screen.getByRole('option', { name: option }));
    }

    expect(onChange.mock.calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ mode: '0' }),
        expect.objectContaining({ parity: '1' }),
        expect.objectContaining({ deint: '1' }),
      ]),
    );
    expect(onChange.mock.calls.map(([, graph]) => graph)).toEqual(
      expect.arrayContaining([
        'bwdif=mode=0:parity=-1:deint=0',
        'bwdif=mode=1:parity=1:deint=0',
        'bwdif=mode=1:parity=-1:deint=1',
      ]),
    );

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Deinterlace (bwdif)' }),
    );
    expect(onChange.mock.lastCall?.[1]).toBe('');
  });

  it('accepts default settings and its default change callback', () => {
    render(<Bwdif.component />);
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Deinterlace (bwdif)' }),
    );
  });
});
