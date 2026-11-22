import { z } from 'zod';

const validAddress = (value: string, protocols?: string[]) => {
  try {
    const address = new URL(value);
    return (
      address.protocol.length > 1 &&
      address.hostname.length > 0 &&
      (!protocols || protocols.includes(address.protocol))
    );
  } catch {
    return false;
  }
};

export const networkSourceSettingsSchema = z
  .object({
    mode: z.enum(['pull', 'push']),
    address: z.string(),
  })
  .superRefine(({ mode, address }, context) => {
    if (mode !== 'pull') {
      return;
    }

    if (!address.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter a network source address.',
      });
      return;
    }

    if (!validAddress(address.trim())) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter a valid URL with a protocol and host.',
      });
    }
  });

export const rtmpPublicationSettingsSchema = z
  .object({
    protocol: z.enum([
      'rtmp://',
      'rtmpe://',
      'rtmps://',
      'rtmpt://',
      'rtmpte://',
      'rtmpts://',
    ]),
    address: z.string(),
    options: z.object({ rtmp_playpath: z.string() }).passthrough(),
  })
  .superRefine(({ protocol, address }, context) => {
    if (!address.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter an RTMP server address.',
      });
      return;
    }

    if (!validAddress(`${protocol}${address.trim()}`)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter a valid RTMP server address.',
      });
    }
  });

export const srtPublicationSettingsSchema = z
  .object({
    protocol: z.literal('srt://'),
    address: z.string(),
    params: z
      .object({
        passphrase: z.string(),
        enforced_encryption: z.boolean(),
      })
      .passthrough(),
  })
  .superRefine(({ protocol, address, params }, context) => {
    if (!address.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter an SRT server address.',
      });
    } else if (!validAddress(`${protocol}${address.trim()}`)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter a valid SRT server address.',
      });
    }

    const passphrase = params.passphrase.trim();
    if (passphrase && (passphrase.length < 10 || passphrase.length > 79)) {
      context.addIssue({
        code: 'custom',
        path: ['params', 'passphrase'],
        message: 'Use an SRT passphrase between 10 and 79 characters.',
      });
    }

    if (params.enforced_encryption && !passphrase) {
      context.addIssue({
        code: 'custom',
        path: ['params', 'passphrase'],
        message: 'Enter a passphrase to enforce SRT encryption.',
      });
    }
  });

const rtmpProtocols = [
  'rtmp://',
  'rtmpe://',
  'rtmps://',
  'rtmpt://',
  'rtmpte://',
  'rtmpts://',
] as const;

const protocolAddressSettingsSchema = (
  protocols: readonly [string, ...string[]],
  message: string,
) =>
  z
    .object({ protocol: z.enum(protocols), address: z.string() })
    .passthrough()
    .superRefine(({ protocol, address }, context) => {
      if (!address.trim() || !validAddress(`${protocol}${address.trim()}`)) {
        context.addIssue({
          code: 'custom',
          path: ['address'],
          message,
        });
      }
    });

const requiredSettingsSchema = (...fields: string[]) =>
  z
    .object({})
    .passthrough()
    .superRefine((settings, context) => {
      const values = settings as Record<string, unknown>;
      for (const field of fields) {
        const value = values[field];
        if (typeof value !== 'string' || !value.trim()) {
          context.addIssue({
            code: 'custom',
            path: [field],
            message: 'This field is required.',
          });
        }
      }
    });

const facebookSettingsSchema = z
  .object({
    rtmp_primary: z.boolean(),
    rtmp_backup: z.boolean(),
    stream_key_primary: z.string(),
    stream_key_backup: z.string(),
  })
  .passthrough()
  .superRefine(
    (
      { rtmp_primary, rtmp_backup, stream_key_primary, stream_key_backup },
      context,
    ) => {
      if (!rtmp_primary && !rtmp_backup) {
        context.addIssue({
          code: 'custom',
          path: ['rtmp_primary'],
          message: 'Enable a primary or backup stream.',
        });
      }
      if (rtmp_primary && !stream_key_primary.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['stream_key_primary'],
          message: 'Enter the primary stream key.',
        });
      }
      if (rtmp_backup && !stream_key_backup.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['stream_key_backup'],
          message: 'Enter the backup stream key.',
        });
      }
    },
  );

