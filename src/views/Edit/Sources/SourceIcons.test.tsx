import React from 'react';

import { render, screen } from '../../../utils/testing';
import * as AVFoundation from './AVFoundation';
import * as NoAudio from './NoAudio';
import * as VideoAudio from './VideoAudio';

describe('source icons', () => {
  it.each([
    ['AVFoundation', AVFoundation.icon],
    ['No audio', NoAudio.icon],
    ['Video source audio', VideoAudio.icon],
  ])('renders the %s icon with passed attributes', (_label, Icon) => {
    render(<Icon data-testid="source-icon" />);
    expect(screen.getByTestId('source-icon')).toBeInTheDocument();
  });
});
