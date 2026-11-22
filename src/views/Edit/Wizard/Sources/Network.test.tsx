import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import * as Network from './Network';

describe('wizard network source', () => {
  it('updates RTSP credentials and toggles UDP transport', () => {
    const onChange = vi.fn();
    render(
      <Network.component
        settings={{
          address: 'rtsp://camera.example/live',
          rtsp: { udp: false },
        }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'UDP transport' }));
    expect(onChange).toHaveBeenLastCalledWith(
      Network.id,
      expect.objectContaining({ rtsp: expect.objectContaining({ udp: true }) }),
      expect.any(Array),
      true,
    );

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'camera-user' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'camera-password' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      Network.id,
      expect.objectContaining({
        username: 'camera-user',
        password: 'camera-password',
      }),
      expect.any(Array),
      true,
    );
  });

  it('uses defaults for optional callbacks and disables credentials for SRT', () => {
    render(
      <Network.component settings={{ address: 'srt://stream.example' }} />,
    );

    expect(screen.getByLabelText('Username')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(
      screen.queryByRole('checkbox', { name: 'UDP transport' }),
    ).toBeNull();
  });
});
