import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../utils/testing';
import * as Rav1e from './av1_librav1e';

describe('AV1 librav1e controls', () => {
  it('updates speed, tiles, quantizer, parameters, GOP, and framerate mode', () => {
    const onChange = vi.fn();
    render(<Rav1e.component onChange={onChange} />);

    fireEvent.mouseDown(screen.getAllByRole('combobox')[2]);
    fireEvent.click(screen.getByRole('option', { name: 'auto' }));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[3]);
    fireEvent.click(
      screen.getByRole('option', { name: 'Constant frame rate (CFR)' }),
    );
    fireEvent.mouseDown(screen.getAllByRole('combobox')[4]);
    fireEvent.click(screen.getByRole('option', { name: 'fastest (10)' }));

    for (const [label, value] of [
      ['QP', '32'],
      ['Tiles', '4'],
      ['Tile Rows', '2'],
      ['Tile Columns', '3'],
      ['rav1e Parameters', 'key=value'],
    ]) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }

    const calls = onChange.mock.calls as [Record<string, string>, any][];
    expect(calls.map(([settings]) => settings)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gop: 'auto' }),
        expect.objectContaining({ fps_mode: 'cfr' }),
        expect.objectContaining({ speed: '10' }),
        expect.objectContaining({ qp: '32' }),
        expect.objectContaining({ tiles: '4' }),
        expect.objectContaining({ tile_rows: '2' }),
        expect.objectContaining({ tile_columns: '3' }),
        expect.objectContaining({ params: 'key=value' }),
      ]),
    );
    expect(
      calls.find(([settings]) => settings.gop === 'auto')![1].local,
    ).not.toContain('-g');
    expect(
      calls.find(([settings]) => settings.fps_mode === 'cfr')![1].local,
    ).toEqual(expect.arrayContaining(['-fps_mode', 'cfr']));
    expect(
      calls.find(([settings]) => settings.params === 'key=value')![1].local,
    ).toEqual(expect.arrayContaining(['-rav1e-params', 'key=value']));
  });

  it('omits fps mode for older FFmpeg versions and summarizes settings', () => {
    const mapping = Rav1e.defaults(
      {},
      { ffmpeg: { version_major: 4 } },
    ).mapping;
    expect(mapping.local).not.toContain('-fps_mode');
    expect(
      Rav1e.summarize({ bitrate: '2048', fps: '30', speed: '5', qp: '20' }),
    ).toBe('AV1 (librav1e), 2048 kbit/s, 30 FPS, Speed: 5, QP: 20');
  });
});
