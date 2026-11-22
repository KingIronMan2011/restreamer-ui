import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import Abort from './Abort';

describe('wizard abort screen', () => {
  it('explains the final channel cannot be removed and goes back', async () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    render(<Abort nchannels={1} onBack={onBack} onNext={onNext} />);

    expect(
      screen.getByText(/at least one input must be defined/i),
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('offers abort and return actions when multiple channels exist', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onNext = vi.fn();
    render(<Abort nchannels={2} onBack={onBack} onNext={onNext} />);

    await user.click(screen.getByRole('button', { name: 'Yes' }));
    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(onNext).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('forwards the help action', async () => {
    const user = userEvent.setup();
    const onHelp = vi.fn();
    render(<Abort nchannels={0} onHelp={onHelp} />);
    await user.click(screen.getAllByRole('button')[0]);
    expect(onHelp).toHaveBeenCalledOnce();
  });

  it('keeps all default actions safe to invoke', () => {
    render(<Abort nchannels={1} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.click(screen.getAllByRole('button')[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  });
});
