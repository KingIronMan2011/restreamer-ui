import React from 'react';

import { fireEvent, render, screen } from '../utils/testing';
import MultiSelect from './MultiSelect';

describe('MultiSelect', () => {
  it('fills missing item labels and keys and invokes its default change handler', () => {
    const items = [
      { value: 'one', selected: true },
      { key: 'two-key', value: 'two', name: 'Second' },
    ];
    render(<MultiSelect label="Streams" value={['one']} items={items} />);

    expect(screen.getByRole('combobox')).toHaveTextContent('one');
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'one' }));
    expect(items).toEqual([
      { key: 'one', value: 'one', name: 'one', selected: true },
      { key: 'two-key', value: 'two', name: 'Second' },
    ]);
  });
});