const youtubeSettingsSchema = z
  .object({
    stream_key: z.string(),
    primary: z.boolean(),
    backup: z.boolean(),
  })
  .passthrough()
  .superRefine(({ stream_key, primary, backup }, context) => {
    if (!primary && !backup) {
      context.addIssue({
        code: 'custom',
        path: ['primary'],
        message: 'Enable a primary or backup stream.',
      });
    }
    if ((primary || backup) && !stream_key.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['stream_key'],
        message: 'Enter a stream key.',
      });
    }
  });

const dummySettingsSchema = z
  .object({
    stream_key: z.string(),
    rtmp_primary: z.boolean(),
    rtmp_backup: z.boolean(),
  })
  .passthrough()
  .superRefine(({ stream_key, rtmp_primary, rtmp_backup }, context) => {
    if (!rtmp_primary && !rtmp_backup) {
      context.addIssue({
        code: 'custom',
        path: ['rtmp_primary'],
        message: 'Enable a primary or backup stream.',
      });
    }
    if ((rtmp_primary || rtmp_backup) && !stream_key.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['stream_key'],
        message: 'Enter a stream key.',
      });
    }
  });

const earthcamSettingsSchema = z
  .object({ server_url: z.string(), stream_key: z.string() })
  .passthrough()
  .superRefine(({ server_url, stream_key }, context) => {
    if (!validAddress(server_url.trim(), ['rtmp:', 'rtmps:'])) {
      context.addIssue({
        code: 'custom',
        path: ['server_url'],
        message: 'Enter a valid RTMP(S) server URL.',
      });
    }
    if (!stream_key.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['stream_key'],
        message: 'Enter a stream key.',
      });
    }
  });

const coreSettingsSchema = z
  .object({ v2_address: z.string() })
  .passthrough()
  .superRefine(({ v2_address }, context) => {
    if (!validAddress(v2_address.trim(), ['rtmp:', 'rtmps:', 'srt:'])) {
      context.addIssue({
        code: 'custom',
        path: ['v2_address'],
        message: 'Enter a valid RTMP(S) or SRT target address.',
      });
    }
  });

const wettercomSettingsSchema = z
  .object({
    protocol: z.literal('rtmp://'),
    server_url: z.string(),
    stream_id: z.string(),
    stream_key: z.string(),
  })
  .passthrough()
  .superRefine(({ protocol, server_url, stream_id, stream_key }, context) => {
    if (!validAddress(`${protocol}${server_url.trim()}`)) {
      context.addIssue({
        code: 'custom',
        path: ['server_url'],
        message: 'Enter a valid RTMP server URL.',
      });
    }
    for (const [field, value] of [
      ['stream_id', stream_id],
      ['stream_key', stream_key],
    ] as const) {
      if (!value.trim()) {
        context.addIssue({
          code: 'custom',
          path: [field],
          message: 'This field is required.',
        });
      }
    }
  });

const brightcoveSettingsSchema = z
  .object({
    protocol: z.literal('rtmp://'),
    address: z.string(),
    stream_name: z.string(),
  })
  .passthrough()
  .superRefine(({ protocol, address, stream_name }, context) => {
    if (!stream_name.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['stream_name'],
        message: 'Enter a stream name.',
      });
    }
    if (
      !address.trim() ||
      !stream_name.trim() ||
      !validAddress(`${protocol}${address.trim()}${stream_name.trim()}`)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter a valid RTMP publication address.',
      });
    }
  });

