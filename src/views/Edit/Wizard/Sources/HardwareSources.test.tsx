import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import * as AVFoundation from './AVFoundation';
import * as Raspicam from './Raspicam';
import * as V4L from './V4L';

const devices = [
  {
    id: '/dev/video0',
    name: 'USB camera',
    media: 'video',
    extra: 'UVC camera',
  },
  {
    id: '/dev/video2',
    name: 'Second USB camera',
    media: 'video',
    extra: 'UVC camera',
  },
  {
    id: '/dev/video1',
    name: 'Pi camera',
    media: 'video',
    extra: 'bcm2835-v4l2 camera',
  },
  { id: 'mic0', name: 'Microphone', media: 'audio', extra: 'USB audio' },
];

describe('wizard hardware sources', () => {
  it('selects available non-Raspberry Pi cameras and reports missing devices', () => {
    const onChange = vi.fn();
    const onRefresh = vi.fn();
    render(
      <V4L.component
        knownDevices={devices}
        onChange={onChange}
        onRefresh={onRefresh}
      />,
    );
    expect(onChange).toHaveBeenCalledWith(
      V4L.id,
      expect.objectContaining({ device: '/dev/video0' }),
      expect.any(Array),
      true,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();

    const noDevicesChange = vi.fn();
    render(<V4L.component knownDevices={[]} onChange={noDevicesChange} />);
    expect(noDevicesChange).toHaveBeenCalledWith(
      V4L.id,
      expect.any(Object),
      expect.any(Array),
      false,
    );
  });

  it('selects Raspberry Pi cameras from their device signature', () => {
    const onChange = vi.fn();
    render(<Raspicam.component knownDevices={devices} onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith(
      Raspicam.id,
      expect.objectContaining({ device: '/dev/video1' }),
      expect.any(Array),
      true,
    );
  });

  it('sets connected Apple video and audio devices and handles refresh', () => {
    const onChange = vi.fn();
    const onRefresh = vi.fn();
    render(
      <AVFoundation.component
        knownDevices={devices}
        onChange={onChange}
        onRefresh={onRefresh}
      />,
    );
    expect(onChange).toHaveBeenCalledWith(
      AVFoundation.id,
      expect.objectContaining({ vindex: 'default', aindex: 'default' }),
      expect.any(Array),
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('shows a disabled placeholder when Apple video devices are unavailable', () => {
    render(<AVFoundation.component knownDevices={[]} />);
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    expect(
      screen.getByRole('option', { name: 'No input device available' }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('repairs stale camera IDs and handles an empty device list', () => {
    const onChange = vi.fn();
    render(
      <Raspicam.component
        settings={{ device: '/dev/custom-camera' }}
        knownDevices={devices}
        onChange={onChange}
      />,
    );
    expect(onChange).toHaveBeenCalledWith(
      Raspicam.id,
      expect.objectContaining({ device: '/dev/video1' }),
      expect.any(Array),
      true,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    const emptyDeviceChange = vi.fn();
    render(
      <Raspicam.component knownDevices={[]} onChange={emptyDeviceChange} />,
    );
    expect(emptyDeviceChange).toHaveBeenCalledWith(
      Raspicam.id,
      expect.any(Object),
      expect.any(Array),
      true,
    );
  });

  it('updates the selected Raspberry Pi camera', () => {
    const onChange = vi.fn();
    render(
      <Raspicam.component
        settings={{ device: '/dev/video1' }}
        knownDevices={[
          devices[2],
          {
            id: '/dev/video2',
            name: 'Second Pi camera',
            media: 'video',
            extra: 'bcm2835_v4l2',
          },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(
      screen.getByRole('option', { name: 'Second Pi camera (/dev/video2)' }),
    );
    expect(onChange).toHaveBeenLastCalledWith(
      Raspicam.id,
      expect.objectContaining({ device: '/dev/video2' }),
      expect.any(Array),
      true,
    );
  });

  it('runs default hardware source handlers and renders their icons', () => {
    const v4l = render(<V4L.component knownDevices={devices} />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(
      screen.getByRole('option', { name: 'Second USB camera (/dev/video2)' }),
    );
    render(<V4L.icon data-testid="v4l-icon" />);
    expect(screen.getByTestId('v4l-icon')).toBeInTheDocument();
    v4l.unmount();

    const apple = render(<AVFoundation.component knownDevices={devices} />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'USB camera' }));
    render(<AVFoundation.icon data-testid="avfoundation-wizard-icon" />);
    expect(screen.getByTestId('avfoundation-wizard-icon')).toBeInTheDocument();
    apple.unmount();

    render(<Raspicam.component knownDevices={devices} />);
    render(<Raspicam.icon data-testid="raspicam-icon" />);
    expect(screen.getByTestId('raspicam-icon')).toBeInTheDocument();
  });
});
