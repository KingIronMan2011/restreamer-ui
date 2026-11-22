import React from 'react';

import { fireEvent, render, screen } from '../../../utils/testing';
import Error from './Error';
import Probe from './Probe';

describe('wizard passive steps', () => {
  it('keeps default probe abort action safe to invoke', () => {
    render(<Probe />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(
      screen.getByText(/please wait\. probe stream data/i),
    ).toBeInTheDocument();
  });

  it('keeps all default error actions safe to invoke', () => {
    render(<Error />);
    for (const button of screen.getAllByRole('button')) {
      fireEvent.click(button);
    }
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
