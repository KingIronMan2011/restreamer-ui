import { describe, expect, it } from 'vitest';

import Sources, { Registry } from './index';

describe('source registry', () => {
  it('lists sources and resolves known and unknown ids', () => {
    expect(Sources.IDs()).toEqual([
      'network',
      'alsa',
      'avfoundation',
      'video4linux2',
      'raspicam',
      'virtualaudio',
      'virtualvideo',
      'noaudio',
      'videoaudio',
      'videoloop',
      'audioloop',
      'sdp',
      'x11grab',
      'channel',
    ]);
    expect(Sources.List()).toHaveLength(14);
    expect(Sources.Get('network')).toMatchObject({ id: 'network' });
    expect(Sources.Get('missing')).toBeNull();
  });

  it('replaces a source when its id is registered again', () => {
    const registry = new Registry();
    registry.Register({ id: 'sample', version: 1 });
    registry.Register({ id: 'sample', version: 2 });
    expect(registry.IDs()).toEqual(['sample']);
    expect(registry.List()).toEqual([{ id: 'sample', version: 2 }]);
    expect(registry.Get('sample')).toEqual({ id: 'sample', version: 2 });
  });
});
