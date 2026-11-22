import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as H264Nvenc } from './h264_nvenc';

function choose(index: number, option: string) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  fireEvent.click(screen.getByRole('option', { name: option }));
}

describe('H.264 NVENC settings', () => {
  it('updates settings and covers optional mapping flags', () => {
    const onChange = vi.fn();
    render(<H264Nvenc onChange={onChange} />);

    choose(2, 'auto');
    choose(3, 'slow');
    choose(4, 'High quality');
    choose(5, 'high');
    choose(6, '4.1');
    choose(7, 'cbr');
    fireEvent.change(screen.getByLabelText('GPU'), {
      target: { value: '1' },
    });

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    const settings = calls.map(([current]) => current);
    expect(settings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gop: 'auto' }),
        expect.objectContaining({ preset: 'p5' }),
        expect.objectContaining({ tune: 'hq' }),
        expect.objectContaining({ profile: 'high' }),
        expect.objectContaining({ level: '4.1' }),
        expect.objectContaining({ rc: 'cbr' }),
        expect.objectContaining({ gpu: '1' }),
      ]),
    );
    const [, mapping] = calls.find(([current]) => current.gop === 'auto')!;
    expect(mapping.local).not.toContain('-g');
    expect(mapping.local).not.toContain('-profile:v');
    expect(mapping.local).not.toContain('-level:v');
    expect(mapping.local).not.toContain('-rc:v');
    const [, configuredMapping] = calls.find(
      ([current]) => current.profile === 'high',
    )!;
    expect(configuredMapping.local).toEqual(
      expect.arrayContaining(['-profile:v', 'high']),
    );
    const [, levelMapping] = calls.find(
      ([current]) => current.level === '4.1',
    )!;
    expect(levelMapping.local).toEqual(
      expect.arrayContaining(['-level:v', '4.1']),
    );
    const [, rateMapping] = calls.find(([current]) => current.rc === 'cbr')!;
    expect(rateMapping.local).toEqual(expect.arrayContaining(['-rc:v', 'cbr']));
  });
});
