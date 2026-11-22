import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import { component as Av1Libaom } from './av1_libaom';

describe('AV1 libaom settings', () => {
  it('omits fps mode controls and mapping for older FFmpeg versions', () => {
    const onChange = vi.fn();
    render(
      <Av1Libaom
        onChange={onChange}
        skills={{ ffmpeg: { version_major: 4 } }}
      />,
    );

    expect(screen.queryByText('Framerate mode')).not.toBeInTheDocument();
    const [, mapping] = onChange.mock.calls[0];
    expect(mapping.local).not.toContain('-fps_mode');
    expect(mapping.local).toEqual(
      expect.arrayContaining(['-g', '50', '-keyint_min', '50']),
    );

    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'auto' }));
    const [, automaticGopMapping] = onChange.mock.lastCall!;
    expect(automaticGopMapping.local).not.toContain('-g');
    expect(automaticGopMapping.local).not.toContain('-keyint_min');
  });
});
