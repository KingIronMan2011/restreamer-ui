import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../utils/testing';
import SelectCustom from './SelectCustom';

const options = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'custom', label: 'Custom ...' },
  { value: 'disabled', label: 'Unavailable', disabled: true },
];

describe('SelectCustom', () => {
  it('updates a regular choice and switches to a custom value', () => {
    const onChange = vi.fn();
    render(
      <SelectCustom
        label="Device"
        customLabel="Custom device"
        value="one"
        options={options}
        allowCustom
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Two' }));
    expect(onChange).toHaveBeenLastCalledWith({ target: { value: 'two' } });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Custom ...' }));
    expect(screen.getByLabelText('Custom device')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ target: { value: 'two' } });
    fireEvent.change(screen.getByLabelText('Custom device'), {
      target: { value: 'custom-id' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: 'custom-id' }),
      }),
    );
  });

  it('supports an initially custom value and a non-custom select', () => {
    const onChange = vi.fn();
    const view = render(
      <SelectCustom
        label="Device"
        customLabel="Custom device"
        value="initial-custom"
        options={options}
        allowCustom
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText('Custom device')).toHaveValue(
      'initial-custom',
    );
    view.rerender(
      <SelectCustom
        label="Device"
        value="one"
        options={options}
        onChange={onChange}
      />,
    );
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Two' }));
    expect(onChange).toHaveBeenLastCalledWith({ target: { value: 'two' } });
  });

  it('uses the label as its custom field label and safely defaults onChange', () => {
    render(
      <SelectCustom
        label="Address"
        value="custom-address"
        options={options}
        allowCustom
      />,
    );
    const fields = screen.getAllByLabelText('Address');
    expect(fields[0]).toHaveValue('custom-address');
    fireEvent.change(fields[0], {
      target: { value: 'rtmp://localhost/live' },
    });
  });
});
