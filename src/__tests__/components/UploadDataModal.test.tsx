import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadDataModal } from '../../components/UploadDataModal';
import { withKeyRotation } from '../../utils/geminiClient';

// Mock the Gemini AI client module
vi.mock('../../utils/geminiClient', () => ({
  withKeyRotation: vi.fn(),
}));

describe('UploadDataModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <UploadDataModal isOpen={false} onClose={vi.fn()} onDataAnalyzed={vi.fn()} competitors={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onDataAnalyzed with parsed AI response on successful analysis', async () => {
    const mockOnDataAnalyzed = vi.fn();
    const mockOnClose = vi.fn();
    
    // Setup fake AI response to mimic the expected schema
    vi.mocked(withKeyRotation).mockResolvedValue({
      text: JSON.stringify({ 
        newSources: [{ type: 'website', excerpt: 'Test Source' }], 
        newInsights: [{ title: 'Test Insight', description: 'desc', category: 'Pricing', impact: 'high' }] 
      })
    });

    render(
      <UploadDataModal isOpen={true} onClose={mockOnClose} onDataAnalyzed={mockOnDataAnalyzed} competitors={[]} />
    );

    // Simulate a file upload
    const file = new File(['dummy content'], 'test.csv', { type: 'text/csv' });
    
    // Get the hidden input element
    // Assuming the "input" element is hidden and can be found by type or label
    // The component has: <p className="text-ink-dark font-semibold text-lg">Click to upload or drag and drop</p>
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Assert the file was recognized
    expect(screen.getByText('test.csv')).toBeInTheDocument();

    // Click analyze
    const analyzeBtn = screen.getByText('Analyze Data');
    fireEvent.click(analyzeBtn);

    // Assert that the component transitions to a loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    // Wait for the async AI mock to resolve and fire the callback
    await waitFor(() => {
      expect(mockOnDataAnalyzed).toHaveBeenCalled();
      
      // Verify the generated structures
      const calledArgs = mockOnDataAnalyzed.mock.calls[0];
      expect(calledArgs[0][0].excerpt).toBe('Test Source');
      expect(calledArgs[0][0].source).toBe('Human');
      expect(calledArgs[1][0].title).toBe('Test Insight');
      expect(calledArgs[1][0].source).toBe('AI');
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    vi.mocked(withKeyRotation).mockRejectedValue(new Error('API failure'));

    render(
      <UploadDataModal isOpen={true} onClose={vi.fn()} onDataAnalyzed={vi.fn()} competitors={[]} />
    );

    const file = new File(['dummy content'], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const analyzeBtn = screen.getByText('Analyze Data');
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Failed to analyze file. Please try again.');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});