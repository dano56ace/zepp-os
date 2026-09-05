import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Test Harness Smoke Test', () => {
  it('should execute basic assertions accurately', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBe(true);
    expect([1, 2, 3]).toHaveLength(3);
    expect({ framework: 'vitest', status: 'ready' }).toEqual({
      framework: 'vitest',
      status: 'ready',
    });
  });

  it('should support asynchronous operations and promises', async () => {
    const asyncOperation = async (): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('completed'), 10);
      });
    };

    const result = await asyncOperation();
    expect(result).toBe('completed');
  });

  it('should run in Node environment with access to filesystem and project paths', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.cwd).toBe('function');

    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);

    const packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    expect(packageJsonContent.scripts).toBeDefined();
    expect(packageJsonContent.scripts.test).toBe('vitest run');
  });

  it('should locate reference watchface fixtures', () => {
    const cwd = process.cwd();
    const workingFixture = path.join(
      cwd,
      'reference_watchfaces',
      'tissot_prx.amazfit_balance-283395-2d7b413023 (1).zip'
    );
    const failingFixture = path.join(
      cwd,
      'reference_watchfaces',
      'jaeger_polaris_gtr3pro-415474-bce860200c (1).zip'
    );

    expect(fs.existsSync(workingFixture)).toBe(true);
    expect(fs.existsSync(failingFixture)).toBe(true);
  });
});
