import React from 'react';

import { fireEvent, render, screen } from '../utils/testing';
import Checkbox from './Checkbox';

describe('Checkbox', () => {
  it('toggles with the default change handler and supports disabled state', () => {
    render(<Checkbox label="Enabled" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Enabled' }));

    render(<Checkbox label="Disabled" disabled checked />);
    expect(screen.getByRole('checkbox', { name: 'Disabled' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Disabled' })).toBeChecked();
  });
});
