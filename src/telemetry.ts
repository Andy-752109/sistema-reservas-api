import type { AzureMonitorOpenTelemetryOptions } from '@azure/monitor-opentelemetry';
import { resourceFromAttributes } from '@opentelemetry/resources';
import type { PgInstrumentationConfig } from '@opentelemetry/instrumentation-pg';

// The Node 20 exporter expects legacy database attributes. Keep the patched
// pg instrumentation and provide the attributes needed by Application Map.
export const postgreSqlInstrumentation: PgInstrumentationConfig = {
  enabled: true,
  enhancedDatabaseReporting: false,
  ignoreConnectSpans: true,
  requestHook(span, { connection }) {
    span.setAttribute('db.system', 'postgresql');
    if (connection.database) span.setAttribute('db.name', connection.database);
    if (connection.host) span.setAttribute('net.peer.name', connection.host);
    if (connection.port) span.setAttribute('net.peer.port', connection.port);
  },
};

type TelemetrySdk = Pick<
  typeof import('@azure/monitor-opentelemetry'),
  'useAzureMonitor' | 'shutdownAzureMonitor'
>;

export async function initializeTelemetry(
  env: NodeJS.ProcessEnv = process.env,
  loadSdk: () => Promise<TelemetrySdk> = () =>
    import('@azure/monitor-opentelemetry'),
): Promise<(() => Promise<void>) | undefined> {
  const connectionString = env.APPLICATIONINSIGHTS_CONNECTION_STRING?.trim();
  if (!connectionString) return undefined;

  const role = env.OTEL_SERVICE_NAME?.trim();
  if (role !== 'api-dev' && role !== 'api-prod') {
    throw new Error(
      'OTEL_SERVICE_NAME debe ser api-dev o api-prod cuando Application Insights esta habilitado.',
    );
  }

  const sdk = await loadSdk();
  const options: AzureMonitorOpenTelemetryOptions = {
    azureMonitorExporterOptions: { connectionString },
    resource: resourceFromAttributes({
      'service.name': role,
      'service.namespace': '',
      'service.version': env.COMMIT_SHA?.trim() || 'development',
    }),
    samplingRatio: 1,
    tracesPerSecond: 0,
    enableLiveMetrics: false,
    browserSdkLoaderOptions: { enabled: false },
    instrumentationOptions: {
      http: { enabled: true },
      postgreSql: postgreSqlInstrumentation,
      azureSdk: { enabled: false },
      mongoDb: { enabled: false },
      mySql: { enabled: false },
      redis: { enabled: false },
      redis4: { enabled: false },
      bunyan: { enabled: false },
      winston: { enabled: false },
    },
  };
  sdk.useAzureMonitor(options);
  return () => sdk.shutdownAzureMonitor();
}
