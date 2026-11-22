import React from 'react';
import { vi } from 'vitest';

import { fireEvent, render, screen } from '../../utils/testing';
import Dialog from './Dialog';

describe('Dialog', () => {
  it('renders modal content and invokes close and help actions', () => {
    const onClose = vi.fn();
    const onHelp = vi.fn();
    render(
      <Dialog
        open
        title="Details"
        maxWidth={720}
        onClose={onClose}
        onHelp={onHelp}
      >
        <div>Dialog content</div>
      </Dialog>,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Dialog content');
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(onClose).toHaveBeenCalledOnce();
    expect(onHelp).toHaveBeenCalledOnce();
  });

  it('hides when closed and accepts default optional actions', () => {
    render(<Dialog title="Closed" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
