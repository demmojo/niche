import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAvailableModels, getSelectedModels, setSelectedModels, withModelFallback } from '../../utils/aiClient';
import * as apiKeys from '../../utils/apiKeys';

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      models: {
        list: vi.fn().mockResolvedValue({
          data: [{ id: 'gpt-4o' }]
        })
      },
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked OpenAI response' } }]
          })
        }
      }
    }))
  };
});

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Mocked Anthropic response' }]
        })
      }
    }))
  };
});

describe('aiClient', () => {
  let mockKeys: Record<string, string> = {};

  beforeEach(() => {
    localStorage.clear();
    mockKeys = {};
    vi.spyOn(apiKeys, 'getCustomApiKey').mockImplementation((provider: string) => mockKeys[provider] || null);
    vi.clearAllMocks();
  });

  it('getSelectedModels returns default gemini model', () => {
    expect(getSelectedModels()).toEqual(['gemini-3.1-flash-preview']);
  });

  it('setSelectedModels and getSelectedModels work together', () => {
    setSelectedModels(['gpt-4o', 'claude-3-opus-20240229']);
    expect(getSelectedModels()).toEqual(['gpt-4o', 'claude-3-opus-20240229']);
  });

  it('fetchAvailableModels returns base gemini models by default', async () => {
    const models = await fetchAvailableModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models.some(m => m.provider === 'gemini')).toBe(true);
    expect(models.some(m => m.provider === 'openai')).toBe(false);
  });

  it('fetchAvailableModels returns openai models when key is present', async () => {
    mockKeys['openai'] = 'test-key';
    const models = await fetchAvailableModels();
    expect(models.some(m => m.provider === 'openai' && m.id === 'gpt-4o')).toBe(true);
  });

  it('fetchAvailableModels returns anthropic models when key is present', async () => {
    mockKeys['anthropic'] = 'test-key';
    const models = await fetchAvailableModels();
    expect(models.some(m => m.provider === 'anthropic')).toBe(true);
  });

  it('withModelFallback uses primary model if successful', async () => {
    mockKeys['openai'] = 'test-key';
    setSelectedModels(['gpt-4o']);
    
    const mockOperation = vi.fn().mockResolvedValue('success');
    const result = await withModelFallback(mockOperation);
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOperation).toHaveBeenCalledWith(expect.anything(), 'gpt-4o');
  });

  it('withModelFallback falls back if primary model fails with rate limit', async () => {
    mockKeys['openai'] = 'test-key';
    mockKeys['anthropic'] = 'test-key2';
    setSelectedModels(['gpt-4o', 'claude-3-5-sonnet-20241022']);
    
    const rateLimitError = new Error('429 Rate Limit Exceeded');
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce('success2');
      
    const result = await withModelFallback(mockOperation);
    
    expect(result).toBe('success2');
    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect(mockOperation).toHaveBeenNthCalledWith(1, expect.anything(), 'gpt-4o');
    expect(mockOperation).toHaveBeenNthCalledWith(2, expect.anything(), 'claude-3-5-sonnet-20241022');
  });

  it('withModelFallback throws if all models fail', async () => {
    mockKeys['openai'] = 'test-key';
    setSelectedModels(['gpt-4o']);
    
    const rateLimitError = new Error('429 Rate Limit Exceeded');
    const mockOperation = vi.fn().mockRejectedValue(rateLimitError);
      
    await expect(withModelFallback(mockOperation)).rejects.toThrow(/RateLimit/);
  });
});
