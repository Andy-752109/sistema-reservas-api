import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCorsOptions } from './cors.config';

describe('Configuración CORS', () => {
  function check(
    origin: string | undefined,
    allowed = ' https://web.example.com/, http://localhost:5173, https://web.example.com, ',
  ) {
    const config = { get: () => allowed } as unknown as ConfigService;
    const policy = createCorsOptions(config).origin;
    if (typeof policy !== 'function')
      throw new Error('Se esperaba una política dinámica');
    const callback = jest.fn();
    policy(origin, callback);
    return callback.mock.lastCall as [Error | null, boolean];
  }

  it.each(['https://web.example.com', 'http://localhost:5173', undefined])(
    'permite %s y normaliza la lista configurada',
    (origin) => {
      expect(check(origin)).toEqual([null, true]);
    },
  );

  it.each([
    'https://web.example.com.attacker.test',
    'http://web.example.com',
    'http://localhost:5174',
    'null',
  ])('rechaza el origen ajeno %s', (origin) => {
    const [error, allowed] = check(origin);
    expect(error).toBeInstanceOf(ForbiddenException);
    expect(allowed).toBe(false);
  });

  it('sin lista permite clientes sin Origin y rechaza orígenes de navegador', () => {
    expect(check(undefined, '')).toEqual([null, true]);
    expect(check('http://localhost:5173', '')[0]).toBeInstanceOf(
      ForbiddenException,
    );
  });

  it.each([
    '*',
    'null',
    'ftp://web.example.com',
    'https://web.example.com/app',
    'https://web.example.com?q=1',
    'https://web.example.com#app',
    'https://usuario:clave@web.example.com',
  ])('rechaza configuración inválida %s', (allowed) => {
    const config = { get: () => allowed } as unknown as ConfigService;
    expect(() => createCorsOptions(config)).toThrow('CORS_ORIGINS');
  });

  it('usa una lista vacía si no existe la variable y configura headers JWT', () => {
    const config = {
      get: (_key: string, fallback: string) => fallback,
    } as unknown as ConfigService;
    expect(createCorsOptions(config)).toMatchObject({
      credentials: false,
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  });
});
