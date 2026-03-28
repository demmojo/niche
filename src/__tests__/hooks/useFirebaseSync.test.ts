import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFirebaseSync } from '../../src/hooks/useFirebaseSync';

// Mock dependencies
const mockDoc = vi.fn();
const mockSetDoc = vi.fn(() => Promise.resolve());
let mockOnSnapshotCallback: any;
let mockOnSnapshotErrorCallback: any;

const mockOnSnapshot = vi.fn((_docRef, onNext, onError) => {
  mockOnSnapshotCallback = onNext;
  mockOnSnapshotErrorCallback = onError;
  return vi.fn(); // unsubscribe function
});

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  onSnapshot: mockOnSnapshot,
  getDoc: vi.fn(),
}));

const mockSafeDisableNetwork = vi.fn();

vi.mock('../../src/firebase', () => ({
  db: {},
  safeDisableNetwork: mockSafeDisableNetwork,
}));

const mockUseAuth = vi.fn();
vi.mock('../../src/components/AuthProvider', () => ({
  useAuth: mockUseAuth,
}));

describe('useFirebaseSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSnapshotCallback = undefined;
    mockOnSnapshotErrorCallback = undefined;
  });

  it('returns initial value when no user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null });
    
    const { result } = renderHook(() => useFirebaseSync('test-key', 'initial'));
    
    expect(result.current[0]).toBe('initial');
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('sets up listener when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
    mockDoc.mockReturnValue('mock-doc-ref');
    
    const { result } = renderHook(() => useFirebaseSync('test-key', 'initial'));
    
    expect(mockOnSnapshot).toHaveBeenCalled();
    expect(mockDoc).toHaveBeenCalledWith({}, 'users', 'user123', 'appData', 'test-key');
    
    // Simulate snapshot where doc does not exist
    act(() => {
      mockOnSnapshotCallback({ exists: () => false });
    });
    
    expect(mockSetDoc).toHaveBeenCalledWith('mock-doc-ref', { value: 'initial' }, { merge: true });
    expect(result.current[0]).toBe('initial');
  });

  it('updates state when snapshot contains data', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
    
    const { result } = renderHook(() => useFirebaseSync('test-key', 'initial'));
    
    act(() => {
      mockOnSnapshotCallback({ 
        exists: () => true,
        data: () => ({ value: 'remote-value' })
      });
    });
    
    expect(result.current[0]).toBe('remote-value');
  });

  it('updates value locally and syncs to firebase', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
    
    const { result } = renderHook(() => useFirebaseSync('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new-value');
    });
    
    expect(result.current[0]).toBe('new-value');
    expect(mockSetDoc).toHaveBeenCalledWith(undefined, { value: 'new-value' }, { merge: true });
    
    // Simulate snapshot coming back from our own write (should be ignored due to isLocalUpdate)
    act(() => {
      mockOnSnapshotCallback({ 
        exists: () => true,
        data: () => ({ value: 'new-value' })
      });
    });
    
    // State remains unchanged
    expect(result.current[0]).toBe('new-value');
  });

  it('handles functional state updates', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
    
    const { result } = renderHook(() => useFirebaseSync<number>('test-key', 0));
    
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    expect(mockSetDoc).toHaveBeenCalledWith(undefined, { value: 1 }, { merge: true });
  });

  it('handles undefined values by saving them as null', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
    
    const { result } = renderHook(() => useFirebaseSync<string | undefined>('test-key', undefined));
    
    act(() => {
      mockOnSnapshotCallback({ exists: () => false });
    });
    
    expect(mockSetDoc).toHaveBeenCalledWith(undefined, { value: null }, { merge: true });
    
    act(() => {
      result.current[1](undefined);
    });
    
    expect(mockSetDoc).toHaveBeenCalledWith(undefined, { value: null }, { merge: true });
  });

  it('handles network errors by disabling network safely', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
    
    // Mock setDoc to throw resource-exhausted
    mockSetDoc.mockRejectedValueOnce({ code: 'resource-exhausted' });
    
    const { result } = renderHook(() => useFirebaseSync('test-key', 'initial'));
    
    // Trigger setDoc failure in snapshot initialization
    await act(async () => {
      mockOnSnapshotCallback({ exists: () => false });
      await new Promise(resolve => setTimeout(resolve, 0)); // wait for promise rejection
    });
    
    expect(mockSafeDisableNetwork).toHaveBeenCalled();
    
    // Mock setDoc failure for manual update
    mockSetDoc.mockRejectedValueOnce({ code: 'resource-exhausted' });
    
    await act(async () => {
      result.current[1]('fail-value');
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(mockSafeDisableNetwork).toHaveBeenCalledTimes(2);
  });

  it('handles snapshot errors gracefully', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'user123' } });
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderHook(() => useFirebaseSync('test-key', 'initial'));
    
    act(() => {
      mockOnSnapshotErrorCallback({ code: 'resource-exhausted', message: 'Quota exceeded' });
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Error syncing test-key from Firebase:', expect.any(Object));
    expect(mockSafeDisableNetwork).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
