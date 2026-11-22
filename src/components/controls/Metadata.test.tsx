import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../utils/testing';
import Metadata from './Metadata';

describe('Metadata control', () => {
  it('emits default values on mount and changes content fields', () => {
    const onChange = vi.fn();
    render(<Metadata onChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Livestream',
        author: { name: '', description: '' },
      }),
      true,
    );
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Show' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'Show' }),
      false,
    );
  });

  it('preserves supplied settings and edits author metadata', () => {
    const onChange = vi.fn();
    render(
      <Metadata
        settings={{ name: 'Custom', author: { name: 'Host' } }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Author' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Host');
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Presenter' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        author: { name: 'Host', description: 'Presenter' },
      }),
      false,
    );
  });

  it('supports the default change callback across author and content tabs', () => {
    render(<Metadata />);
    fireEvent.click(screen.getByRole('tab', { name: 'Author' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Host' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'About the host' },
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Content' }));
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'About the stream' },
    });
  });
});
