import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportButton from '../../components/ExportButton';
import { checkSubscriptionTier } from '../../utils/subscription';

vi.mock('../../utils/subscription', () => ({
  checkSubscriptionTier: vi.fn()
}));

describe('ExportButton', () => {
  it('renders correctly', () => {
    render(<ExportButton onExport={vi.fn()} />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('calls onExport when clicked and subscription allows', () => {
    (checkSubscriptionTier as any).mockReturnValue(true);
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} />);
    
    fireEvent.click(screen.getByText('Export'));
    
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it('does not call onExport when subscription denies', () => {
    (checkSubscriptionTier as any).mockReturnValue(false);
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} />);
    
    fireEvent.click(screen.getByText('Export'));
    
    expect(onExport).not.toHaveBeenCalled();
  });
});
