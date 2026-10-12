import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Load the browser module in Node, substituting only Vite's environment object.
const source = (await readFile(new URL('../src/api/sessionClient.js', import.meta.url), 'utf8'))
  .replace('"axios"', JSON.stringify(import.meta.resolve('axios')))
  .replace('import.meta.env', '({})');
const { sessionFetch, sessionAxios } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('session authentication for fetch and Axios', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  globalThis.window = { location: { origin: 'http://localhost' } };
  const calls = [];
  let csrfOK = true;
  globalThis.fetch = async (input, options) => {
    calls.push({ input, options });
    return { ok: csrfOK, json: async () => ({ message: { csrf_token: 'session-csrf' } }) };
  };
  try {
    await sessionFetch('/api/resource/Customer', { headers: { authorization: 'token old:secret' } });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.credentials, 'include');
    assert.equal(calls[0].options.headers.has('Authorization'), false);

    calls.length = 0;
    await sessionFetch('/api/method/save', { method: 'POST', body: '{"name":"Test"}', headers: { 'Content-Type': 'application/json' } });
    assert.match(calls[0].input, /get_csrf_token$/);
    assert.equal(calls[1].options.headers.get('X-Frappe-CSRF-Token'), 'session-csrf');
    assert.equal(calls[1].options.body, '{"name":"Test"}');

    calls.length = 0;
    await sessionFetch('/api/method/login', { method: 'POST' });
    assert.equal(calls.length, 1);

    calls.length = 0;
    const externalOptions = { method: 'GET' };
    await sessionFetch('https://open.er-api.com/v6/latest/USD', externalOptions);
    assert.equal(calls[0].options, externalOptions);

    calls.length = 0;
    const body = new FormData();
    body.append('file', new Blob(['test']), 'test.txt');
    await sessionFetch('/api/method/upload_file', { method: 'POST', body });
    assert.equal(calls[1].options.body, body);
    assert.equal(calls[1].options.headers.has('Content-Type'), false);

    calls.length = 0;
    await Promise.all([
      sessionFetch('/api/method/save', { method: 'POST' }),
      sessionFetch('/api/method/save', { method: 'POST' }),
    ]);
    assert.equal(calls.filter(({input}) => String(input).endsWith('get_csrf_token')).length, 1);

    let axiosConfig;
    await sessionAxios.post('/api/method/save', { name: 'Test' }, {
      headers: { Authorization: 'token old:secret' },
      adapter: async (config) => {
        axiosConfig = config;
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      },
    });
    assert.equal(axiosConfig.withCredentials, true);
    assert.equal(axiosConfig.headers.has('Authorization'), false);
    assert.equal(axiosConfig.headers.get('X-Frappe-CSRF-Token'), 'session-csrf');

    calls.length = 0;
    csrfOK = false;
    await assert.rejects(sessionFetch('/api/method/save', { method: 'POST' }), /authentication session/);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.window = originalWindow;
  }
});
