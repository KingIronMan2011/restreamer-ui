import { describe, expect, it } from 'vitest';

import {
  networkSourceSettingsSchema,
  rtmpPublicationSettingsSchema,
  srtPublicationSettingsSchema,
  validatePublicationSettings,
} from './validation';

describe('network source validation', () => {
  it('requires a valid URL for pull mode but not receive mode', () => {
    expect(
      networkSourceSettingsSchema.safeParse({ mode: 'pull', address: '' })
        .success,
    ).toBe(false);
    expect(
      networkSourceSettingsSchema.safeParse({
        mode: 'pull',
        address: 'camera.example/live',
      }).success,
    ).toBe(false);
    expect(
      networkSourceSettingsSchema.safeParse({
        mode: 'pull',
        address: 'rtsp://camera.example/live',
      }).success,
    ).toBe(true);
    expect(
      networkSourceSettingsSchema.safeParse({
        mode: 'pull',
        address: 'rtsp://user:password@camera.example/live',
      }).success,
    ).toBe(true);
    expect(
      networkSourceSettingsSchema.safeParse({ mode: 'push', address: '' })
        .success,
    ).toBe(true);
  });
});

describe('publication settings validation', () => {
  it('requires a valid RTMP destination address', () => {
    const options = { rtmp_playpath: '', rtmp_app: '/live' };
    expect(
      rtmpPublicationSettingsSchema.safeParse({
        protocol: 'rtmps://',
        address: 'publish.example/app/key',
        options,
      }).success,
    ).toBe(true);
    expect(
      rtmpPublicationSettingsSchema.safeParse({
        protocol: 'rtmp://',
        address: '',
        options,
      }).success,
    ).toBe(false);
    expect(
      rtmpPublicationSettingsSchema.safeParse({
        protocol: 'rtmp://',
        address: 'not a host',
        options,
      }).success,
    ).toBe(false);
  });

  it('validates SRT destination and encryption passphrase together', () => {
    const base = {
      protocol: 'srt://',
      address: 'publish.example:9000',
      params: { passphrase: '', enforced_encryption: false },
    };
    expect(srtPublicationSettingsSchema.safeParse(base).success).toBe(true);
    expect(
      srtPublicationSettingsSchema.safeParse({
        ...base,
        params: { passphrase: 'short', enforced_encryption: false },
      }).success,
    ).toBe(false);
    expect(
      srtPublicationSettingsSchema.safeParse({
        ...base,
        params: { passphrase: '', enforced_encryption: true },
      }).success,
    ).toBe(false);
    expect(
      srtPublicationSettingsSchema.safeParse({
        ...base,
        params: {
          passphrase: 'a secure passphrase',
          enforced_encryption: true,
        },
      }).success,
    ).toBe(true);
    expect(validatePublicationSettings('unknown-service', {})).toEqual({
      success: true,
    });
  });

  it('validates endpoint and stream key requirements for additional services', () => {
    const cases = [
      ['azure', { protocol: 'rtmps://', address: 'stream.example/live/key' }],
      [
        'owncast',
        {
          protocol: 'rtmp://',
          server_url: 'owncast.example/live',
          stream_key: 'secret',
        },
      ],
      [
        'cdn77',
        {
          protocol: 'rtmp://',
          stream_url: 'live.example/app/',
          stream_key: 'secret',
        },
      ],
      ['kick', { server_url: 'rtmps://stream.example/app', stream_key: 'key' }],
      [
        'tiktok',
        { server_url: 'rtmps://stream.example/app', stream_key: 'key' },
      ],
      [
        'rumble',
        { server_url: 'rtmp://stream.example/app', stream_key: 'key' },
      ],
      [
        'telegram',
        {
          protocol: 'rtmps://',
          stream_url: 'stream.example/app/',
          stream_key: 'key',
        },
      ],
      ['hls', { protocol: 'https://', address: 'stream.example/live.m3u8' }],
      ['dash', { protocol: 'https://', address: 'stream.example/live.mpd' }],
      [
        'icecast',
        {
          protocol: 'icecast://',
          address: 'user:password@stream.example:8000/live',
        },
      ],
      ['rtsp', { protocol: 'rtsp://', address: 'stream.example:8554/live' }],
      ['udp', { protocol: 'udp://', address: '239.0.0.1:1234' }],
      ['mpegts', { protocol: 'udp://', address: '239.0.0.1:1234' }],
      [
        'dacast',
        {
          protocol: 'rtmps://',
          server: 'primary.example/app',
          backup_server: '',
          enable_backup_server: false,
          stream_key: 'key',
          username: '',
          password: '',
        },
      ],
      ['red5', { protocol: 'rtmp://', address: 'stream.example:1935' }],
      ['wowza', { protocol: 'rtsp://', address: 'stream.example:554' }],
      [
        'akamai',
        {
          protocol: 'rtmp://',
          stream_url: 'edge.example/entry',
          backup_url: '',
          enable_backup_stream: false,
        },
      ],
    ] as const;

    for (const [serviceId, settings] of cases) {
      expect(validatePublicationSettings(serviceId, settings).success).toBe(
        true,
      );
      expect(
        validatePublicationSettings(serviceId, {
          ...settings,
          stream_key: '',
          address: '',
          server_url: '',
          stream_url: '',
        }).success,
      ).toBe(false);
    }
  });

  it('requires credentials that are used to build platform output addresses', () => {
    expect(
      validatePublicationSettings('instagram', { key: 'instagram-key' })
        .success,
    ).toBe(true);
    expect(validatePublicationSettings('instagram', { key: ' ' }).success).toBe(
      false,
    );
    expect(
      validatePublicationSettings('livespotting', {
        vpu_id: 'vpu',
        livesource_id: 'source',
        rtmp_token: 'secret',
      }).success,
    ).toBe(true);
    expect(
      validatePublicationSettings('livespotting', {
        vpu_id: 'vpu',
        livesource_id: '',
        rtmp_token: 'secret',
      }).success,
    ).toBe(false);
    expect(
      validatePublicationSettings('facebook', {
        rtmp_primary: true,
        rtmp_backup: false,
        stream_key_primary: '',
        stream_key_backup: '',
      }).success,
    ).toBe(false);
    expect(
      validatePublicationSettings('youtube', {
        stream_key: 'secret',
        primary: true,
        backup: false,
        mode: 'rtmps',
      }).success,
    ).toBe(true);
  });
});
