import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../utils/testing';
import Password from './Password';

describe('Password', () => {
  it('shows helper text and toggles password visibility', () => {
    const onChange = vi.fn();
    render(
      <Password
        label="Secret"
        value="abc"
        helperText="Required"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Secret');
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByText('Required')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(input).toHaveAttribute('type', 'text');
    fireEvent.change(input, { target: { value: 'new-secret' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('honors initial visibility but keeps disabled values hidden', () => {
    const view = render(<Password label="Visible" show value="text" />);
    expect(screen.getByLabelText('Visible')).toHaveAttribute('type', 'text');
    view.rerender(<Password label="Visible" show disabled value="text" />);
    expect(screen.getByLabelText('Visible')).toHaveAttribute(
      'type',
      'password',
    );
  });
});
