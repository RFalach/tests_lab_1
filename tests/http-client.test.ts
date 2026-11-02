import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, API_URL } from './msw/server';
import { FetchHttpClient } from '../src/http-client';

const client = new FetchHttpClient();

describe('FetchHttpClient (MSW)', () => {
  it('повертає дані з успішної відповіді', async () => {
    await expect(client.get(`${API_URL}/data`)).resolves.toEqual({ value: 42 });
  });

  it('відхиляє відповідь зі статусом 500', async () => {
    server.use(
      http.get(`${API_URL}/data`, () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );
    await expect(client.get(`${API_URL}/data`)).rejects.toThrow('HTTP_500');
  });

  it('відхиляє відповідь зі статусом 404', async () => {
    server.use(
      http.get(`${API_URL}/data`, () =>
        new HttpResponse(null, { status: 404 }),
      ),
    );
    await expect(client.get(`${API_URL}/data`)).rejects.toThrow('HTTP_404');
  });

  it('відхиляє відповідь, що не є JSON-об’єктом', async () => {
    server.use(
      http.get(`${API_URL}/data`, () => HttpResponse.json('just a string')),
    );
    await expect(client.get(`${API_URL}/data`)).rejects.toThrow('INVALID_FORMAT');
  });

  it('відхиляє відповідь, що є null', async () => {
    server.use(
      http.get(`${API_URL}/data`, () => HttpResponse.json(null)),
    );
    await expect(client.get(`${API_URL}/data`)).rejects.toThrow('INVALID_FORMAT');
  });

  it('прокидає мережеву помилку', async () => {
    server.use(http.get(`${API_URL}/data`, () => HttpResponse.error()));
    await expect(client.get(`${API_URL}/data`)).rejects.toThrow();
  });

  it('робить GET-запит на вказану адресу', async () => {
    let captured: URL | undefined;
    server.use(
      http.get(`${API_URL}/data`, ({ request }) => {
        captured = new URL(request.url);
        return HttpResponse.json({ ok: true });
      }),
    );

    await client.get(`${API_URL}/data`);

    expect(captured?.pathname).toBe('/data');
    expect(captured?.origin).toBe(API_URL);
  });
});
