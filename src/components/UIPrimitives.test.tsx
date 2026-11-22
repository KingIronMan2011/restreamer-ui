import React from 'react';
import { vi } from 'vitest';

import { fireEvent, render, screen } from '../utils/testing';
import BoxText from './BoxText';
import PaperHeader from './PaperHeader';

describe('BoxText and PaperHeader', () => {
  it.each(['light', 'dark', 'success', 'danger'])(
    'renders the %s message treatment',
    (color) => {
      render(<BoxText color={color}>Status message</BoxText>);
      expect(screen.getByText('Status message')).toBeInTheDocument();
    },
  );

  it('renders and invokes every optional header action', () => {
    const actions = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    render(
      <PaperHeader
        title="Settings"
        onAbort={actions[0]}
        onEdit={actions[1]}
        onAdd={actions[2]}
        onHelp={actions[3]}
      />,
    );
    for (const button of screen.getAllByRole('button')) fireEvent.click(button);
    for (const action of actions) expect(action).toHaveBeenCalledOnce();
  });

  it('omits header actions when no handlers are supplied', () => {
    render(<PaperHeader title="Read only" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
