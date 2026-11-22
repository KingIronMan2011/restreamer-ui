import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as X11grab from './X11grab';

describe('X11 screen source', () => {
  it('sets defaults and builds standard and custom-device arguments', () => {
    expect(X11grab.func.initSettings(null)).toMatchObject({
      probesize: 42_000_000,
      fflags: ['nobuffer'],
      thread_queue_size: 1024,
      video_size: '1280x720',
      framerate: '25',
      device: ':1',
      draw_mouse: false,
      follow_mouse: 'centered',
    });
    expect(X11grab.func.initSettings({ device: ':2' })).toMatchObject({
      device: ':2',
    });

    expect(
      X11grab.func.createInputs({
        device: ':1',
        thread_queue_size: 1024,
        probesize: 42_000_000,
        fflags: ['nobuffer', 'genpts'],
        video_size: '1280x720',
        framerate: '25',
        follow_mouse: 'centered',
      }),
    ).toEqual([
      {
        address: ':1',
        options: [
          '-thread_queue_size',
          1024,
          '-probesize',
          '42000000',
          '-fflags',
          '+nobuffer+genpts',
          '-f',
          'x11grab',
          '-video_size',
          '1280x720',
          '-framerate',
          '25',
          '-draw_mouse',
          '0',
        ],
      },
    ]);

    expect(
      X11grab.func.createInputs({
        device: 'custom',
        deviceCustom: ':99',
        thread_queue_size: 1,
        probesize: 32,
        fflags: [],
        video_size: '640x480',
        framerate: '10',
        follow_mouse: true,
      })[0],
    ).toEqual({
      address: ':99',
      options: [
        '-thread_queue_size',
        1,
        '-probesize',
        '32',
        '-f',
        'x11grab',
        '-video_size',
        '640x480',
        '-framerate',
        '10',
        '-draw_mouse',
        '1',
        '-follow_mouse',
        true,
      ],
    });
    expect(
      X11grab.func.createInputs({
        device: 'none',
        deviceCustom: 'none',
        thread_queue_size: 1,
        probesize: 32,
        fflags: [],
        video_size: '1x1',
        framerate: '0',
        follow_mouse: false,
      })[0].address,
    ).toBe('none');
  });

  it('refreshes devices, changes draw mouse, and probes current settings', () => {
    const onChange = vi.fn();
    const onProbe = vi.fn();
    const onRefresh = vi.fn();
    const settings = {
      device: ':1',
      deviceCustom: ':99',
      probesize: 42_000_000,
      fflags: ['nobuffer'],
      thread_queue_size: 1024,
      video_size: '1280x720',
      framerate: '25',
      draw_mouse: false,
      follow_mouse: 'centered',
    };
    render(
      <X11grab.component
        settings={settings}
        onChange={onChange}
        onProbe={onProbe}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Draw mouse' }));
    fireEvent.change(screen.getByLabelText('probesize (bytes)'), {
      target: { value: '1000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ draw_mouse: true }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ probesize: '1000' }),
    );
    expect(onProbe).toHaveBeenCalledWith(
      settings,
      X11grab.func.createInputs(settings),
    );
  });

  it('uses defaults for callbacks and supports a custom follow-mouse point', () => {
    const Icon = X11grab.icon;
    const { container } = render(
      <>
        <Icon />
        <X11grab.component
          knownDevices={[
            { id: 'camera0', name: 'Camera', media: 'video' },
            { id: 'mic0', name: 'Microphone', media: 'audio' },
          ]}
          settings={{
            device: 'custom',
            deviceCustom: ':99',
            draw_mouse: true,
            follow_mouse: 'centered',
          }}
        />
      </>,
    );

    const comboboxes = screen.getAllByRole('combobox');
    fireEvent.mouseDown(comboboxes[comboboxes.length - 1]);
    const customOptions = screen.getAllByRole('option', {
      name: 'Custom ...',
    });
    fireEvent.click(customOptions[customOptions.length - 1]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Follow mouse' }), {
      target: { value: '120,80' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));

    expect(screen.getByRole('textbox', { name: 'Follow mouse' })).toHaveValue(
      '120,80',
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
