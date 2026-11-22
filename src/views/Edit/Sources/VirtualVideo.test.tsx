import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as VirtualVideo from './VirtualVideo';

const dimensions = { fps: '30', size: '1280x720' };

describe('virtual video source', () => {
  it('initializes defaults and maps every supported test pattern', () => {
    expect(VirtualVideo.func.initSettings(null)).toMatchObject({
      source: 'none',
      fps: '25',
      size: '1920x1080',
      rule: 'S23/B3',
      scale: '1920x1080',
      ratio: '2/3',
      mold: '10',
      flags: 'fast_bilinear',
    });
    expect(
      VirtualVideo.func.initSettings({ source: 'life', fps: '60' }),
    ).toMatchObject({
      source: 'life',
      fps: '60',
    });

    const expected: Record<string, string> = {
      testsrc: 'testsrc=rate=30:size=1280x720',
      testsrc2: 'testsrc2=rate=30:size=1280x720',
      pal75bars: 'pal75bars=rate=30:size=1280x720',
      pal100bars: 'pal100bars=rate=30:size=1280x720',
      rgbtestsrc: 'rgbtestsrc=rate=30:size=1280x720',
      smptebars: 'smptebars=rate=30:size=1280x720',
      smptehdbars: 'smptehdbars=rate=30:size=1280x720',
      yuvtestsrc: 'yuvtestsrc=rate=30:size=1280x720',
    };
    for (const [source, address] of Object.entries(expected)) {
      expect(VirtualVideo.func.createInputs({ source, ...dimensions })).toEqual(
        [
          {
            address,
            options: ['-f', 'lavfi', '-re'],
          },
        ],
      );
    }
  });

  it('builds Game of Life with optional scaling and returns no input for none', () => {
    expect(
      VirtualVideo.func.createInputs({
        source: 'life',
        ...dimensions,
        rule: 'B3/S23',
        ratio: '1/2',
        mold: '5',
        death_color: '#000000',
        life_color: '#ffffff',
        scale: '640x360',
        flags: 'bicubic',
      }),
    ).toEqual([
      {
        address:
          'life=rate=30:size=1280x720:rule=B3/S23:ratio=1/2:mold=5:death_color=#000000:life_color=#ffffff,scale=640x360:flags=bicubic',
        options: ['-f', 'lavfi', '-re'],
      },
    ]);
    expect(
      VirtualVideo.func.createInputs({
        source: 'life',
        ...dimensions,
        rule: 'B3/S23',
        ratio: '1/2',
        mold: '5',
        death_color: '#000',
        life_color: '#fff',
        scale: '1280x720',
      })[0].address,
    ).not.toContain(',scale=');
    expect(
      VirtualVideo.func.createInputs({ source: 'none', ...dimensions }),
    ).toEqual([]);
    expect(
      VirtualVideo.func.createInputs({
        source: 'not-supported',
        ...dimensions,
      }),
    ).toEqual([]);
  });

  it('renders the source selector and probes the current settings', () => {
    const onChange = vi.fn();
    const onProbe = vi.fn();
    const view = render(
      <VirtualVideo.component onChange={onChange} onProbe={onProbe} />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Test pattern' }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'testsrc' }),
    );
    view.rerender(
      <VirtualVideo.component
        settings={{ source: 'testsrc', ...dimensions }}
        onChange={onChange}
        onProbe={onProbe}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(onProbe).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'testsrc' }),
      VirtualVideo.func.createInputs({ source: 'testsrc', ...dimensions }),
    );
  });

  it('runs default handlers and renders the source icon', () => {
    render(<VirtualVideo.component />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Test pattern' }));
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    render(<VirtualVideo.icon data-testid="virtual-video-icon" />);
    expect(screen.getByTestId('virtual-video-icon')).toBeInTheDocument();
  });
});
