import { anonymize, anonymize_url } from './anonymizer';

describe('anonymize_url', () => {
  it('hides remote hosts', () => {
    expect(anonymize_url('https://user:secret@example.com/path')).toBe(
      'https://[anonymized]',
    );
  });

  it('masks credentials and RTMP tokens for localhost', () => {
    expect(
      anonymize_url('rtmp://user:secret@localhost/live?token=private'),
    ).toContain('***:***@localhost');
    expect(
      anonymize_url('rtmp://user:secret@localhost/live?token=private'),
    ).toContain('token=***');
  });

  it('masks SRT stream IDs and passphrases for localhost', () => {
    const result = anonymize_url(
      'srt://localhost:9000?streamid=private&passphrase=secret',
    );
    expect(result).toContain('streamid=***');
    expect(result).toContain('passphrase=***');
  });
});

describe('anonymize', () => {
  it('replaces URL hosts and preserves the URL protocol', () => {
    expect(anonymize('Stream: https://example.com/live')).toContain(
      'https://[anonymized]',
    );
  });

  it('masks multi segment local paths while preserving the final segment', () => {
    expect(anonymize('File at /channels/main/logo.png')).toContain(
      '/[anonymized]/logo.png',
    );
  });
});
