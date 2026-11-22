import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../utils/testing';
import * as Dailymotion from './Dailymotion';
import * as Facebook from './Facebook';
import * as Owncast from './Owncast';
import * as RTMP from './RTMP';
import * as SRT from './SRT';

describe('publication service behavior', () => {
  it('renders the Dailymotion icon and builds output when fields change', () => {
    const onChange = vi.fn();
    const view = render(
      <>
        <Dailymotion.icon />
        <Dailymotion.component onChange={onChange} />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Stream URL'), {
      target: { value: 'rtmps://stream.example/live' },
    });
    fireEvent.change(screen.getByLabelText('Stream key'), {
      target: { value: 'secret-key' },
    });

    expect(screen.getByAltText('Dailymotion Logo')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      [
        {
          address: 'rtmps://stream.example/live',
          options: ['-rtmp_playpath', 'secret-key', '-f', 'flv'],
        },
      ],
      expect.objectContaining({ stream_key: 'secret-key' }),
    );

    view.rerender(<Dailymotion.component />);
    fireEvent.change(screen.getByLabelText('Stream URL'), {
      target: { value: 'rtmp://default-callback.example/live' },
    });
  });

  it('renders the Owncast icon and composes its address from the fields', () => {
    const onChange = vi.fn();
    const view = render(
      <>
        <Owncast.icon />
        <Owncast.component onChange={onChange} />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Server URL'), {
      target: { value: 'owncast.example/live' },
    });
    fireEvent.change(screen.getByLabelText('Stream key'), {
      target: { value: 'secret-key' },
    });

    expect(screen.getByAltText('Owncast Logo')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      [
        {
          address: 'rtmp://owncast.example/live/secret-key',
          options: ['-f', 'flv'],
        },
      ],
      expect.objectContaining({ stream_key: 'secret-key' }),
    );

    view.rerender(<Owncast.component />);
    fireEvent.change(screen.getByLabelText('Server URL'), {
      target: { value: 'default-callback.example/live' },
    });
  });

  it('builds primary and backup Facebook outputs and omits disabled streams', () => {
    const onChange = vi.fn();
    const view = render(
      <>
        <Facebook.icon />
        <Facebook.component
          settings={{
            stream_key_primary: 'primary-key',
            stream_key_backup: 'backup-key',
            rtmp_primary: true,
            rtmp_backup: true,
          }}
          onChange={onChange}
        />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Primary stream key'), {
      target: { value: 'updated-primary-key' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      [
        {
          address:
            'rtmps://live-api-s.facebook.com:443/rtmp/updated-primary-key',
          options: ['-f', 'flv'],
        },
        {
          address: 'rtmps://live-api-s.facebook.com:443/rtmp/backup-key',
          options: ['-f', 'flv'],
        },
      ],
      expect.objectContaining({ stream_key_primary: 'updated-primary-key' }),
    );

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Enable primary stream' }),
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Enable backup stream' }),
    );
    expect(onChange).toHaveBeenLastCalledWith([], expect.any(Object));

    view.rerender(<Facebook.component />);
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Enable primary stream' }),
    );
  });

  it('handles RTMP protocol parsing, codecs, advanced options, and RTMPT flush interval', () => {
    const onChange = vi.fn();
    const skills = {
      ffmpeg: { version_major: 6 },
      protocols: ['rtmps', 'rtmpt'],
      codecs: { video: ['hevc', 'av1', 'vp9'] },
    };
    const view = render(
      <>
        <RTMP.icon />
        <RTMP.component
          skills={skills}
          settings={{
            protocol: 'rtmpt://',
            address: 'publish.example/live',
            options: {
              rtmp_app: 'live',
              rtmp_playpath: '',
              rtmp_pageurl: '',
              rtmp_tcurl: '',
              rtmp_conn: '',
              rtmp_flashver: 'FMLE/3.0',
              rtmp_flush_interval: '15',
              rtmp_swfhash: '',
              rtmp_swfsize: '',
            },
          }}
          onChange={onChange}
        />
      </>,
    );

    fireEvent.click(screen.getByText('Advanced settings'));
    fireEvent.change(screen.getByLabelText('rtmp_app'), {
      target: { value: 'rtmpt-app' },
    });
    fireEvent.change(screen.getByLabelText('rtmp_flush_interval'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'rtmps://stream.example/live' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      [
        expect.objectContaining({
          address: 'rtmps://stream.example/live',
          options: expect.arrayContaining([
            '-rtmp_enhanced_codecs',
            'hvc1,av01,vp09',
          ]),
        }),
      ],
      expect.objectContaining({ protocol: 'rtmps://' }),
    );

    fireEvent.change(screen.getByLabelText('rtmp_app'), {
      target: { value: 'updated-app' },
    });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'rtmps://' }));
    view.rerender(
      <RTMP.component
        skills={skills}
        settings={{
          protocol: 'rtmps://',
          address: 'initial.example/live',
          options: { rtmp_app: '' },
        }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'plain.example/live' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      [expect.objectContaining({ address: 'rtmps://plain.example/live' })],
      expect.any(Object),
    );

    view.rerender(
      <RTMP.component
        skills={{
          ffmpeg: { version_major: 6 },
          protocols: [],
          codecs: { video: [] },
        }}
        settings={{ protocol: 'rtmp://', address: '', options: {} }}
      />,
    );
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'rtmps://unsupported.example/live' },
    });
    view.rerender(
      <RTMP.component
        skills={{
          ffmpeg: { version_major: 5 },
          protocols: [],
          codecs: { video: [] },
        }}
        settings={{
          protocol: 'rtmp://',
          address: '',
          options: { rtmp_app: '' },
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'publish.example/live' },
    });
  });

  it('serializes changed SRT options and booleans and uses default callbacks', () => {
    const onChange = vi.fn();
    const settings = {
      protocol: 'srt://',
      address: 'publish.example:9000',
      params: {
        latency: '150000',
        streamid: '',
        enforced_encryption: true,
        nakreport: false,
      },
    };
    const view = render(
      <>
        <SRT.icon />
        <SRT.component settings={settings} onChange={onChange} />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'target.example:9001' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      [
        expect.objectContaining({
          address: expect.stringContaining(
            'srt://target.example:9001?latency=150000',
          ),
        }),
      ],
      expect.objectContaining({ address: 'target.example:9001' }),
    );

    fireEvent.click(screen.getByText('Advanced settings'));
    fireEvent.change(screen.getByLabelText('latency'), {
      target: { value: '160000' },
    });
    fireEvent.click(screen.getByLabelText('enforced_encryption'));

    view.rerender(<SRT.component settings={settings} />);
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: 'target.example:9002' },
    });
  });
});
