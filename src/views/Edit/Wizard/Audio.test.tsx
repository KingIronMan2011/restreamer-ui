import MenuItem from '@mui/material/MenuItem';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import Audio from './Audio';

describe('wizard audio step', () => {
  it('renders each probe warning and exercises optional audio controls', () => {
    const streamList = [
      <MenuItem key="stream-0" value={0}>
        AAC track
      </MenuItem>,
    ];
    const deviceList = [
      <MenuItem key="hw:0" value="hw:0">
        Sound card
      </MenuItem>,
    ];
    const view = render(
      <Audio
        status="error"
        source="video"
        streamList={streamList}
        deviceList={deviceList}
        address="hw:0"
      />,
    );
    expect(
      screen.getByText(
        'Failed to verify the source. Please check the address.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Silence Audio'));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: 'AAC track' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: 'Sound card' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);
    view.unmount();

    for (const [status, message] of [
      ['nostream', "The source doesn't provide any audio streams."],
      ['nocoder', "The source doesn't provide any compatible audio streams."],
    ]) {
      const warning = render(<Audio status={status} />);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(
        screen.getByText(
          /The video source doesn't provide any compatible audio stream/,
        ),
      ).toBeInTheDocument();
      warning.unmount();
    }
  });
});
