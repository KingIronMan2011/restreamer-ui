import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../utils/testing';
import ModalContent from './ModalContent';

describe('ModalContent', () => {
  it('renders title and body and invokes help and close handlers', () => {
    const onHelp = vi.fn();
    const onClose = vi.fn();
    render(
      <ModalContent title="Details" onHelp={onHelp} onClose={onClose}>
        <p>Modal body</p>
      </ModalContent>,
    );

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onHelp).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders without optional icon handlers and forwards style props', () => {
    const view = render(
      <ModalContent
        title="Plain"
        className="custom"
        style={{ color: 'red' }}
      />,
    );
    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(view.container.firstChild).toHaveClass('custom');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
