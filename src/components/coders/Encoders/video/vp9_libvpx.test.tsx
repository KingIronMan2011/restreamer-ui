import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import * as Vp9Libvpx from './vp9_libvpx';

describe('VP9 libvpx settings', () => {
  it('omits GOP and fps-mode flags for automatic GOP on older FFmpeg', () => {
    const onChange = vi.fn();
    render(
      <Vp9Libvpx.component
        onChange={onChange}
        skills={{ ffmpeg: { version_major: 4 } }}
      />,
    );

    expect(screen.queryByText('Framerate mode')).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'auto' }));
    const [settings, mapping] = onChange.mock.lastCall!;
    expect(settings).toMatchObject({ gop: 'auto' });
    expect(mapping.local).not.toContain('-g');
    expect(mapping.local).not.toContain('-keyint_min');
    expect(mapping.local).not.toContain('-fps_mode');
  });
});
