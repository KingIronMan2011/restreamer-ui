import type { CoreApiError } from '../types/core';
import { fetch } from './fetch';

type RequestOptions = {
  expect?: 'any' | 'json' | 'text';
  headers?: Record<string, string>;
  token?: string;
  body?: BodyInit;
  onprogress?:
    | ((loaded: boolean, progress: number, total: number) => void)
    | null;
};

export type APIResult = {
  err: CoreApiError | null;
  val: any;
};

class API {
  address!: string;
  token: string | (() => Promise<string>) = '';
  cache!: Map<string, { payload: APIResult; ts: number }>;
  base!: string;

  constructor(address: string) {
    this.base = '/api';
    this.address = address;
    this.token = '';

    this.cache = new Map();
  }

  _debug(message: string) {
    //console.log(`[CoreAPI] ${message}`);
  }

  _error(message: CoreApiError['message']) {
    console.error(`[CoreAPI] Error: ${message}`);
  }

  async _GET(path: string, options: RequestOptions = {}): Promise<APIResult> {
    const key = path + JSON.stringify(options);

    const data = this.cache.get(key);
    if (data !== undefined) {
      const millis = Date.now() - data.ts;

      if (millis < 950) {
        return JSON.parse(JSON.stringify(data.payload));
      }
    }

    const ts = Date.now();

    const res = await this._call('GET', path, options);

    this.cache.set(key, {
      payload: JSON.parse(JSON.stringify(res)),
      ts: ts,
    });

    return res;
  }

  async _HEAD(path: string, options: RequestOptions = {}): Promise<APIResult> {
    return await this._call('HEAD', path, options);
  }

  async _POST(path: string, options: RequestOptions = {}): Promise<APIResult> {
    return await this._call('POST', path, options);
  }

  async _PUT(path: string, options: RequestOptions = {}): Promise<APIResult> {
    return await this._call('PUT', path, options);
  }

  async _DELETE(
    path: string,
    options: RequestOptions = {},
  ): Promise<APIResult> {
    return await this._call('DELETE', path, options);
  }

  async _PATCH(path: string, options: RequestOptions = {}): Promise<APIResult> {
    return await this._call('PATCH', path, options);
  }

  async _call(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<APIResult> {
    const requestOptions: RequestOptions & {
      method: string;
      expect: 'any' | 'json' | 'text';
      headers: Record<string, string>;
      token: string;
    } = {
      method: method.toUpperCase(),
      expect: 'any',
      headers: {},
      token: '',
      ...options,
    };

    path = this.base + path;
    if (path !== '/') {
      // remove slash at the end of the path
      if (path[path.length - 1] === '/') {
        path = path.substring(0, path.length - 1);
      }
    }

    let token = '';

    if (requestOptions.token.length !== 0) {
      token = requestOptions.token;
    } else {
      if (typeof this.token === 'function') {
        token = await this.token();
      } else {
        token = this.token;
      }
    }

    if (token.length !== 0) {
      requestOptions.headers.Authorization = 'Bearer ' + token;
    }

    this._debug(`calling ${requestOptions.method} ${this.address + path}`);

    const res: APIResult = {
      err: null,
      val: null,
    };

    let response = null;

    try {
      response = (await fetch(
        this.address + path,
        requestOptions as import('./fetch').FetchOptions,
      )) as Response;
    } catch (err) {
      const error = err as Error;
      res.err = {
        code: -1,
        message: error.message,
      };

      this._error(res.err.message);

      return res;
    }

    const contentType = response.headers.get('Content-Type');
    let isJSON = false;

    if (contentType != null) {
      isJSON = contentType.indexOf('application/json') !== -1;
    }

    if (response.ok === false) {
      res.err = {
        code: response.status,
        message: response.statusText,
      };

      if (isJSON === true) {
        const body = await response.json();

        let message: unknown = body;
        if ('code' in body && 'message' in body) {
          message = body.message;
          if ('status' in body && typeof body.status === 'string') {
            res.err.status = body.status;
          }
        }

        if (typeof message === 'string') {
          res.err.message = message;
        } else if (
          typeof message === 'object' &&
          message !== null &&
          !Array.isArray(message)
        ) {
          res.err.message = message as Record<string, unknown>;
        } else {
          res.err.message = String(message);
        }
      } else {
        const body = await response.text();
        if (body.length > 0) {
          res.err.message = body;
        }
      }

      this._error(res.err.message);

      return res;
    }

    if (isJSON === true) {
      res.val = await response.json();
    } else {
      res.val = await response.text();
    }

    if (requestOptions.expect === 'json') {
      if (isJSON === false) {
        res.val = null;
        res.err = {
          code: -2,
          message: `The response is not JSON as expected (${contentType})`,
        };

        this._error(res.err.message);
      }
    }

    return res;
  }

  SetAddress(address: string) {
    this.address = address;
  }

  SetToken(token: string | (() => Promise<string>)) {
    this.token = token;
    this.cache = new Map();
  }

  async Login(username: string, password: string) {
    return await this._POST('/login', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
      expect: 'json',
    });
  }

