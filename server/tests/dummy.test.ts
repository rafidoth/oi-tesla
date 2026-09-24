import { describe, it, expect } from 'vitest';

describe('Server Setup', () => {
  it('should verify basic arithmetic: 1 + 1 === 2', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify that NODE_ENV can be read', () => {
    const nodeEnv = process.env.NODE_ENV;
    expect(nodeEnv).toBeDefined();
    expect(typeof nodeEnv).toBe('string');
  });
});
