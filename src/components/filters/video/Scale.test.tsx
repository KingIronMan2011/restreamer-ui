import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Scale from './Scale';

describe('scale filter', () => {
  it('creates each supported scale graph and summary', () => {
    expect(Scale.createGraph({ mode: 'none' })).toBe('');
    expect(Scale.createGraph({ mode: 'fix', fix: '1920x1080' })).toBe(
      'scale=1920x1080',
    );
    expect(Scale.createGraph({ mode: 'width', width: '1280' })).toBe(
      'scale=1280:-1',
    );
    expect(Scale.createGraph({ mode: 'height', height: '720' })).toBe(
      'scale=-1:720',
    );
    expect(Scale.defaults().graph).toBe('');
    expect(Scale.summarize({ mode: 'height', height: '720' })).toBe(
      'Scale (-1:720)',
    );
    expect(Scale.summarize({ mode: 'width', width: '1280' })).toBe(
      'Scale (1280:-1)',
    );
    expect(Scale.summarize({ mode: 'fix', fix: '1920x1080' })).toBe(
      'Scale (1920x1080)',
    );
    expect(Scale.summarize({ mode: 'none' })).toBeUndefined();
  });

  it('shows the size control for the selected mode and reports changes', () => {
    const onChange = vi.fn();
    const modes = [
      { value: 'fix', label: 'Fix size', size: '1920x1080' },
      { value: 'width', label: 'By width', size: '1920' },
      { value: 'height', label: 'By height', size: '1080' },
    ];

    for (const mode of modes) {
      const view = render(
        <Scale.component
          settings={{
            mode: mode.value,
            fix: '1280x720',
            width: '1280',
            height: '720',
          }}
          onChange={onChange}
        />,
      );
      expect(screen.getAllByRole('combobox')).toHaveLength(2);
      fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
      if (mode.value === 'fix') {
        fireEvent.click(
          screen.getByRole('option', { name: '1920x1080 (Full HD)' }),
        );
      } else {
        fireEvent.click(screen.getByRole('option', { name: mode.size }));
      }
      expect(onChange).toHaveBeenCalled();
      view.unmount();
    }

    render(<Scale.component settings={{ mode: 'none' }} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'By width' }));
    expect(screen.queryByLabelText('Scale size')).not.toBeInTheDocument();
  });

  it('accepts the default change callback', () => {
    render(<Scale.component />);
  });
});
