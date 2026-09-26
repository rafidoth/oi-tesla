import crypto from 'node:crypto';

const N = 16384;
const r = 8;
const p = 1;
const keyLen = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, keyLen, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 6) {
    return false;
  }

  const [, nStr, rStr, pStr, salt, expectedHex] = parts;
  const costN = parseInt(nStr, 10);
  const blockSizeR = parseInt(rStr, 10);
  const parallelP = parseInt(pStr, 10);

  if (isNaN(costN) || isNaN(blockSizeR) || isNaN(parallelP) || !salt || !expectedHex) {
    return false;
  }

  try {
    const derivedKey = crypto.scryptSync(password, salt, expectedHex.length / 2, {
      N: costN,
      r: blockSizeR,
      p: parallelP,
    });

    const derivedHex = derivedKey.toString('hex');
    if (derivedHex.length !== expectedHex.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(derivedHex, 'utf8'),
      Buffer.from(expectedHex, 'utf8')
    );
  } catch {
    return false;
  }
}
