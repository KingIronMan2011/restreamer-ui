import { i18n } from '@lingui/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Help from './help';

describe('Help links', () => {
  afterEach(() => {
    i18n.activate('en');
    vi.restoreAllMocks();
  });

  it('opens the topic link in the active language', () => {
    i18n.activate('de');
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    Help('login');

    expect(open).toHaveBeenCalledWith(
      'https://docs.datarhei.com/restreamer/v/de/wissensdatenbank/user-guides/dashboard',
    );
  });

  it('falls back to English for unsupported topic locales', () => {
    i18n.activate('fr');
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    Help('login');

    expect(open).toHaveBeenCalledWith(
      'https://docs.datarhei.com/restreamer/knowledge-base/manual/login',
    );
  });

  it('warns and opens the documentation root for unknown topics', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    Help('unknown-topic');

    expect(warn).toHaveBeenCalledWith('help topic "unknown-topic" not found');
    expect(open).toHaveBeenCalledWith('https://docs.datarhei.com/restreamer');
  });
});
