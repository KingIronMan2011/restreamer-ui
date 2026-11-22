import React from 'react';

import { fireEvent, render, screen } from '../utils/testing';
import TextField from './TextField';

describe('TextField', () => {
  it('renders configured input props and forwards changes', () => {
    const onChange = vi.fn();
    render(
      <TextField
        id="stream-name"
        label="Stream name"
        value="demo"
        onChange={onChange}
        min={1}
        max={12}
        helperText="Required"
        error
      />,
    );

    const input = screen.getByLabelText('Stream name');
    expect(input).toHaveValue('demo');
    expect(input).toHaveAttribute('min', '1');
    expect(input).toHaveAttribute('max', '12');
    expect(screen.getByText('Required')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'new name' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('renders optional env adornment and generated id without optional helper text', () => {
    render(<TextField label="Token" env multiline rows={3} disabled />);
    expect(screen.getByLabelText('Token')).toBeDisabled();
    expect(document.querySelector('input, textarea')).toHaveAttribute('id');

    render(<TextField label="Default handler" />);
    fireEvent.change(screen.getByLabelText('Default handler'), {
      target: { value: 'ignored safely' },
    });
  });
});
