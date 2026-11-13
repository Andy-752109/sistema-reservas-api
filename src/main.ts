import 'dotenv/config';
import { initializeTelemetry } from './telemetry';

async function bootstrap() {
  const shutdownTelemetry = await initializeTelemetry();
  try {
    // Load Nest and PostgreSQL only after their instrumentation is registered.
    const { startApplication } = await import('./bootstrap.js');
    await startApplication(shutdownTelemetry);
  } catch (error) {
    await shutdownTelemetry?.();
    throw error;
  }
}
void bootstrap().catch((error: unknown) => {
  console.error(
    'No se pudo iniciar la API. Revisa la configuracion del entorno.',
    error instanceof Error ? error.message : 'Error desconocido',
  );
  process.exitCode = 1;
});