  async LoginWithToken(token: string) {
    return await this._POST('/login', {
      headers: {
        'Content-Type': 'application/json',
      },
      expect: 'json',
      token: token,
    });
  }

  async RefreshToken(refresh_token: string) {
    return await this._GET('/login/refresh', {
      expect: 'json',
      token: refresh_token,
    });
  }

  async About() {
    return await this._GET('/', {
      expect: 'json',
    });
  }

  async Skills() {
    return await this._GET('/v3/skills', {
      expect: 'json',
    });
  }

  async SkillsReload() {
    return await this._GET('/v3/skills/reload', {
      expect: 'json',
    });
  }

  async Config(_type: string) {
    return await this._GET('/v3/config', {
      expect: 'json',
    });
  }

  async ConfigSet(config: Record<string, any>) {
    return await this._PUT('/v3/config', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
      expect: 'json',
    });
  }

  async ConfigReload(_type: string) {
    return await this._GET('/v3/config/reload');
  }

  async Log() {
    return await this._GET('/v3/log', {
      expect: 'json',
    });
  }

  async ActiveSessions(collectors: string[]) {
    return await this._GET(
      '/v3/session/active?collectors=' +
        encodeURIComponent(collectors.join(',')),
      {
        expect: 'json',
      },
    );
  }

  async SetMetadata(key: string, data: any) {
    return await this._PUT('/v3/metadata/' + encodeURIComponent(key), {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      expect: 'json',
    });
  }

  async GetMetadata(key: string) {
    return await this._GET('/v3/metadata/' + encodeURIComponent(key), {
      expect: 'json',
    });
  }

  async DataHasFile(path: string) {
    return await this._HEAD('/v3/fs/disk' + path);
  }

  async DataPutFile(
    path: string,
    data: BodyInit,
    onprogress?: (event: ProgressEvent) => void,
  ) {
    return await this._PUT('/v3/fs/disk' + path, {
      headers: {
        'Content-Type': 'application/data',
      },
      body: data,
      onprogress: onprogress as unknown as RequestOptions['onprogress'],
    });
  }

  async DataGetFile(path: string) {
    return await this._GET('/v3/fs/disk' + path);
  }

  async DataListFiles(pathPattern: string) {
    return await this._GET(
      '/v3/fs/disk?glob=' + encodeURIComponent(pathPattern),
      {
        expect: 'json',
      },
    );
  }

  async DataDeleteFile(path: string) {
    return await this._DELETE('/v3/fs/disk' + path);
  }

  async MemFSListFiles(pathPattern: string) {
    return await this._GET(
      '/v3/fs/mem?glob=' + encodeURIComponent(pathPattern),
      {
        expect: 'json',
      },
    );
  }

  async MemFSHasFile(path: string) {
    return await this._HEAD('/v3/fs/mem' + path);
  }

  async MemFSDeleteFile(path: string) {
    return await this._DELETE('/v3/fs/mem' + path);
  }

  async MemFSLinkFile(path: string, linkto: string) {
    return await this._PATCH('/v3/fs/mem/' + path, {
      headers: {
        'Content-Type': 'application/data',
      },
      body: linkto,
    });
  }

  async Processes(reference = '', ids: string[] = [], filter: string[] = []) {
    let url = '/v3/process';
    let params: any[] = [];

    if (reference.length !== 0) {
      params.push('reference=' + encodeURIComponent(reference));
    }

    if (ids.length !== 0) {
      params.push('id=' + encodeURIComponent(ids.join(',')));
    }

    if (filter.length !== 0) {
      params.push('filter=' + encodeURIComponent(filter.join(',')));
    }

    if (params.length !== 0) {
      url = url + '?' + params.join('&');
    }

    return await this._GET(url, {
      expect: 'json',
    });
  }

  async Process(name: string, filter: string[] = []) {
    let url = '/v3/process/' + name;
    if (filter.length !== 0) {
      url = url + '?filter=' + encodeURIComponent(filter.join(','));
    }

    return await this._GET(url, {
      expect: 'json',
    });
  }

  async ProcessConfig(name: string) {
    return await this._GET(
      '/v3/process/' + encodeURIComponent(name) + '/config',
      {
        expect: 'json',
      },
    );
  }

  async ProcessState(name: string) {
    return await this._GET(
      '/v3/process/' + encodeURIComponent(name) + '/state',
      {
        expect: 'json',
      },
    );
  }

  async ProcessReport(name: string) {
    return await this._GET(
      '/v3/process/' + encodeURIComponent(name) + '/report',
      {
        expect: 'json',
      },
    );
  }

  async ProcessCommand(name: string, command: string) {
    return await this._PUT(
      '/v3/process/' + encodeURIComponent(name) + '/command',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command,
        }),
        expect: 'json',
      },
    );
  }

  async ProcessDelete(name: string) {
    return await this._DELETE('/v3/process/' + encodeURIComponent(name));
  }

  async ProcessUpdate(name: string, config: Record<string, any>) {
    return await this._PUT('/v3/process/' + encodeURIComponent(name), {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
  }

  async ProcessSetMetadata(name: string, key: string, data: any) {
    return await this._PUT(
      '/v3/process/' +
        encodeURIComponent(name) +
        '/metadata/' +
        encodeURIComponent(key),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        expect: 'json',
      },
    );
  }

  async ProcessGetMetadata(name: string, key: string) {
    return await this._GET(
      '/v3/process/' +
        encodeURIComponent(name) +
        '/metadata/' +
        encodeURIComponent(key),
      {
        expect: 'json',
      },
    );
  }

  async ProcessAdd(config: Record<string, any>) {
    return await this._POST('/v3/process', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
      expect: 'json',
    });
  }

  async ProcessProbe(name: string) {
    return await this._GET(
      '/v3/process/' + encodeURIComponent(name) + '/probe',
      {
        expect: 'json',
      },
    );
  }

  async Metrics(query: Record<string, any>) {
    return await this._POST('/v3/metrics', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
      expect: 'json',
    });
  }

  async RTMPChannels() {
    const res = await this._GET('/v3/rtmp', {
      expect: 'json',
    });

    if (res.err !== null) {
      return res;
    }

    res.val = res.val.map((f: { name: string }) => f.name);

    return res;
  }

  async SRTChannels() {
    const res = await this._GET('/v3/srt', {
      expect: 'json',
    });

    if (res.err !== null) {
      return res;
    }

    const val = res.val;
    res.val = [];

    for (let path in val.publisher) {
      res.val.push(path);
    }

    return res;
  }
}

export default API;
