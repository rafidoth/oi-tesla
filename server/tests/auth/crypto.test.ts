import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/shared/wrappers/crypto.js';
import { signToken, verifyToken } from '../../src/shared/wrappers/jwt.js';
import { UnauthorizedError } from '../../src/shared/errors/UnauthorizedError.js';

describe('Crypto & Password Wrapper', () => {
  it('should hash a password and verify it correctly', () => {
    const password = 'SecretPassword123!';
    const hash = hashPassword(password);

    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[a-f0-9]+\$[a-f0-9]+$/);
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('should return false for malformed or invalid hash formats', () => {
    expect(verifyPassword('Password', '')).toBe(false);
    expect(verifyPassword('Password', 'invalid$hash')).toBe(false);
    expect(verifyPassword('Password', 'bcrypt$1234$salt$key')).toBe(false);
  });
});

describe('JWT Token Wrapper', () => {
  it('should sign and verify valid HS256 tokens', async () => {
    const payload = {
      id: 'usr_123',
      email: 'passenger@example.com',
      role: 'PASSENGER' as const,
    };

    const token = await signToken(payload, 3600);
    expect(token).toBeDefined();

    const decoded = await verifyToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should throw UnauthorizedError when token is tampered', async () => {
    const token = await signToken({
      id: 'usr_123',
      email: 'passenger@example.com',
      role: 'PASSENGER',
    });

    const [header, body] = token.split('.');
    const tampered = `${header}.${body}.invalidSignature`;

    await expect(verifyToken(tampered)).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when token is expired', async () => {
    // Expiration -10 seconds in the past
    const token = await signToken(
      {
        id: 'usr_123',
        email: 'passenger@example.com',
        role: 'PASSENGER',
      },
      -10
    );

    await expect(verifyToken(token)).rejects.toThrow(UnauthorizedError);
  });
});
