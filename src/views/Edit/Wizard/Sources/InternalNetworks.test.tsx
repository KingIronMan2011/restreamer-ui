import React from 'react';
import { describe, expect, it } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import * as InternalRTMP from './InternalRTMP';
import * as InternalSRT from './InternalSRT';

describe.each([
  {
    label: 'RTMP',
    source: InternalRTMP,
    config: {
      channelid: 'channel-1',
      rtmp: {
        enabled: true,
        host: 'localhost',
        local: 'localhost',
        app: '/live',
        token: '',
      },
    },
    device: { id: 'rtmp:stream-1', name: 'RTMP stream', media: 'rtmp' },
  },
  {
    label: 'SRT',
    source: InternalSRT,
    config: {
      channelid: 'channel-1',
      srt: {
        enabled: true,
        host: 'localhost',
        local: 'localhost',
        token: '',
        passphrase: '',
      },
    },
    device: { id: 'srt:stream-1', name: 'SRT stream', media: 'srt' },
  },
])('$label wizard source', ({ source, config, device }) => {
  it('handles the disabled server route action', () => {
    render(<source.component />);
    fireEvent.click(
      screen.getByRole('button', {
        name: `Enable ${source === InternalRTMP ? 'RTMP' : 'SRT'} server ...`,
      }),
    );
  });

  it('refreshes and selects an available stream using callback defaults', () => {
    render(
      <source.component
        config={config}
        knownDevices={[device, { id: 'other', name: 'Other', media: 'video' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: device.name }));
    expect(
      screen.queryByRole('option', { name: device.name }),
    ).not.toBeInTheDocument();
  });
});
