import { describe, expect, it } from 'vitest';

import { Audio, Registry, Video } from './index';

describe('filter registries', () => {
  it('lists and resolves registered audio and video filters', () => {
    expect(Audio.Filters()).toEqual(['aresample', 'pan', 'volume', 'loudnorm']);
    expect(Audio.List()).toHaveLength(4);
    expect(Audio.Get('pan')).toMatchObject({ filter: 'pan', type: 'audio' });
    expect(Audio.Get('missing')).toBeNull();

    expect(Video.Filters()).toEqual([
      'bwdif',
      'fps',
      'scale',
      'transpose',
      'hflip',
      'vflip',
    ]);
    expect(Video.List()).toHaveLength(6);
    expect(Video.Get('fps')).toMatchObject({ filter: 'fps', type: 'video' });
    expect(Video.Get('missing')).toBeNull();
  });

  it('ignores filters registered for a different media type', () => {
    const registry = new Registry('audio');
    registry.Register({ filter: 'scale', type: 'video' });
    expect(registry.Filters()).toEqual([]);
    expect(registry.Get('scale')).toBeNull();
  });
});
