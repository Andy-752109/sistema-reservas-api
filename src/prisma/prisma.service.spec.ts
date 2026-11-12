import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService: ciclo de vida sin conexión real', () => {
  let service: PrismaService;

  beforeEach(() => {
    const config = {
      getOrThrow: () => 'postgresql://unused:unused@127.0.0.1:1/unused',
    };
    service = new PrismaService(config as unknown as ConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('espera la conexión al inicializar', async () => {
    const connect = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('propaga un fallo de conexión para impedir un arranque incorrecto', async () => {
    const error = new Error('Base no disponible');
    jest.spyOn(service, '$connect').mockRejectedValue(error);
    await expect(service.onModuleInit()).rejects.toBe(error);
  });

  it('desconecta al cerrar la aplicación', async () => {
    const disconnect = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
