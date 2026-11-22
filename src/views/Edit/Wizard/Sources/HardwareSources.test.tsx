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

  it('runs default hardware source handlers and renders their icons', () => {
    const v4l = render(<V4L.component knownDevices={devices} />);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(
      screen.getByRole('option', { name: 'USB camera (/dev/video0)' }),
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
