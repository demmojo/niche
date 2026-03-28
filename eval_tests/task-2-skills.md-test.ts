import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Task 2: Skill Execution & Linting', () => {
  it('should pass linter and type-checker', () => {
    try {
      // Run the linter as configured in package.json from the project root
      execSync('npm run lint', { 
        stdio: 'pipe', 
        cwd: path.resolve(__dirname, '../../') 
      });
      expect(true).toBe(true);
    } catch (error: any) {
      expect.fail(`Linting failed: ${error.message}\n${error.stdout?.toString()}`);
    }
  });
});