import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Channel from './Channel';
import * as NoAudio from './NoAudio';
import * as VideoAudio from './VideoAudio';

describe('channel and pseudo-source helpers', () => {
  it('creates channel paths and probes a selected channel', () => {
    expect(Channel.func.initSettings(null)).toEqual({ channelid: 'none' });
    expect(Channel.func.initSettings({ channelid: 'one' })).toEqual({
      channelid: 'one',
    });
    expect(Channel.func.createInputs({ channelid: 'one' })).toEqual([
      {
        address: '{fs:mem}/one.m3u8',
        options: [],
      },
    ]);

    const onChange = vi.fn();
    const onProbe = vi.fn();
    const onRefresh = vi.fn();
    render(
      <Channel.component
        settings={{ channelid: 'one' }}
        knownDevices={[{ id: 'one', name: 'Primary' }]}
        onChange={onChange}
        onProbe={onProbe}
        onRefresh={onRefresh}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onProbe).toHaveBeenCalledWith(
      { channelid: 'one' },
      Channel.func.createInputs({ channelid: 'one' }),
    );
  });

  it('initializes and creates empty inputs for no-audio and video-audio pseudo-sources', () => {
    for (const source of [NoAudio, VideoAudio]) {
      expect(source.func.initSettings(null)).toEqual({});
      expect(source.func.initSettings({ stream: 1 })).toEqual({ stream: 1 });
      expect(source.func.createInputs({})).toEqual([
        { address: '', options: [] },
      ]);
      const view = render(<source.component />);
      expect(view.container).toBeEmptyDOMElement();
    }
  });
});
