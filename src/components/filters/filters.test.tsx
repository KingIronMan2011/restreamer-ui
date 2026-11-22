import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../utils/testing';
import * as Loudnorm from './audio/Loudnorm';
import * as Pan from './audio/Pan';
import * as Resample from './audio/Resample';
import * as Volume from './audio/Volume';
import * as Bwdif from './video/Bwdif';
import * as Framerate from './video/Framerate';
import * as HFlip from './video/HFlip';
import * as Scale from './video/Scale';
import * as Transpose from './video/Transpose';
import * as VFlip from './video/VFlip';

describe('filter defaults, graph builders, and summaries', () => {
  it('covers volume, scale, transpose, and pan configurations', () => {
    expect(Volume.defaults().graph).toBe('');
    expect(Volume.createGraph({ level: 'custom', db: -6 })).toBe(
      'volume=volume=-6dB',
    );
    expect(Volume.createGraph({ level: '50' })).toBe('volume=volume=0.5');
    expect(Volume.summarize({ level: 'custom', db: -6 })).toBe('Volume (-6dB)');
    expect(Volume.summarize({ level: '80' })).toBe('Volume (80%)');

    expect(Scale.defaults().graph).toBe('');
    expect(Scale.createGraph({ mode: 'height', height: '480' })).toBe(
      'scale=-1:480',
    );
    expect(Scale.createGraph({ mode: 'width', width: '640' })).toBe(
      'scale=640:-1',
    );
    expect(Scale.createGraph({ mode: 'fix', fix: '640x480' })).toBe(
      'scale=640x480',
    );
    expect(Scale.summarize({ mode: 'height', height: '480' })).toBe(
      'Scale (-1:480)',
    );
    expect(Scale.summarize({ mode: 'width', width: '640' })).toBe(
      'Scale (640:-1)',
    );
    expect(Scale.summarize({ mode: 'fix', fix: '640x480' })).toBe(
      'Scale (640x480)',
    );
    expect(Scale.summarize({ mode: 'none' })).toBeUndefined();

    expect(Transpose.defaults().graph).toBe('');
    expect(Transpose.createGraph({ value: '90' })).toBe(
      'transpose=dir=clock:passthrough=none',
    );
    expect(Transpose.createGraph({ value: '180' })).toBe(
      'transpose=dir=clock:passthrough=none,transpose=dir=clock:passthrough=none',
    );
    expect(Transpose.createGraph({ value: '270' })).toBe(
      'transpose=dir=cclock:passthrough=none',
    );
    expect(Transpose.summarize({ value: '90' })).toBe(
      'Transpose (90° clockwise)',
    );

    expect(Pan.defaults().graph).toEqual([]);
    expect(Pan.createGraph({ value: 'mute_left' })).toEqual([
      'pan=stereo|c1=c1',
    ]);
    expect(Pan.createGraph({ value: 'mute_right' })).toEqual([
      'pan=stereo|c0=c0',
    ]);
    expect(Pan.summarize({ value: 'mute_left' })).toBe('Pan (mute left)');
  });

  it('covers enableable video and audio filter graphs', () => {
    expect(Bwdif.defaults().graph).toBe('');
    expect(
      Bwdif.createGraph({ enabled: true, mode: '0', parity: '1', deint: '1' }),
    ).toBe('bwdif=mode=0:parity=1:deint=1');
    expect(Bwdif.summarize({})).toBe('Deinterlacing Filter');

    expect(Framerate.defaults().graph).toBe('');
    expect(Framerate.createGraph({ enabled: true, fps: '60' })).toBe(
      'framerate=fps=60',
    );
    expect(Framerate.summarize({ fps: '29.97' })).toBe(
      'Frame Interpolation (29.97fps)',
    );

    expect(HFlip.defaults().graph).toBe('');
    expect(HFlip.createGraph({ enabled: true })).toBe('hflip');
    expect(HFlip.summarize({})).toBe('Horizonal Flip');
    expect(VFlip.defaults().graph).toBe('');
    expect(VFlip.createGraph({ enabled: true })).toBe('vflip');
    expect(VFlip.summarize({})).toBe('Vertical Flip');

    expect(Loudnorm.defaults().graph).toBe('');
    expect(Loudnorm.createGraph({ enabled: true })).toBe('loudnorm');
    expect(Loudnorm.summarize({})).toBe('Loudness Normalization');

    expect(Resample.defaults().graph).toBe('aresample=osr=44100:ochl=stereo');
    expect(Resample.createGraph({ sampling: '48000', layout: '5.1' })).toBe(
      'aresample=osr=48000:ochl=5.1',
    );
    expect(
      Resample.createGraph({ sampling: 'inherit', layout: 'inherit' }),
    ).toBe('');
    expect(Resample.summarize({ sampling: '48000', layout: 'mono' })).toBe(
      'Resample (mono, 48000Hz)',
    );
  });
});

describe('filter editor controls', () => {
  it.each([
    {
      name: 'Horizontal Flip',
      component: HFlip.component,
      settings: {},
      graph: 'hflip',
    },
    {
      name: 'Vertical Flip',
      component: VFlip.component,
      settings: {},
      graph: 'vflip',
    },
    {
      name: 'Loudness Normalization',
      component: Loudnorm.component,
      settings: {},
      graph: 'loudnorm',
    },
    {
      name: 'Deinterlace (bwdif)',
      component: Bwdif.component,
      settings: {},
      graph: 'bwdif=mode=1:parity=-1:deint=0',
    },
    {
      name: 'Framerate conversion (frame interpolation)',
      component: Framerate.component,
      settings: {},
      graph: 'framerate=fps=30',
    },
  ])(
    'toggles $name and updates the filter graph',
    ({ name, component, settings, graph }) => {
      const onChange = vi.fn();
      render(React.createElement(component, { settings, onChange }));
      fireEvent.click(screen.getByRole('checkbox', { name }));
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: true }),
        graph,
        false,
      );
    },
  );

  it('renders the parameterized filter editors', () => {
    const onChange = vi.fn();
    render(
      React.createElement(Volume.component, {
        settings: { level: 'custom', db: -3 },
        onChange,
      }),
    );
    fireEvent.change(screen.getByLabelText('Decibels (dB)'), {
      target: { value: '-9' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      { level: 'custom', db: '-9' },
      'volume=volume=-9dB',
      false,
    );

    render(
      React.createElement(Scale.component, {
        settings: { mode: 'width', width: '640' },
        onChange,
      }),
    );
    render(
      React.createElement(Transpose.component, {
        settings: { value: '90' },
        onChange,
      }),
    );
    render(
      React.createElement(Pan.component, {
        settings: { value: 'mute_right' },
        onChange,
      }),
    );
    render(
      React.createElement(Resample.component, {
        settings: { sampling: '48000', layout: 'mono' },
        onChange,
      }),
    );
  });

  it('runs default handlers for pan and volume controls', () => {
    const pan = render(React.createElement(Pan.component));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Mute left' }));
    pan.unmount();

    render(React.createElement(Volume.component));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Custom ...' }));
    fireEvent.change(screen.getByLabelText('Decibels (dB)'), {
      target: { value: '-6' },
    });
  });

  it('runs default handlers for resample controls', () => {
    render(React.createElement(Resample.component));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: '48000 Hz' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: 'mono' }));
  });
});
