import MenuItem from '@mui/material/MenuItem';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import VideoProfile from './VideoProfile';

const streamList = [
  <MenuItem key="stream-0" value={0}>
    1920x1080, H264
  </MenuItem>,
  <MenuItem key="stream-1" value={1}>
    1280x720, H264
  </MenuItem>,
];

describe('wizard video profile step', () => {
  it('updates stream, decoder, encoder, and navigation callbacks', () => {
    const onStreamChange = vi.fn();
    const onDecoderChange = vi.fn();
    const onEncoderChange = vi.fn();
    const onBack = vi.fn();
    const onNext = vi.fn();
    const onAbort = vi.fn();
    const onHelp = vi.fn();
    render(
      <VideoProfile
        compatible={false}
        streamList={streamList}
        decodersList={[
          <MenuItem key="d1" value="d1">
            Decoder 1
          </MenuItem>,
          <MenuItem key="d2" value="d2">
            Decoder 2
          </MenuItem>,
        ]}
        encodersList={<MenuItem value="encoder">Encoder</MenuItem>}
        onStreamChange={onStreamChange}
        onDecoderChange={onDecoderChange}
        onEncoderChange={onEncoderChange}
        onBack={onBack}
        onNext={onNext}
        onAbort={onAbort}
        onHelp={onHelp}
      />,
    );

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: '1280x720, H264' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: 'Decoder 2' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'Encoder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(onStreamChange).toHaveBeenCalled();
    expect(onDecoderChange).toHaveBeenCalled();
    expect(onEncoderChange).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
    expect(onAbort).toHaveBeenCalledOnce();
    expect(onHelp).toHaveBeenCalledOnce();
  });

  it('disables next when an incompatible stream has no available encoder', () => {
    render(<VideoProfile compatible={false} streamList={streamList} />);
    expect(
      screen.getByText(/there's no suitable encoder available/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: '1280x720, H264' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);
  });

  it('invokes the default next callback for a compatible stream', () => {
    render(<VideoProfile compatible streamList={streamList} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  });

  it('allows selecting default decoder and encoder options', () => {
    render(
      <VideoProfile
        compatible={false}
        streamList={streamList}
        decodersList={[
          <MenuItem key="decoder-1" value="decoder-1">
            Decoder 1
          </MenuItem>,
          <MenuItem key="decoder-2" value="decoder-2">
            Decoder 2
          </MenuItem>,
        ]}
        encodersList={<MenuItem value="encoder">Encoder</MenuItem>}
      />,
    );
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(screen.getByRole('option', { name: '1280x720, H264' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(screen.getByRole('option', { name: 'Decoder 2' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'Encoder' }));
  });
});
