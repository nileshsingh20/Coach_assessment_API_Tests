export interface HttpResponse {
  status(): number;
  ok(): boolean;
  json(): Promise<any>;
  text(): Promise<string>;
  headers(): Record<string, string>;
}

class FetchResponseAdapter implements HttpResponse {
  constructor(private readonly res: Response) {}

  status(): number {
    return this.res.status;
  }

  ok(): boolean {
    return this.res.ok;
  }

  json(): Promise<any> {
    return this.res.json();
  }

  text(): Promise<string> {
    return this.res.text();
  }

  headers(): Record<string, string> {
    const out: Record<string, string> = {};
    this.res.headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
}

export interface HttpRequestOptions {
  data?: unknown;
  params?: Record<string, string | number>;
}

export class HttpRequestContext {
  constructor(
    private readonly baseURL: string,
    private readonly defaultHeaders: Record<string, string>,
  ) {}

  private buildUrl(path: string, params?: Record<string, string | number>): string {
    const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const rel = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(base + rel);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async request(method: string, path: string, options?: HttpRequestOptions): Promise<HttpResponse> {
    const url = this.buildUrl(path, options?.params);
    const init: RequestInit = {
      method,
      headers: { ...this.defaultHeaders },
    };
    if (options?.data !== undefined) {
      init.body = JSON.stringify(options.data);
    }
    const res = await fetch(url, init);
    return new FetchResponseAdapter(res);
  }

  get(path: string, options?: HttpRequestOptions): Promise<HttpResponse> {
    return this.request('GET', path, options);
  }

  post(path: string, options?: HttpRequestOptions): Promise<HttpResponse> {
    return this.request('POST', path, options);
  }

  patch(path: string, options?: HttpRequestOptions): Promise<HttpResponse> {
    return this.request('PATCH', path, options);
  }

  delete(path: string, options?: HttpRequestOptions): Promise<HttpResponse> {
    return this.request('DELETE', path, options);
  }
}
