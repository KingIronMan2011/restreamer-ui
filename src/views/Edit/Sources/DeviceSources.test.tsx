import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as ALSA from './ALSA';
import * as Raspicam from './Raspicam';
import * as V4L from './V4L';

const knownDevices = [
  { id: 'hw:2,0', name: 'Microphone', media: 'audio' },
  { id: '/dev/video0', name: 'USB camera', media: 'video' },
];

describe.each([
  {
    name: 'ALSA',
    source: ALSA,
    settings: {
      address: 'hw:1,0',
      device: '1,0',
      sampling: '44100',
      channels: '1',
      delay: 0,
    },
  },
  {
    name: 'Raspberry Pi camera',
    source: Raspicam,
    settings: {
      device: 'none',
      deviceCustom: '/dev/video0',
      format: 'yuv420p',
      framerate: '25',
      size: '1920x1080',
    },
  },
  {
    name: 'V4L camera',
    source: V4L,
    settings: {
      device: 'none',
      deviceCustom: '/dev/video0',
      format: 'nv12',
      framerate: '25',
      size: '1280x720',
    },
  },
])('$name source', ({ source, settings }) => {
  it('initializes settings, builds input arguments, refreshes devices, and probes', () => {
    const defaults = source.func.initSettings(null);
    expect(defaults).toMatchObject(
      settings.address
        ? {
            address: 'hw:1,0',
            device: '1,0',
            sampling: '44100',
            channels: '1',
            delay: 0,
          }
        : {
            device: 'none',
            format: settings.format,
            framerate: settings.framerate,
            size: settings.size,
          },
    );
    const inputSettings = { ...settings, deviceCustom: '/dev/video0' };
    const input = source.func.createInputs(inputSettings)[0];
    expect(input.address).toBe(settings.address ? 'hw:1,0' : '/dev/video0');
    if (settings.address) {
      expect(
        source.func.createInputs({ ...settings, delay: 5 })[0].options,
      ).toContain('-itsoffset');
    } else {
      expect(input.options).toContain('-re');
    }

    const onChange = vi.fn();
    const onProbe = vi.fn();
    const onRefresh = vi.fn();
    render(
      <source.component
        settings={settings}
        knownDevices={knownDevices}
        onChange={onChange}
        onProbe={onProbe}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onProbe).toHaveBeenCalledWith(
      settings,
      source.func.createInputs(settings),
    );
  });
});
