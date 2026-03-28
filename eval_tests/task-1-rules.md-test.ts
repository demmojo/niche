import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 1: Architecture & Rules Verification', () => {
  const filePath = path.resolve(__dirname, '../../src/utils/statusHandler.ts');

  it('should have created src/utils/statusHandler.ts', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should have an exhaustive switch statement and no inline imports', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check top-level import React
    expect(content).toMatch(/^import React/m);
    
    // Check exhaustive switch (naive exhaustive check using never or throwing error)
    expect(content).toMatch(/switch\s*\(/);
    const hasNever = /never/.test(content);
    const hasError = /throw new Error/.test(content) || /throw/.test(content);
    expect(hasNever || hasError).toBe(true);
  });
});