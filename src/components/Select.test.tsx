import MenuItem from '@mui/material/MenuItem';
import React from 'react';

import { fireEvent, render, screen } from '../utils/testing';
import Select from './Select';

describe('Select', () => {
  it('renders options and invokes the default change handler', () => {
    render(
      <Select label="Quality" value="low">
        <MenuItem value="low">Low</MenuItem>
        <MenuItem value="high">High</MenuItem>
      </Select>,
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'High' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Low');
  });
});
