import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Settings } from '../../../src/components/Settings';
import * as apiKeys from '../../../src/utils/apiKeys';
import * as usageTracker from '../../../src/utils/usageTracker';

// Mock the utils
vi.mock('../../../src/utils/apiKeys', () => ({
  getCustomApiKey: vi.fn(),
  setCustomApiKey: vi.fn(),
}));

vi.mock('../../../src/utils/usageTracker', () => ({
  getUsageStats: vi.fn(),
  getResetTime: vi.fn(() => new Date()),
}));

vi.mock('../../../src/utils/aiClient', () => ({
  getSelectedModels: vi.fn(() => ['gemini-3.1-pro-preview']),
  setSelectedModels: vi.fn(),
  fetchAvailableModels: vi.fn(() => Promise.resolve([
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', provider: 'gemini' }
  ]))
}));

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiKeys.getCustomApiKey as ReturnType<typeof vi.fn>).mockImplementation((service) => {
      if (service === 'gemini') return 'mock-gemini-key';
      return null;
    });

    (usageTracker.getUsageStats as ReturnType<typeof vi.fn>).mockReturnValue({
      date: '2023-01-01',
      services: {
        gemini: {
          requests: 10,
          requestsPerModel: { 'gemini-3.1-pro-preview': 10 },
          estimatedInputTokens: 1000,
          estimatedOutputTokens: 500,
          rateLimit: { limit: 50, remaining: 40 }
        },
        apollo: {
          requests: 5,
          rateLimit: { limit: 100, remaining: 95 }
        },
        exa: {
          requests: 2,
          rateLimit: { limit: 1000, remaining: 998 }
        }
      }
    });
  });

  it('renders API Keys inputs with loaded values', async () => {
    await act(async () => {
      render(<Settings />);
    });
    
    expect(screen.getByText('API Keys (BYOK)')).toBeInTheDocument();
    
    // Check if the mock-gemini-key is prepopulated
    const geminiInput = screen.getByPlaceholderText('AIzaSy...') as HTMLInputElement;
    expect(geminiInput.value).toBe('mock-gemini-key');

    const apolloInput = screen.getAllByPlaceholderText('sk-...')[0] as HTMLInputElement;
    expect(apolloInput.value).toBe('');
  });

  it('saves custom API keys when Save Keys button is clicked', async () => {
    await act(async () => {
      render(<Settings />);
    });
    
    const apolloInput = screen.getAllByPlaceholderText('sk-...')[0] as HTMLInputElement;
    await act(async () => {
      fireEvent.change(apolloInput, { target: { value: 'new-apollo-key' } });
    });
    
    // Wait for the button to become active
    await waitFor(() => {
      expect(screen.getByText('Save Keys')).toBeInTheDocument();
    });
    
    const saveButton = screen.getByText('Save Keys');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith('gemini', 'mock-gemini-key');
    expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith('apollo', 'new-apollo-key');
  });

  it('renders the Real-time Quota Dashboard with correct limits', async () => {
    await act(async () => {
      render(<Settings />);
    });
    
    // Check text reflecting limits and remaining counts
    expect(screen.getByText('10 / 50')).toBeInTheDocument(); // Gemini
    expect(screen.getByText('5 / 100')).toBeInTheDocument(); // Apollo
    expect(screen.getByText('2 / 1000')).toBeInTheDocument(); // Exa
  });
});
