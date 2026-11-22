import { afterEach, describe, expect, it, vi } from 'vitest';

const supportedLanguages = [
  'en',
  'da',
  'de',
  'el',
  'es',
  'fr',
  'it',
  'ko',
  'pl',
  'pt-br',
  'ru',
  'sl',
  'tr',
  'uk',
  'zh-hans',
];

const loadActiveLanguage = async () => {
  vi.resetModules();
  const module = await import('./i18n');
  const provider = module.default({ children: null }) as {
    props: { i18n: { locale: string } };
  };
  return provider.props.i18n.locale;
};

describe('i18n language selection', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it.each([
    ['pt', 'en-US', 'pt-br'],
    ['zh-cn', 'en-US', 'zh-hans'],
    ['not-supported', 'pt-BR', 'pt-br'],
    ['not-supported', 'xx-YY', 'en'],
  ])('selects %s / browser %s as %s', async (stored, browser, expected) => {
    localStorage.setItem('@@restreamer-ui@@language', stored);
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: browser,
    });

    expect(supportedLanguages).toContain(expected);
    expect(await loadActiveLanguage()).toBe(expected);
    expect(localStorage.getItem('@@restreamer-ui@@language')).toBe(expected);
  });

  it('uses the default when the browser language cannot be parsed', async () => {
    localStorage.setItem('@@restreamer-ui@@language', 'unsupported');
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: '123',
    });

    expect(await loadActiveLanguage()).toBe('en');
    expect(localStorage.getItem('@@restreamer-ui@@language')).toBe('en');
  });
});
