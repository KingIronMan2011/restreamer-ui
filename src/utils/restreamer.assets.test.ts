import { afterEach, describe, expect, it, vi } from 'vitest';

import '../i18n';
import Restreamer from './restreamer';
import * as Storage from './storage';

function client() {
  vi.spyOn(Storage, 'Get').mockReturnValue('false');
  return new Restreamer('https://core.example');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Restreamer asset helpers', () => {
  it('loads and caches local assets and handles failed fetches', async () => {
    const restreamer = client();
    const blob = new Blob(['hello']);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => blob });
    vi.stubGlobal('fetch', fetchMock);

    await expect(restreamer._getLocalAsset('/logo.png')).resolves.toBe(blob);
    await expect(restreamer._getLocalAsset('/logo.png')).resolves.toBe(blob);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(restreamer._getLocalAssetAsString('/logo.png')).resolves.toBe(
      'hello',
    );

    fetchMock.mockResolvedValueOnce({ ok: false, blob: () => blob });
    await expect(restreamer._getLocalAsset('/missing.png')).resolves.toBeNull();
    fetchMock.mockRejectedValueOnce(new Error('network'));
    await expect(restreamer._getLocalAsset('/offline.png')).resolves.toBeNull();
    vi.spyOn(restreamer, '_getLocalAsset').mockResolvedValueOnce(null);
    await expect(
      restreamer._getLocalAssetAsString('/missing.txt'),
    ).resolves.toBeNull();
  });

  it('synchronizes player, playersite, and public essentials', async () => {
    const restreamer = client();
    restreamer._getLocalAssetAsString = vi
      .fn()
      .mockResolvedValue('index.html\r\nstyle.css\n');
    restreamer._uploadLocalAsset = vi.fn().mockResolvedValue(true);
    restreamer._deleteAsset = vi.fn().mockResolvedValue(true);

    await expect(restreamer._updatePlayerEssentials('camera')).resolves.toBe(
      true,
    );
    expect(restreamer._uploadLocalAsset).toHaveBeenCalledWith(
      '/_player/camera/index.html',
      '/player/camera/index.html',
    );
    expect(restreamer._uploadLocalAsset).toHaveBeenCalledWith(
      '/_player/camera/style.css',
      '/player/camera/style.css',
    );

    await expect(restreamer._updatePlayersiteEssentials()).resolves.toBe(true);
    expect(restreamer._uploadLocalAsset).toHaveBeenCalledWith(
      '/_playersite/bg.jpg',
      '/playersite/default_bg.jpg',
    );
    await restreamer._removePlayersiteEssentials();
    await restreamer._updatePublicEssentials();
    await restreamer._removePublicEssentials();
    expect(restreamer._deleteAsset).toHaveBeenCalledTimes(8);
    expect(restreamer._uploadLocalAsset).toHaveBeenCalledTimes(15);
  });

  it('uploads and deletes assets and reports API failures safely', async () => {
    const restreamer = client();
    const blob = new Blob(['data']);
    restreamer._getLocalAsset = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(blob);
    restreamer._uploadAssetData = vi.fn().mockResolvedValue(true);
    expect(await restreamer._uploadLocalAsset('/missing', '/remote')).toBe(
      false,
    );
    expect(await restreamer._uploadLocalAsset('/local', '/remote')).toBe(true);
    expect(await restreamer._uploadAssetData('/remote', blob)).toBe(true);
    expect(await restreamer._deleteAsset('/remote')).toBe(true);

    restreamer._call = vi
      .fn()
      .mockResolvedValueOnce([null, new Error('missing')])
      .mockResolvedValueOnce([null, null])
      .mockResolvedValueOnce([null, new Error('missing')])
      .mockResolvedValueOnce(['contents', null])
      .mockResolvedValueOnce([null, new Error('missing')])
      .mockResolvedValueOnce([[{ name: 'one' }], null])
      .mockResolvedValueOnce([null, new Error('offline')])
      .mockResolvedValueOnce([['rtmp'], null])
      .mockResolvedValueOnce([null, new Error('offline')])
      .mockResolvedValueOnce([['srt'], null]);

    await expect(restreamer._hasAsset('/file')).resolves.toBe(false);
    await expect(restreamer._hasAsset('/file')).resolves.toBe(true);
    await expect(restreamer._getAssetAsString('/file')).resolves.toBe('');
    await expect(restreamer._getAssetAsString('/file')).resolves.toBe(
      'contents',
    );
    await expect(restreamer._listAssets('*')).resolves.toEqual([]);
    await expect(restreamer._listAssets('*')).resolves.toEqual(['one']);
    await expect(restreamer._listRTMPChannels()).resolves.toEqual([]);
    await expect(restreamer._listRTMPChannels()).resolves.toEqual(['rtmp']);
    await expect(restreamer._listSRTChannels()).resolves.toEqual([]);
    await expect(restreamer._listSRTChannels()).resolves.toEqual(['srt']);
  });

  it('uploads asset data through Core with an optional progress callback', async () => {
    const restreamer = client();
    const call = vi.fn().mockResolvedValue([null, null]);
    restreamer._call = call;
    const progress = vi.fn();
    await expect(restreamer._uploadAssetData('/file', 'data')).resolves.toBe(
      true,
    );
    await expect(
      restreamer._uploadAssetData('/file', 'data', progress),
    ).resolves.toBe(true);
    expect(call).toHaveBeenNthCalledWith(
      1,
      restreamer.api.DataPutFile,
      '/file',
      'data',
      null,
    );
    expect(call).toHaveBeenNthCalledWith(
      2,
      restreamer.api.DataPutFile,
      '/file',
      'data',
      progress,
    );
  });
});
