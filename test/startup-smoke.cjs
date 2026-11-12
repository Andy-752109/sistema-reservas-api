// Execute after npm run build. Uses no database and never contacts Azure.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

for (const [name, environment, expected] of [
  [
    'invalid role',
    {
      APPLICATIONINSIGHTS_CONNECTION_STRING: 'fake-connection',
      OTEL_SERVICE_NAME: 'invalid-role',
      CORS_ORIGINS: '',
    },
    'OTEL_SERVICE_NAME',
  ],
  [
    'invalid CORS',
    { APPLICATIONINSIGHTS_CONNECTION_STRING: '', CORS_ORIGINS: '*' },
    'CORS_ORIGINS',
  ],
]) {
  const result = spawnSync(process.execPath, ['dist/main.js'], {
    windowsHide: true,
    encoding: 'utf8',
    timeout: 15000,
    env: {
      ...process.env,
      JWT_SECRET: 'startup-test-only',
      DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/unused',
      PORT: '0',
      ...environment,
    },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 1, result.stderr);
  assert.ok(
    result.stderr.includes('No se pudo iniciar la API.'),
    result.stderr,
  );
  assert.ok(result.stderr.includes(expected), result.stderr);
  assert.ok(
    !/\n\s+at /.test(result.stderr),
    'Startup log must not include a stack',
  );
  console.log(
    `${process.version}: ${name}: error message visible, no stack, exit 1`,
  );
}
