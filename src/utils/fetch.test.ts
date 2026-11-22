import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetch } from './fetch';

class FakeXMLHttpRequest {
  static latest: FakeXMLHttpRequest;
  responseType = '';
  response = 'response body';
  status = 200;
  statusText = 'OK';
  onload?: () => void;
  onerror?: () => void;
  onprogress?: (event: ProgressEvent) => void;
  upload: { onprogress?: (event: ProgressEvent) => void } = {};
  opened?: [string, string, boolean];
  sent?: XMLHttpRequestBodyInit;
  headers: Array<[string, string]> = [];

  constructor() {
    FakeXMLHttpRequest.latest = this;
  }

  open(method: string, url: string, async: boolean) {
    this.opened = [method, url, async];
  }

  setRequestHeader(name: string, value: string) {
    this.headers.push([name, value]);
  }

  getAllResponseHeaders() {
    return 'Content-Type: text/plain\r\nX-Trace: test\r\n';
  }

  send(body?: XMLHttpRequestBodyInit) {
    this.sent = body;
  }
}

describe('fetch XMLHttpRequest wrapper', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('opens with uppercase method, headers, and body; resolves successful responses', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    const resultPromise = fetch('/upload', {
      method: 'put',
      headers: { Authorization: 'Bearer token' },
      body: 'payload',
    });
    const xhr = FakeXMLHttpRequest.latest;
    xhr.response = '{"ok":true}';
    xhr.onload?.();

    const result = await resultPromise;
    expect(xhr.opened).toEqual(['PUT', '/upload', true]);
    expect(xhr.headers).toEqual([['Authorization', 'Bearer token']]);
    expect(xhr.sent).toBe('payload');
    expect(result.ok).toBe(true);
    expect(result.headers.get('content-type')).toBe('text/plain');
    expect(result.text()).toBe('{"ok":true}');

    expect(result.json()).toEqual({ ok: true });
  });

  it('resolves unsuccessful HTTP responses and rejects network failures', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    const unsuccessful = fetch('/missing');
    FakeXMLHttpRequest.latest.status = 404;
    FakeXMLHttpRequest.latest.statusText = 'Not Found';
    FakeXMLHttpRequest.latest.onload?.();
    await expect(unsuccessful).resolves.toMatchObject({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const failed = fetch('/offline');
    FakeXMLHttpRequest.latest.onerror?.();
    await expect(failed).rejects.toEqual({ message: 'network error' });
  });

  it('sends an empty GET request without headers or a body', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    const response = fetch('/empty');
    const xhr = FakeXMLHttpRequest.latest;
    xhr.onload?.();

    await response;
    expect(xhr.opened).toEqual(['GET', '/empty', true]);
    expect(xhr.headers).toEqual([]);
    expect(xhr.sent).toBeUndefined();

    const undefinedMethod = fetch('/default-method', { method: undefined });
    const defaultMethodXhr = FakeXMLHttpRequest.latest;
    defaultMethodXhr.onload?.();
    await undefinedMethod;
    expect(defaultMethodXhr.opened?.[0]).toBe('GET');
  });

  it('reports computable and indeterminate download and upload progress', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
    const progress = vi.fn();
    const download = fetch('/download', { onprogress: progress });
    const downloadXhr = FakeXMLHttpRequest.latest;
    downloadXhr.onprogress?.({
      lengthComputable: true,
      loaded: 25,
      total: 100,
    } as ProgressEvent);
    downloadXhr.onprogress?.({
      lengthComputable: false,
      loaded: 50,
      total: 0,
    } as ProgressEvent);

    const upload = fetch('/upload', { method: 'POST', onprogress: progress });
    const uploadXhr = FakeXMLHttpRequest.latest;
    uploadXhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 75,
      total: 100,
    } as ProgressEvent);

    const put = fetch('/put', { method: 'PUT', onprogress: progress });
    const putXhr = FakeXMLHttpRequest.latest;
    putXhr.upload.onprogress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    } as ProgressEvent);

    const patch = fetch('/patch', { method: 'PATCH', onprogress: progress });
    const patchXhr = FakeXMLHttpRequest.latest;
    expect(patchXhr.onprogress).toBeUndefined();

    expect(progress.mock.calls).toEqual([
      [true, 0.25, 100],
      [false, 0, 50],
      [true, 0.75, 100],
      [true, 0.5, 100],
    ]);
    downloadXhr.onload?.();
    uploadXhr.onload?.();
    putXhr.onload?.();
    patchXhr.onload?.();
    await Promise.all([download, upload, put, patch]);
  });
});
