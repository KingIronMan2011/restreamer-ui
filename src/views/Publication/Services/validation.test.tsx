import React from 'react';

import { render, screen } from '../../../utils/testing';
import * as Dailymotion from './Dailymotion';
import * as Facebook from './Facebook';
import * as Owncast from './Owncast';
import * as RTMP from './RTMP';
import * as SRT from './SRT';

describe('publication validation feedback', () => {
  it('shows RTMP address validation errors beside the address field', () => {
    render(
      <RTMP.component
        validationErrors={{ address: 'Enter a valid RTMP server address.' }}
      />,
    );

    expect(
      screen.getByText('Enter a valid RTMP server address.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('shows SRT destination and passphrase validation errors', () => {
    render(
      <SRT.component
        validationErrors={{
          address: 'Enter an SRT server address.',
          'params.passphrase':
            'Use an SRT passphrase between 10 and 79 characters.',
        }}
      />,
    );

    expect(
      screen.getByText('Enter an SRT server address.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Use an SRT passphrase between 10 and 79 characters.'),
    ).toBeInTheDocument();
  });

  it('shows endpoint and key errors for hosted RTMP services', () => {
    render(
      <Owncast.component
        validationErrors={{
          server_url: 'Enter a valid RTMP server URL.',
          stream_key: 'Enter a stream key.',
        }}
      />,
    );

    expect(screen.getByText('Enter a valid RTMP server URL.')).toBeVisible();
    expect(screen.getByText('Enter a stream key.')).toBeVisible();
  });

  it('replaces substring based Dailymotion URL feedback with schema errors', () => {
    render(
      <Dailymotion.component
        validationErrors={{ server_url: 'Enter a valid RTMP(S) server URL.' }}
      />,
    );

    expect(screen.getByText('Enter a valid RTMP(S) server URL.')).toBeVisible();
  });

  it('shows the missing active destination error for Facebook', () => {
    render(
      <Facebook.component
        validationErrors={{
          rtmp_primary: 'Enable a primary or backup stream.',
        }}
      />,
    );

    expect(
      screen.getByText('Enable a primary or backup stream.'),
    ).toBeVisible();
  });
});
