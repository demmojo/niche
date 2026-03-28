import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PageGuideModal } from '../../components/PageGuideModal';

describe('PageGuideModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <PageGuideModal isOpen={false} onClose={mockOnClose} activeTab="dashboard" />
    );
    expect(container.firstChild).toBeNull(); 
  });

  it('renders the correct guide content based on activeTab', async () => {
    render(
      <PageGuideModal isOpen={true} onClose={mockOnClose} activeTab="matrix" />
    );
    expect(await screen.findByText('Competitor Matrix')).toBeInTheDocument();
  });

  it('falls back to dashboard if tab is not found', async () => {
    render(
      <PageGuideModal isOpen={true} onClose={mockOnClose} activeTab="non-existent" />
    );
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('handles "Do not show again" checkbox properly', async () => {
    const mockOnDoNotShowAgain = vi.fn();
    render(
      <PageGuideModal 
        isOpen={true} 
        onClose={mockOnClose} 
        activeTab="dashboard" 
        onDoNotShowAgain={mockOnDoNotShowAgain} 
      />
    );

    const checkboxLabel = await screen.findByText("Don't show this guide again");
    fireEvent.click(checkboxLabel);
    
    const startButton = screen.getByText('Get Started');
    fireEvent.click(startButton);

    expect(mockOnDoNotShowAgain).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});