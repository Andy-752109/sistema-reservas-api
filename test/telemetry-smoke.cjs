// Local collector: no telemetry or credentials are sent to Azure.
const assert = require('node:assert/strict');

async function child() {
  const { initializeTelemetry } = require('../dist/telemetry');
  const shutdown = await initializeTelemetry(process.env, async () => {
    const sdk = require('@azure/monitor-opentelemetry');
    return {
      ...sdk,
      useAzureMonitor(options) {
        sdk.useAzureMonitor({
          ...options,
          azureMonitorExporterOptions: {
            ...options.azureMonitorExporterOptions,
            endpoint: process.env.TELEMETRY_TEST_ENDPOINT,
            host: process.env.TELEMETRY_TEST_ENDPOINT,
            allowInsecureConnection: true,
            disableOfflineStorage: true,
          },
        });
      },
    };
  });
  if (!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING?.trim()) {
    assert.equal(shutdown, undefined);
    assert.ok(
      !Object.keys(require.cache).some((path) =>
        /[\\/]@azure[\\/]monitor-opentelemetry[\\/]/.test(path),
      ),
    );
  }
  const { startApplication } = require('../dist/bootstrap');
  const app = await startApplication(shutdown);
  try {
    const response = await fetch(`${await app.getUrl()}/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).database, 'up');
  } finally {
    await app.close();
  }
}

async function parent() {
  assert.ok(
    process.env.DATABASE_URL,
    'Set DATABASE_URL to a migrated test database.',
  );
  const { createServer } = require('node:http');
  const { spawn } = require('node:child_process');
  const { gunzipSync } = require('node:zlib');
  const envelopes = [];
  const server = createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      let body = Buffer.concat(chunks);
      if (request.headers['content-encoding'] === 'gzip')
        body = gunzipSync(body);
      const parsed = JSON.parse(body.toString());
      envelopes.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(
        JSON.stringify({
          itemsReceived: envelopes.length,
          itemsAccepted: envelopes.length,
          errors: [],
        }),
      );
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    for (const role of ['disabled', 'api-dev', 'api-prod']) {
      envelopes.length = 0;
      const endpoint = `http://127.0.0.1:${server.address().port}`;
      const api = spawn(process.execPath, [__filename, '--child'], {
        windowsHide: true,
        env: {
          ...process.env,
          PORT: '0',
          JWT_SECRET: 'telemetry-test-secret',
          CORS_ORIGINS: '',
          OTEL_SERVICE_NAME: role,
          TELEMETRY_TEST_ENDPOINT: endpoint,
          APPLICATIONINSIGHTS_CONNECTION_STRING:
            role === 'disabled'
              ? ' '
              : `InstrumentationKey=00000000-0000-4000-8000-000000000001;IngestionEndpoint=${endpoint}`,
          APPLICATION_INSIGHTS_NO_STATSBEAT: 'true',
          APPLICATIONINSIGHTS_STATSBEAT_DISABLED: 'true',
          OTEL_RESOURCE_DETECTORS: 'none',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let output = '';
      api.stdout.on('data', (data) => {
        output += data;
      });
      api.stderr.on('data', (data) => {
        output += data;
      });
      const timeout = setTimeout(() => api.kill(), 45000);
      const code = await new Promise((resolve) => api.on('exit', resolve));
      clearTimeout(timeout);
      assert.equal(code, 0, `Telemetry child failed: ${output}`);
      if (role === 'disabled') {
        assert.equal(envelopes.length, 0);
        console.log(
          `${process.version}: disabled: API works without loading Azure Monitor or exporting telemetry`,
        );
        continue;
      }
      const request = envelopes.find(
        (item) =>
          item.data?.baseType === 'RequestData' &&
          item.data.baseData.url?.endsWith('/health'),
      );
      assert.ok(request, 'Missing exported /health request');
      const dependency = envelopes.find(
        (item) =>
          item.data?.baseType === 'RemoteDependencyData' &&
          /postgres/i.test(item.data.baseData.type) &&
          item.tags['ai.operation.id'] === request.tags['ai.operation.id'],
      );
      assert.ok(
        dependency,
        'Missing PostgreSQL dependency correlated with /health',
      );
      assert.equal(request.tags['ai.cloud.role'], role);
      assert.equal(dependency.tags['ai.cloud.role'], role);
      assert.ok(
        dependency.data.baseData.target?.includes(
          new URL(process.env.DATABASE_URL).pathname.slice(1),
        ),
        'Missing database destination in dependency',
      );
      console.log(
        `${process.version}: ${role}: exported HTTP + PostgreSQL with matching operation id`,
      );
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

(process.argv.includes('--child') ? child() : parent()).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
