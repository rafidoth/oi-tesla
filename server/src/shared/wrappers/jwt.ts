import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';

export interface JwtUserPayload {
  id: string;
  email: string;
  role: 'PASSENGER' | 'DRIVER';
}

export interface JwtPayload extends JwtUserPayload {
  iat?: number;
  exp?: number;
}

const getSecretKey = (secret: string = env.JWT_SECRET) => new TextEncoder().encode(secret);

export async function signToken(
  payload: JwtUserPayload,
  expiresInSeconds: number = env.JWT_EXPIRES_IN_SECONDS,
  secret: string = env.JWT_SECRET
): Promise<string> {
  const secretKey = getSecretKey(secret);
  const now = Math.floor(Date.now() / 1000);

  return await new SignJWT({
    id: payload.id,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(secretKey);
}


export async function verifyToken(
  token: string,
  secret: string = env.JWT_SECRET
): Promise<JwtPayload> {
  if (!token) {
    throw new UnauthorizedError('UNAUTHENTICATED', 'Missing authentication token');
  }

  try {
    const secretKey = getSecretKey(secret);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as 'PASSENGER' | 'DRIVER',
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new UnauthorizedError('UNAUTHENTICATED', 'Authentication token has expired');
    }
    throw new UnauthorizedError('UNAUTHENTICATED', 'Invalid or expired token');
  }
}
