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
    expect(anonymize_url('rtmp://localhost/live')).toContain('/live');
  });

  it('masks SRT stream IDs and passphrases for localhost', () => {
    const result = anonymize_url(
      'srt://localhost:9000?streamid=private&passphrase=secret',
    );
    expect(result).toContain('streamid=***');
    expect(result).toContain('passphrase=***');
    expect(anonymize_url('srt://localhost:9000')).toContain('localhost:9000');
    expect(anonymize_url('http://localhost:8080/path')).toContain(
      'http://localhost:8080/path',
    );
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

  it('preserves a one-segment local path', () => {
    expect(anonymize('/logo.png')).toBe('/logo.png');
  });
});
