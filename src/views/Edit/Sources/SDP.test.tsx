import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
} from '../../../utils/testing';
import * as SDP from './SDP';

describe('SDP source', () => {
  it('initializes settings and creates an RTP-whitelisted input', () => {
    expect(SDP.func.initSettings(null)).toEqual({ address: '', mimetype: '' });
    expect(SDP.func.initSettings({ address: '/file.sdp' })).toMatchObject({
      address: '/file.sdp',
    });
    expect(SDP.func.createInputs({ address: '/file.sdp' })).toEqual([
      {
        address: '{diskfs}/file.sdp',
        options: [
          '-protocol_whitelist',
          'file,udp,rtp',
          '-buffer_size',
          '671088640',
          '-thread_queue_size',
          '4096',
        ],
      },
    ]);
  });

  it('uploads SDP files and probes using the stored path', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onProbe = vi.fn();
    const onStore = vi.fn().mockResolvedValue('/uploads/input.sdp');
    const view = render(
      <SDP.component onChange={onChange} onProbe={onProbe} onStore={onStore} />,
    );
    const file = new File(['v=0'], 'input.sdp', { type: 'application/sdp' });

    await user.upload(screen.getByLabelText('Upload'), file);
    expect(onStore).toHaveBeenCalledWith('input.sdp', file);
    expect(onChange).toHaveBeenCalledWith({
      address: '/uploads/input.sdp',
      mimetype: 'application/sdp',
    });

    view.rerender(
      <SDP.component
        settings={{
          address: '/uploads/input.sdp',
          mimetype: 'application/sdp',
        }}
        onProbe={onProbe}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Probe' }));
    expect(onProbe).toHaveBeenCalledWith(
      { address: '/uploads/input.sdp', mimetype: 'application/sdp' },
      SDP.func.createInputs({ address: '/uploads/input.sdp' }),
    );
  });

  it('uses default handlers when an SDP file is uploaded', async () => {
    const user = userEvent.setup();
    render(<SDP.component />);
    await user.upload(
      screen.getByLabelText('Upload'),
      new File(['v=0'], 'input.sdp', { type: 'application/sdp' }),
    );
    expect(screen.getByLabelText('File path')).toHaveValue('');
  });

  it.each([
    [
      new File(['bad'], 'bad.txt', { type: 'text/plain' }),
      'The selected file type',
    ],
    [
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.sdp', {
        type: 'application/sdp',
      }),
      'The selected file is too big',
    ],
  ])('shows a closable dialog for an invalid upload', async (file, message) => {
    const user = userEvent.setup();
    render(<SDP.component />);
    fireEvent.change(screen.getByLabelText('Upload'), {
      target: { files: [file] },
    });
    expect(
      await screen.findByText('Uploading the file failed'),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(message))).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'OK' }));
    await waitForElementToBeRemoved(dialog);
  });
});
