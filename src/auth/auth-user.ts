import type { Request } from 'express';
import type { Rol } from '../generated/prisma/enums';

export interface AuthUser {
  id: number;
  rol: Rol;
}

export type AuthRequest = Request & { user: AuthUser };
