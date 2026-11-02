import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const API_URL = 'https://api.example.com';

export const handlers = [
  http.get(`${API_URL}/data`, () =>
    HttpResponse.json({ value: 42 }),
  ),
];

export const server = setupServer(...handlers);
