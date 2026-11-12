import { initializeTelemetry } from './telemetry';
import type { AzureMonitorOpenTelemetryOptions } from '@azure/monitor-opentelemetry';

describe('initializeTelemetry', () => {
  const useAzureMonitor = jest.fn<void, [AzureMonitorOpenTelemetryOptions]>();
  const shutdownAzureMonitor = jest.fn().mockResolvedValue(undefined);
  const load = jest.fn(() =>
    Promise.resolve({ useAzureMonitor, shutdownAzureMonitor }),
  );

  beforeEach(() => jest.clearAllMocks());

  it.each([undefined, '', '   '])(
    'does not load the SDK without a connection string (%s)',
    async (value) => {
      expect(
        await initializeTelemetry(
          { APPLICATIONINSIGHTS_CONNECTION_STRING: value },
          load,
        ),
      ).toBeUndefined();
      expect(load).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, '', 'api', 'production'])(
    'rejects an ambiguous cloud role (%s)',
    async (role) => {
      await expect(
        initializeTelemetry(
          {
            APPLICATIONINSIGHTS_CONNECTION_STRING: 'private-value',
            OTEL_SERVICE_NAME: role,
          },
          load,
        ),
      ).rejects.toThrow('OTEL_SERVICE_NAME');
      expect(load).not.toHaveBeenCalled();
    },
  );

  it.each(['api-dev', 'api-prod'])(
    'initializes HTTP and PostgreSQL for %s and shuts down',
    async (role) => {
      const stop = await initializeTelemetry(
        {
          APPLICATIONINSIGHTS_CONNECTION_STRING: ' connection ',
          OTEL_SERVICE_NAME: role,
          COMMIT_SHA: ' abc ',
        },
        load,
      );
      const options = useAzureMonitor.mock.calls[0][0];
      expect(options.azureMonitorExporterOptions.connectionString).toBe(
        'connection',
      );
      expect(options.resource.attributes).toMatchObject({
        'service.name': role,
        'service.namespace': '',
        'service.version': 'abc',
      });
      expect(options.instrumentationOptions).toMatchObject({
        http: { enabled: true },
        postgreSql: { enabled: true },
        bunyan: { enabled: false },
        winston: { enabled: false },
      });
      await stop?.();
      expect(shutdownAzureMonitor).toHaveBeenCalledTimes(1);
    },
  );
});
