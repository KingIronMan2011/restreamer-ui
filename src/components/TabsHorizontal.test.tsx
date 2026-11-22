import Tab from '@mui/material/Tab';
import React from 'react';

import { fireEvent, render, screen } from '../utils/testing';
import TabsHorizontal from './TabsHorizontal';

describe('TabsHorizontal', () => {
  it('renders tabs and invokes the default change handler', () => {
    render(
      <TabsHorizontal value={0}>
        <Tab label="First" value={0} />
        <Tab label="Second" value={1} />
      </TabsHorizontal>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
    expect(screen.getByRole('tab', { name: 'First' })).toBeInTheDocument();
  });
});
