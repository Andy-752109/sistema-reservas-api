// Local collector: no telemetry or credentials are sent to Azure.
const assert = require('node:assert/strict');

async function exerciseBusiness(app) {
  const { PrismaService } = require('../dist/prisma/prisma.service');
  const { JwtService } = require('@nestjs/jwt');
  const { AppService } = require('../dist/app.service');
  const { randomUUID } = require('node:crypto');
  const prisma = app.get(PrismaService);
  const suffix = randomUUID();
  const user = await prisma.usuario.create({
    data: {
      nombre: 'APM fixture',
      correo: `${suffix}@example.invalid`,
      contrasena: 'not-a-login-hash',
    },
  });
  let space;
  try {
    space = await prisma.espacio.create({
      data: {
        nombre: `APM ${suffix}`,
        tipo: 'CUBICULO',
        capacidad: 1,
        ubicacion: 'test',
      },
    });
    const token = app.get(JwtService).sign({ sub: user.id });
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const base = await app.getUrl();
    const data = {
      espacioId: space.id,
      inicio: '2026-11-20T15:00:00Z',
      fin: '2026-11-20T16:00:00Z',
    };
    const created = await fetch(`${base}/reservas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    assert.equal(created.status, 201);
    const reservation = await created.json();
    const conflict = await fetch(`${base}/reservas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    assert.equal(conflict.status, 409);
    for (let attempt = 0; attempt < 2; attempt++) {
      const cancelled = await fetch(`${base}/reservas/${reservation.id}`, {
        method: 'DELETE',
        headers,
      });
      assert.equal(cancelled.status, 200);
    }
    // Inject failure into this test process only; no production error route.
    const service = app.get(AppService);
    const original = service.getHello;
    try {
      service.getHello = () => {
        throw new Error('secret-5xx SQL password');
      };
      const failed = await fetch(`${base}/`);
      assert.equal(failed.status, 500);
      assert.equal((await failed.json()).message, 'Internal server error');
    } finally {
      service.getHello = original;
    }
  } finally {
    await prisma.reserva.deleteMany({ where: { usuarioId: user.id } });
    if (space) await prisma.espacio.delete({ where: { id: space.id } });
    await prisma.usuario.delete({ where: { id: user.id } });
  }
}

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
    if (process.argv.includes('--business')) await exerciseBusiness(app);
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
  // Fixed test ports avoid Windows excluded ranges near the ephemeral limit.
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(
      Number(process.env.TELEMETRY_TEST_COLLECTOR_PORT || 31057),
      '127.0.0.1',
      resolve,
    );
  });
  try {
    for (const role of ['disabled', 'api-dev', 'api-prod']) {
      envelopes.length = 0;
      const endpoint = `http://127.0.0.1:${server.address().port}`;
      const api = spawn(
        process.execPath,
        [
          __filename,
          '--child',
          ...(process.argv.includes('--business') ? ['--business'] : []),
        ],
        {
          windowsHide: true,
          env: {
            ...process.env,
            PORT: process.env.TELEMETRY_TEST_API_PORT || '31058',
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
        },
      );
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
      if (process.argv.includes('--business')) {
        const messages = envelopes.filter(
          (item) => item.data?.baseType === 'MessageData',
        );
        for (const [event, severity] of [
          ['reserva.creada', 'Information'],
          ['reserva.cancelada', 'Information'],
          ['reserva.traslape', 'Warning'],
        ]) {
          const matching = messages.filter(
            (item) => item.data.baseData.message === event,
          );
          assert.equal(matching.length, 1, `Expected exactly one ${event}`);
          const item = matching[0];
          assert.equal(item.data.baseData.severityLevel, severity);
          assert.ok(item.data.baseData.properties.usuarioId);
          assert.ok(item.data.baseData.properties.espacioId);
          assert.equal(item.tags['ai.cloud.role'], role);
          assert.ok(
            envelopes.some(
              (request) =>
                request.data?.baseType === 'RequestData' &&
                request.tags['ai.operation.id'] ===
                  item.tags['ai.operation.id'],
            ),
            'Business log is not correlated with its request',
          );
        }
        const errors = envelopes.filter(
          (item) => item.data?.baseType === 'ExceptionData',
        );
        assert.equal(errors.length, 1);
        assert.equal(errors[0].data.baseData.severityLevel, 'Error');
        assert.ok(
          envelopes.some(
            (item) =>
              item.data?.baseType === 'RequestData' &&
              item.data.baseData.responseCode === '500' &&
              item.tags['ai.operation.id'] ===
                errors[0].tags['ai.operation.id'],
          ),
        );
        assert.ok(
          !JSON.stringify([...messages, ...errors]).includes('secret-5xx'),
        );
        console.log(
          `${process.version}: ${role}: exported INFO/WARN business logs and sanitized correlated 5xx exception`,
        );
      }
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
