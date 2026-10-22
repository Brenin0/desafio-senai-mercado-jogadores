import request from 'supertest';

/** Convenções da API: recusa com o código previsto e um JSON com `message` não vazio, sem stack trace. */
export function expectRefusal(
  response: request.Response,
  status: number,
): void {
  expect(response.status).toBe(status);
  expect(response.headers['content-type']).toMatch(/^application\/json/);
  const { message } = response.body as { message: unknown };
  expect(typeof message).toBe('string');
  expect(message).not.toBe('');
  expect(response.text).not.toMatch(/\bat .+\.(ts|js):\d+/);
}
