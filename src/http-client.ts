export interface HttpClient {
  get<T>(url: string): Promise<T>;
}

export class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    const data = await response.json();
    if (typeof data !== 'object' || data === null) {
      throw new Error('INVALID_FORMAT');
    }
    return data as T;
  }
}
