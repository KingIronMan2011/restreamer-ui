import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as Av1Nvenc } from './av1_nvenc';
import { component as HevcNvenc } from './hevc_nvenc';

function choose(index: number, option: string) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  fireEvent.click(screen.getByRole('option', { name: option }));
}

describe('NVENC encoder controls', () => {
  it('updates HEVC NVENC settings and optional mapping flags', () => {
    const onChange = vi.fn();
    render(<HevcNvenc onChange={onChange} />);

    choose(2, 'auto');
    choose(3, 'slow');
    choose(4, 'High quality');
    choose(5, 'main10');
    choose(6, '4.1');
    choose(7, 'cbr');

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    const mappings = calls.map(([, mapping]) => mapping.local);
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gop: 'auto' }),
        expect.objectContaining({ preset: 'p5' }),
        expect.objectContaining({ tune: 'hq' }),
        expect.objectContaining({ profile: 'main10' }),
        expect.objectContaining({ level: '4.1' }),
        expect.objectContaining({ rc: 'cbr' }),
      ]),
    );
    const automaticGop = calls.find(([settings]) => settings.gop === 'auto')![1]
      .local;
    expect(automaticGop).not.toContain('-g');
    expect(mappings.some((mapping) => mapping.includes('-profile:v'))).toBe(
      true,
    );
    expect(mappings.some((mapping) => mapping.includes('-level:v'))).toBe(true);
    expect(mappings.some((mapping) => mapping.includes('-rc:v'))).toBe(true);
  });

  it('updates AV1 NVENC settings and optional mapping flags', () => {
    const onChange = vi.fn();
    render(<Av1Nvenc onChange={onChange} />);

    choose(2, 'auto');
    choose(3, 'slow');
    choose(4, 'High quality');
    choose(5, '7.3');
    choose(6, 'vbr');

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gop: 'auto' }),
        expect.objectContaining({ preset: 'p5' }),
        expect.objectContaining({ tune: 'hq' }),
        expect.objectContaining({ level: '7.3' }),
        expect.objectContaining({ rc: 'vbr' }),
      ]),
    );
    const autoMapping = calls.find(([settings]) => settings.gop === 'auto')![1]
      .local;
    expect(autoMapping).not.toContain('-g');
    expect(
      calls.some(([, mapping]) => mapping.local.includes('-level:v')),
    ).toBe(true);
    expect(calls.some(([, mapping]) => mapping.local.includes('-rc:v'))).toBe(
      true,
    );
  });
});
