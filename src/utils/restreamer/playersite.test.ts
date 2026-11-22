import { describe, expect, it, vi } from 'vitest';

import { UpdatePlayersite } from './playersite';

function createClient(overrides: Record<string, any> = {}) {
  const channels = [
    { channelid: 'main', name: 'Main' },
    { channelid: 'listed', name: 'Listed' },
    { channelid: 'ignored', name: 'Ignored' },
  ];
  const settings = {
    player: 'videojs',
    playersite: true,
    channelid: 'main',
    channel_list: ['listed'],
    title: 'Site title',
    share: true,
    support: true,
    chromecast: false,
    airplay: false,
    template: '!default',
    templatename: '',
    textcolor_title: 'white',
    textcolor_default: 'white',
    textcolor_link: 'white',
    textcolor_link_hover: 'white',
    bgcolor_header: 'black',
    bgcolor_selected: 'black',
    bgcolor_unselected: 'black',
    hrcolor: 'gray',
    bgcolor_default: 'black',
    bgimage_url: '',
    imprint: 'Line one\nLine two',
    terms: 'Terms',
    inject1: '',
    inject2: '',
    inject3: '',
    inject4: '',
    ...overrides.settings,
  };
  const client = {
    GetMetadata: vi.fn().mockResolvedValue({ playersite: {} }),
    InitPlayersiteSettings: vi.fn(() => settings),
    _removePlayersiteEssentials: vi.fn().mockResolvedValue(undefined),
    _updatePlayerEssentials: vi.fn().mockResolvedValue(true),
    _updatePlayersiteEssentials: vi.fn().mockResolvedValue(true),
    GetChannel: vi.fn(
      (id: string) =>
        channels.find((channel) => channel.channelid === id) ?? null,
    ),
    GetCurrentChannelID: vi.fn(() => 'main'),
    ListChannels: vi.fn(() => channels),
    GetIngestMetadata: vi.fn().mockResolvedValue({
      meta: {
        name: 'Stream name',
        description: 'Description\nline two',
        author: { name: 'Creator', description: 'About creator\nsecond line' },
      },
      license: 'CC0',
      control: { hls: { storage: 'memfs' } },
    }),
    GetPlayersiteUrl: vi.fn(() => 'index.html'),
    GetChannelPosterPath: vi.fn(() => '/memfs/poster.jpg'),
    GetPlayersiteTemplate: vi.fn().mockResolvedValue('Custom {{channel_name}}'),
    _getLocalAssetAsString: vi
      .fn()
      .mockResolvedValue('<h1>{{channel_name}}</h1>'),
    _uploadAssetData: vi.fn().mockResolvedValue(true),
    UpdatePlayerConfig: vi.fn().mockResolvedValue(true),
    ...overrides.client,
  };
  return { client, channels, settings };
}

describe('UpdatePlayersite', () => {
  it('removes playersite assets and returns when the site is disabled', async () => {
    const { client } = createClient({ settings: { playersite: false } });
    await expect(UpdatePlayersite.call(client as never)).resolves.toBe(true);
    expect(client._removePlayersiteEssentials).toHaveBeenCalledOnce();
    expect(client._updatePlayerEssentials).not.toHaveBeenCalled();
  });

  it('renders the default template for the main and selected channels', async () => {
    const { client } = createClient();

    await expect(UpdatePlayersite.call(client as never)).resolves.toBe(true);

    expect(client._updatePlayerEssentials).toHaveBeenCalledWith('videojs');
    expect(client._updatePlayersiteEssentials).toHaveBeenCalledOnce();
    expect(client.GetChannel).toHaveBeenCalledWith('main');
    expect(client._uploadAssetData).toHaveBeenCalledWith(
      '/index.html',
      '<h1>Stream name</h1>',
    );
    expect(client._uploadAssetData).toHaveBeenCalledWith(
      '/playersite_main.html',
      '<h1>Stream name</h1>',
    );
    expect(client._uploadAssetData).toHaveBeenCalledWith(
      '/playersite_listed.html',
      '<h1>Stream name</h1>',
    );
    expect(client._uploadAssetData).not.toHaveBeenCalledWith(
      '/playersite_ignored.html',
      expect.anything(),
    );
    expect(client.UpdatePlayerConfig).toHaveBeenCalledTimes(2);
    expect(client._uploadAssetData).toHaveBeenCalledWith(
      '/playersite/player.js',
      '<h1>{{channel_name}}</h1>',
    );
  });

  it('falls back to the current channel and default template when the custom template is empty', async () => {
    const { client } = createClient({
      settings: { channelid: 'missing', channel_list: [], template: 'custom' },
      client: { GetPlayersiteTemplate: vi.fn().mockResolvedValue('') },
    });

    await expect(UpdatePlayersite.call(client as never)).resolves.toBe(true);

    expect(client.GetCurrentChannelID).toHaveBeenCalledOnce();
    expect(client.GetPlayersiteTemplate).toHaveBeenCalledWith('custom');
    expect(client._getLocalAssetAsString).toHaveBeenCalledWith(
      '/_playersite/index.html',
    );
    expect(client._uploadAssetData).toHaveBeenCalledWith(
      '/index.html',
      '<h1>Stream name</h1>',
    );
  });

  it('returns false when neither the configured nor current channel exists', async () => {
    const { client } = createClient({
      settings: { channelid: 'missing' },
      client: { GetCurrentChannelID: vi.fn(() => 'also-missing') },
    });

    await expect(UpdatePlayersite.call(client as never)).resolves.toBe(false);
    expect(client._uploadAssetData).not.toHaveBeenCalled();
  });

  it('uses a custom template for an enabled configured channel', async () => {
    const { client } = createClient({
      settings: { template: 'custom', channel_list: [] },
      client: {
        GetPlayersiteTemplate: vi
          .fn()
          .mockResolvedValue(
            '{{#ifEquals channel_id "main"}}A{{else}}a{{/ifEquals}}|' +
              '{{#ifEquals channel_id "other"}}b{{else}}B{{/ifEquals}}|' +
              '{{#ifnoteq channel_id "other"}}C{{else}}c{{/ifnoteq}}|' +
              '{{#ifnoteq channel_id "main"}}d{{else}}D{{/ifnoteq}}',
          ),
      },
    });

    await UpdatePlayersite.call(client as never);

    expect(client._uploadAssetData).toHaveBeenCalledWith(
      '/index.html',
      'A|B|C|D',
    );
    expect(client._uploadAssetData).toHaveBeenCalledWith(
      '/playersite_main.html',
      'A|B|C|D',
    );
  });
});
