import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function client() {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  return new Restreamer('https://core.example');
}

afterEach(() => vi.restoreAllMocks());

describe('Restreamer skills mapping', () => {
  it('maps codecs, devices, formats, protocols, filters, and channel sources', async () => {
    const restreamer = client();
    restreamer._call = vi.fn().mockResolvedValue([
      {
        ffmpeg: { version: '7.1.2' },
        codecs: {
          audio: [
            { id: 'aac', encoders: ['aac_encoder'], decoders: ['aac_decoder'] },
            { id: 'legacy-audio', encoders: null, decoders: null },
          ],
          video: [
            { id: 'h264', encoders: ['x264'], decoders: ['h264_decoder'] },
            { id: 'legacy-video', encoders: null, decoders: null },
          ],
        },
        hwaccels: [{ id: 'cuda' }],
        formats: {
          demuxers: [{ id: 'mov' }],
          muxers: [{ id: 'mp4' }],
        },
        protocols: {
          input: [{ id: 'rtmp' }],
          output: [{ id: 'srt' }],
        },
        filter: [{ id: 'scale' }],
        devices: {
          demuxers: [
            {
              id: 'video4linux2',
              devices: [
                { id: '/dev/video0', extra: 'camera' },
                { id: '/dev/video1', extra: 'bcm2835_v4l2 camera' },
              ],
            },
            { id: 'avfoundation', devices: [{ id: '0', extra: 'camera' }] },
            { id: 'unsupported', devices: [{ id: 'ignored', extra: '' }] },
          ],
          muxers: [
            { id: 'fbdev', devices: [] },
            {
              id: 'fbdev',
              devices: [{ id: '/dev/fb0', extra: 'framebuffer' }],
            },
            { id: 'unsupported', devices: [{ id: 'ignored' }] },
          ],
        },
      },
      null,
    ]);
    restreamer.ListRTMPChannels = vi.fn().mockResolvedValue(['live']);
    restreamer.ListSRTChannels = vi.fn().mockResolvedValue(['caller']);
    restreamer.channels.set('one', {
      id: 'restreamer-ui:ingest:one',
      channelid: 'one',
      name: 'One',
      egresses: new Map(),
      available: true,
    });

    await restreamer._initSkills();

    expect(restreamer.skills).toMatchObject({
      ffmpeg: { version: '7.1.2', version_major: 7, version_minor: 1 },
      codecs: { audio: { aac: ['aac_encoder'] }, video: { h264: ['x264'] } },
      encoders: {
        audio: ['copy', 'none', 'aac_encoder'],
        video: ['copy', 'none', 'x264'],
      },
      decoders: {
        audio: ['default', 'aac_decoder'],
        video: ['default', 'h264_decoder', 'cuda'],
      },
      formats: { demuxers: ['mov'], muxers: ['mp4'] },
      protocols: { input: ['rtmp'], output: ['srt'] },
      filter: ['scale'],
      sources: {
        network: [
          { media: 'rtmp', id: 'live', name: 'live' },
          { media: 'srt', id: 'caller', name: 'caller' },
        ],
        video4linux2: [{ id: '/dev/video0', extra: 'camera' }],
        raspicam: [{ id: '/dev/video1', extra: 'bcm2835_v4l2 camera' }],
        avfoundation: [{ id: '0', extra: 'camera' }],
        channel: [{ id: 'one', name: 'One' }],
      },
      sinks: { fbdev: [{ id: '/dev/fb0', extra: 'framebuffer' }] },
    });
    const skills = restreamer.Skills();
    skills.ffmpeg.version = 'mutated';
    expect(restreamer.Skills().ffmpeg.version).toBe('7.1.2');
  });

  it('uses safe defaults on API errors and reloads skills only after a successful request', async () => {
    const restreamer = client();
    restreamer._call = vi
      .fn()
      .mockResolvedValueOnce([null, new Error('offline')])
      .mockResolvedValueOnce([null, new Error('reload failed')])
      .mockResolvedValueOnce([null, null])
      .mockResolvedValueOnce([null, new Error('offline')]);

    await restreamer._initSkills();
    expect(restreamer.skills).toMatchObject({
      ffmpeg: { version: '', version_major: 0, version_minor: 0 },
      encoders: { audio: ['copy', 'none'], video: ['copy', 'none'] },
      sources: { network: [], channel: [] },
    });
    restreamer.skills = { ffmpeg: { version: 'old' } };
    await restreamer.RefreshSkills();
    expect(restreamer.skills).toEqual({ ffmpeg: { version: 'old' } });

    restreamer._initSkills = vi.fn().mockResolvedValue(undefined);
    await restreamer.RefreshSkills();
    expect(restreamer._initSkills).toHaveBeenCalledOnce();
    restreamer._call = vi.fn().mockResolvedValue([null, new Error('offline')]);
    await restreamer.RefreshSkills();
    expect(restreamer._initSkills).toHaveBeenCalledOnce();
  });
});
