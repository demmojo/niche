import { describe, it, expect, beforeEach } from 'vitest';
import { getCustomApiKey, setCustomApiKey } from '../../utils/apiKeys';

describe('apiKeys utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null if no key is set', () => {
    expect(getCustomApiKey('gemini')).toBeNull();
  });

  it('should set and get a custom API key for gemini', () => {
    setCustomApiKey('gemini', 'my-gemini-key');
    expect(getCustomApiKey('gemini')).toBe('my-gemini-key');
  });

  it('should set and get a custom API key for apollo', () => {
    setCustomApiKey('apollo', 'my-apollo-key');
    expect(getCustomApiKey('apollo')).toBe('my-apollo-key');
  });

  it('should set and get a custom API key for exa', () => {
    setCustomApiKey('exa', 'my-exa-key');
    expect(getCustomApiKey('exa')).toBe('my-exa-key');
  });

  it('should set and get a custom API key for openai', () => {
    setCustomApiKey('openai', 'my-openai-key');
    expect(getCustomApiKey('openai')).toBe('my-openai-key');
  });

  it('should set and get a custom API key for anthropic', () => {
    setCustomApiKey('anthropic', 'my-anthropic-key');
    expect(getCustomApiKey('anthropic')).toBe('my-anthropic-key');
  });

  it('should remove the key if an empty string is provided', () => {
    setCustomApiKey('gemini', 'my-gemini-key');
    expect(getCustomApiKey('gemini')).toBe('my-gemini-key');
    
    setCustomApiKey('gemini', '');
    expect(getCustomApiKey('gemini')).toBeNull();
  });
});
