import Registry from './index';

describe('wizard source registry', () => {
  it('lists and resolves all registered source IDs', () => {
    expect(Registry.IDs()).toEqual(
      expect.arrayContaining([
        'network',
        'rtmp',
        'srt',
        'avfoundation',
        'raspicam',
        'video4linux2',
      ]),
    );
    expect(Registry.List().map((source) => source.id)).toEqual(Registry.IDs());
    expect(Registry.Get('unknown')).toBeNull();
  });
});