const rtmpEndpointSettingsSchema = z
  .object({
    protocol: z.enum(rtmpProtocols),
    address: z.string(),
  })
  .passthrough()
  .superRefine(({ protocol, address }, context) => {
    if (!address.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter an RTMP server address.',
      });
    } else if (!validAddress(`${protocol}${address.trim()}`)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Enter a valid RTMP server address.',
      });
    }
  });

const rtmpCompositeSettingsSchema = z
  .object({
    protocol: z.enum(rtmpProtocols),
    server_url: z.string(),
    stream_key: z.string(),
  })
  .passthrough()
  .superRefine(({ protocol, server_url, stream_key }, context) => {
    const url = `${protocol}${server_url.trim()}`;
    if (!server_url.trim() || !validAddress(url)) {
      context.addIssue({
        code: 'custom',
        path: ['server_url'],
        message: 'Enter a valid RTMP server URL.',
      });
    }
    if (!stream_key.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['stream_key'],
        message: 'Enter a stream key.',
      });
    }
  });

const directRtmpUrlSettingsSchema = z
  .object({ server_url: z.string(), stream_key: z.string() })
  .passthrough()
  .superRefine(({ server_url, stream_key }, context) => {
    if (!validAddress(server_url.trim(), ['rtmp:', 'rtmps:'])) {
      context.addIssue({
        code: 'custom',
        path: ['server_url'],
        message: 'Enter a valid RTMP(S) server URL.',
      });
    }
    if (!stream_key.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['stream_key'],
        message: 'Enter a stream key.',
      });
    }
  });

const concatenatedRtmpSettingsSchema = z
  .object({
    protocol: z.enum(rtmpProtocols),
    stream_url: z.string(),
    stream_key: z.string(),
  })
  .passthrough()
  .superRefine(({ protocol, stream_url, stream_key }, context) => {
    if (
      !stream_url.trim() ||
      !validAddress(`${protocol}${stream_url.trim()}`)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['stream_url'],
        message: 'Enter a valid RTMP stream URL.',
      });
    }
    if (!stream_key.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['stream_key'],
        message: 'Enter a stream key.',
      });
    }
  });

const dacastSettingsSchema = z
  .object({
    protocol: z.enum(['rtmp://', 'rtmps://']),
    server: z.string(),
    stream_key: z.string(),
    enable_backup_server: z.boolean(),
    backup_server: z.string(),
  })
  .passthrough()
  .superRefine(
    (
      { protocol, server, stream_key, enable_backup_server, backup_server },
      context,
    ) => {
      if (!server.trim() || !validAddress(`${protocol}${server.trim()}`)) {
        context.addIssue({
          code: 'custom',
          path: ['server'],
          message: 'Enter a valid RTMP server address.',
        });
      }
      if (!stream_key.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['stream_key'],
          message: 'Enter a stream key.',
        });
      }
      if (
        enable_backup_server &&
        (!backup_server.trim() ||
          !validAddress(`${protocol}${backup_server.trim()}`))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['backup_server'],
          message: 'Enter a valid backup RTMP server address.',
        });
      }
    },
  );

const akamaiSettingsSchema = z
  .object({
    protocol: z.literal('rtmp://'),
    stream_url: z.string(),
    backup_url: z.string(),
    enable_backup_stream: z.boolean(),
  })
  .passthrough()
  .superRefine(
    ({ protocol, stream_url, backup_url, enable_backup_stream }, context) => {
      if (
        !stream_url.trim() ||
        !validAddress(`${protocol}${stream_url.trim()}`)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['stream_url'],
          message: 'Enter a valid RTMP stream URL.',
        });
      }
      if (
        enable_backup_stream &&
        (!backup_url.trim() || !validAddress(`${protocol}${backup_url.trim()}`))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['backup_url'],
          message: 'Enter a valid backup RTMP URL.',
        });
      }
    },
  );

