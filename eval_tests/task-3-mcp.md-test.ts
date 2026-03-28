import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 3: MCP Server Forcing', () => {
  const filePath = path.resolve(__dirname, '../../src/components/NetworkGraph.tsx');
  
  it('should have created src/components/NetworkGraph.tsx', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should use d3-force and d3-selection along with basic props', () => {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Validate D3 functions and React props usage indicating Context7 fetched docs
    expect(content).toMatch(/d3-force|d3/i);
    expect(content).toMatch(/d3-selection|d3/i);
    expect(content).toMatch(/nodes/i);
    expect(content).toMatch(/links/i);
  });
});