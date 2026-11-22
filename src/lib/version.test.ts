import { getUIVersion } from './version';

test('uses bundled UI names and falls back to package metadata', () => {
  expect(
    getUIVersion({
      bundle: 'restreamer-ui bundled',
      name: 'restreamer-ui',
      version: '1.0.0',
    }),
  ).toBe('restreamer-ui bundled');
  expect(
    getUIVersion({ bundle: '', name: 'restreamer-ui', version: '1.0.0' }),
  ).toBe('restreamer-ui v1.0.0');
});
