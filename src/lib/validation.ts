import { z } from 'zod';

const validAddress = (value: string, protocols?: string[]) => {
  try {
    const address = new URL(value);
    return (
      address.protocol.length > 1 &&
      address.hostname.length > 0 &&
      !address.username &&
      !address.password &&
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
