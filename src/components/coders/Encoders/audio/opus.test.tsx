import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import * as Opus from './opus';
import { component as Libopus } from './opus_libopus';

describe('Opus encoder settings', () => {
  it('maps delay modes and updates bitrate and delay', () => {
    const onChange = vi.fn();
    render(<Opus.component onChange={onChange} />);
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: '128 kbit/s' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: '30ms' }));

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bitrate: '128' }),
        expect.objectContaining({ delay: '30' }),
      ]),
    );
    expect(
      calls.find(([settings]) => settings.delay === '30')![1].local,
    ).toEqual(expect.arrayContaining(['opus_delay', '30']));
    const defaults = Opus.defaults({}, {}).mapping.local;
    expect(defaults).not.toContain('opus_delay');
  });

  it('updates libopus bitrate while preserving pass-through options', () => {
    const onChange = vi.fn();
    render(<Libopus onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '128 kbit/s' }));
    expect(onChange.mock.lastCall?.[0]).toMatchObject({ bitrate: '128' });
    expect(onChange.mock.lastCall?.[1].local).toEqual(
      expect.arrayContaining([
        '-codec:a',
        'libopus',
        '-b:a',
        '128k',
        '-shortest',
      ]),
    );
  });

  it('accepts a custom Opus delay', () => {
    const onChange = vi.fn();
    render(<Opus.component onChange={onChange} />);
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: 'Custom ...' }));
    fireEvent.change(screen.getByLabelText('Custom delay'), {
      target: { value: '40' },
    });
    expect(
      onChange.mock.calls.some(([settings]) => settings.delay === '40'),
    ).toBe(true);
    expect(
      onChange.mock.calls.some(([, mapping]) => mapping.local.includes('40')),
    ).toBe(true);
  });
});
