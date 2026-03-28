import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { DocumentationWizardModal } from '../../components/DocumentationWizardModal';

vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: vi.fn(),
      folder: vi.fn().mockReturnValue({ file: vi.fn() }),
      generateAsync: vi.fn().mockResolvedValue(new Blob())
    }))
  };
});

// Mock URL.createObjectURL and URL.revokeObjectURL
beforeAll(() => {
  global.URL.createObjectURL = vi.fn();
  global.URL.revokeObjectURL = vi.fn();
});

describe('DocumentationWizardModal', () => {
  const myProductData: any = {
    name: 'Test Product',
    description: 'A test product',
    targetRegions: ['US'],
    features: [{ name: 'Feature A', type: 'core', complexity: 'low' }],
    strategy: [{ content: 'Step 1' }]
  };

  const insights: any[] = [
    { id: '1', title: 'Insight A', description: 'Desc A', category: 'opportunity' }
  ];

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DocumentationWizardModal isOpen={false} onClose={vi.fn()} myProductData={myProductData} insights={insights} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly and navigates steps', async () => {
    render(
      <DocumentationWizardModal isOpen={true} onClose={vi.fn()} myProductData={myProductData} insights={insights} />
    );
    
    expect(screen.getByText('Documentation Generator')).toBeInTheDocument();
    expect(screen.getByText('Feature A')).toBeInTheDocument();
    
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);
    
    expect(screen.getByText('Insight A')).toBeInTheDocument();
    
    fireEvent.click(nextBtn);
    
    expect(screen.getByText('One-Pager')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('One-Pager'));
    const genBtn = screen.getByText('Generate Document');
    fireEvent.click(genBtn);
    
    expect(screen.getByText('Generating Documentation...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Generating Documentation...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByText(/Test Product One-Pager/i)).toBeInTheDocument();
  });
});
