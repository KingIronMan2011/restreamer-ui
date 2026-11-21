export type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
  onprogress?: (loaded: boolean, progress: number, total: number) => void;
};

const fetch = async (url: string, options: FetchOptions = {}) => {
  options = {
    method: 'GET',
    ...options,
  };

  options.method = (options.method ?? 'GET').toUpperCase();

  const xhr = new XMLHttpRequest();

  return new Promise<any>((resolve, reject) => {
    xhr.responseType = 'text';
    xhr.onload = () => {
      const response = {
        ok: false,
        headers: {
          get: function (key: any) {
            return this.data.get(key.toLowerCase());
          },
          data: xhr
            .getAllResponseHeaders()
            .split('\r\n')
            .reduce((result, current) => {
              let [name, value] = current.split(': ');
              result.set(name, value);
              return result;
            }, new Map()),
        },
        status: xhr.status,
        statusText: xhr.statusText,
        data: xhr.response,
        json: function () {
          return JSON.parse(this.data);
        },
        text: function () {
          return this.data;
        },
      };
      if (xhr.status < 200 || xhr.status >= 300) {
        resolve(response);
      } else {
        response.ok = true;
        resolve(response);
      }
    };
    xhr.onerror = () => {
      reject({
        message: 'network error',
      });
    };
    if ('onprogress' in options && typeof options.onprogress == 'function') {
      const tracker = (event: any) => {
        if (!event.lengthComputable) {
          options.onprogress?.(false, 0, event.loaded);
          return;
        }

        options.onprogress?.(true, event.loaded / event.total, event.total);
      };

      if (options.method === 'GET') {
        xhr.onprogress = tracker;
      } else if (options.method === 'PUT' || options.method === 'POST') {
        xhr.upload.onprogress = tracker;
      }
    }
    xhr.open(options.method!, url, true);
    if ('headers' in options) {
      for (const header in options.headers) {
        xhr.setRequestHeader(header, options.headers[header]);
      }
    }
    if ('body' in options) {
      xhr.send(options.body as XMLHttpRequestBodyInit);
    } else {
      xhr.send();
    }
  });
};

export { fetch };
