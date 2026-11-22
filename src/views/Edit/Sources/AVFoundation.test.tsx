import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as AVFoundation from './AVFoundation';

describe('AVFoundation source', () => {
  it('initializes defaults and builds inputs with optional capture flags', () => {
    expect(AVFoundation.func.initSettings(null)).toEqual({
      aindex: 'default',
      vindex: 'default',
      format: 'nv12',
      framerate: '25',
      size: 'auto',
      cursor: false,
      clicks: false,
    });
    expect(AVFoundation.func.initSettings({ format: 'yuv420p' })).toMatchObject(
      { format: 'yuv420p' },
    );
    expect(
      AVFoundation.func.createInputs(AVFoundation.func.initSettings({})),
    ).toEqual([
      {
        address: 'default:default',
        options: [
          '-f',
          'avfoundation',
          '-framerate',
          '25',
          '-pixel_format',
          'nv12',
        ],
      },
    ]);
    expect(
      AVFoundation.func.createInputs({
        vindex: '1',
        aindex: '2',
        format: '',
        framerate: '0',
        size: '1920x1080',
        cursor: true,
        clicks: true,
      }),
    ).toEqual([
      {
        address: '1:2',
        options: [
          '-f',
          'avfoundation',
          '-video_size',
          '1920x1080',
          '-capture_cursor',
          '-capture_mouse_clicks',
        ],
      },
    ]);
  });

  it('renders available devices and handles refresh, probe, and checkbox changes', () => {
    const onChange = vi.fn();
    const onProbe = vi.fn();
    const onRefresh = vi.fn();
    render(
      <AVFoundation.component
        knownDevices={[
          { id: 'video0', name: 'Camera', media: 'video' },
          { id: 'audio0', name: 'Microphone', media: 'audio' },
          { id: 'ignored', name: 'Other', media: 'other' },
        ]}
        onChange={onChange}
        onProbe={onProbe}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Capture cursor' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Capture clicks' }));
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: true }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ clicks: true }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(onProbe).toHaveBeenCalledWith(
      expect.objectContaining({ vindex: 'default', aindex: 'default' }),
      expect.arrayContaining([
        expect.objectContaining({ address: 'default:default' }),
      ]),
    );
  });

  it('runs default handlers and renders the source icon', () => {
    render(<AVFoundation.component />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Capture cursor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(
      <AVFoundation.icon data-testid="avfoundation-icon" />,
    ).toHaveProperty('props');
  });
});
