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
});