export const publicationSettingsSchemas = {
  rtmp: rtmpPublicationSettingsSchema,
  srt: srtPublicationSettingsSchema,
  azure: rtmpEndpointSettingsSchema,
  owncast: rtmpCompositeSettingsSchema,
  cdn77: concatenatedRtmpSettingsSchema,
  dailymotion: directRtmpUrlSettingsSchema,
  kick: directRtmpUrlSettingsSchema,
  tiktok: directRtmpUrlSettingsSchema,
  rumble: directRtmpUrlSettingsSchema,
  telegram: concatenatedRtmpSettingsSchema,
  hls: protocolAddressSettingsSchema(
    ['http://', 'https://'],
    'Enter a valid HTTP(S) publication address.',
  ),
  dash: protocolAddressSettingsSchema(
    ['http://', 'https://'],
    'Enter a valid HTTP(S) publication address.',
  ),
  icecast: protocolAddressSettingsSchema(
    ['icecast://'],
    'Enter a valid Icecast publication address.',
  ),
  rtsp: protocolAddressSettingsSchema(
    ['rtsp://'],
    'Enter a valid RTSP publication address.',
  ),
  udp: protocolAddressSettingsSchema(
    ['udp://'],
    'Enter a valid UDP publication address.',
  ),
  mpegts: protocolAddressSettingsSchema(
    ['udp://'],
    'Enter a valid MPEG-TS publication address.',
  ),
  dacast: dacastSettingsSchema,
  red5: protocolAddressSettingsSchema(
    ['rtsp://', 'rtmp://'],
    'Enter a valid RTMP or RTSP server address.',
  ),
  wowza: protocolAddressSettingsSchema(
    ['rtsp://', 'rtmp://'],
    'Enter a valid RTMP or RTSP server address.',
  ),
  akamai: akamaiSettingsSchema,
  brightcove: brightcoveSettingsSchema,
  linkedin: protocolAddressSettingsSchema(
    ['rtmp://', 'rtmps://'],
    'Enter a valid RTMP(S) publication address.',
  ),
  dlive: requiredSettingsSchema('key'),
  instagram: requiredSettingsSchema('key'),
  vimeo: requiredSettingsSchema('key'),
  youtube: youtubeSettingsSchema,
  facebook: facebookSettingsSchema,
  twitch: requiredSettingsSchema('key'),
  twitter: requiredSettingsSchema('stream_key'),
  restream: requiredSettingsSchema('stream_key'),
  trovo: requiredSettingsSchema('key'),
  medianetwork: requiredSettingsSchema('key'),
  nimotv: requiredSettingsSchema('stream_key'),
  picartotv: requiredSettingsSchema('stream_key'),
  livepush: requiredSettingsSchema('stream_key'),
  livespotting: requiredSettingsSchema('vpu_id', 'livesource_id', 'rtmp_token'),
  peertube: requiredSettingsSchema('domain', 'key'),
  datarheicore: coreSettingsSchema,
  dummy: dummySettingsSchema,
  earthcam: earthcamSettingsSchema,
  framebuffer: z
    .object({ device: z.string() })
    .passthrough()
    .superRefine((settings, context) => {
      if (settings.device === 'none') {
        context.addIssue({
          code: 'custom',
          path: ['device'],
          message: 'Choose a framebuffer output device.',
        });
      }
    }),
  image2: protocolAddressSettingsSchema(
    ['http://', 'https://'],
    'Enter a valid HTTP(S) image destination.',
  ),
  wettercom: wettercomSettingsSchema,
} as const;

export function validatePublicationSettings(
  serviceId: string | undefined,
  settings: unknown,
) {
  const schema =
    serviceId &&
    publicationSettingsSchemas[
      serviceId as keyof typeof publicationSettingsSchemas
    ];

  return schema ? schema.safeParse(settings) : { success: true as const };
}

export function getPublicationSettingsErrors(
  serviceId: string | undefined,
  settings: unknown,
): Record<string, string> {
  const result = validatePublicationSettings(serviceId, settings);
  if (result.success || !('error' in result)) {
    return {};
  }

  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}
