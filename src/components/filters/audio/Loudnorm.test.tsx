import React from 'react';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Loudnorm from './Loudnorm';

describe('loudness normalization filter', () => {
  it('creates the graph and handles default change callbacks', () => {
    expect(Loudnorm.createGraph({ enabled: true })).toBe('loudnorm');
    render(<Loudnorm.component />);
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Loudness Normalization' }),
    );
  });
});
