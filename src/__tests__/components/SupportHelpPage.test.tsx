import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupportHelpPage } from '../../components/SupportHelpPage';
import { collection, addDoc } from 'firebase/firestore';

vi.mock('../../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn()
}));

describe('SupportHelpPage', () => {
  const mockUser = { uid: '123', email: 'test@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default state correctly', () => {
    render(<SupportHelpPage user={mockUser} />);
    expect(screen.getByText('Support & Feedback')).toBeInTheDocument();
    expect(screen.getByText('Bug Report')).toBeInTheDocument();
  });

  it('submits feedback form correctly', async () => {
    (addDoc as any).mockResolvedValue({});
    
    render(<SupportHelpPage user={mockUser} />);
    
    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: 'This is a test message' } });
    
    const submitBtn = screen.getByText('Submit Feedback');
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });
    
    expect(screen.getByText('Thank You!')).toBeInTheDocument();
  });

  it('does not submit if message is empty', () => {
    render(<SupportHelpPage user={mockUser} />);
    
    const submitBtn = screen.getByText('Submit Feedback');
    expect(submitBtn).toBeDisabled();
    
    fireEvent.click(submitBtn);
    expect(addDoc).not.toHaveBeenCalled();
  });
});
