import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../components/AuthProvider';
import { onAuthStateChanged } from 'firebase/auth';

// 1. Mock Firebase module
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  auth: {} 
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  enableNetwork: vi.fn(),
  disableNetwork: vi.fn(),
  setLogLevel: vi.fn()
}));

vi.mock('../../src/firebase', () => ({
  auth: {},
  loginWithGoogle: vi.fn(),
  loginWithEmail: vi.fn(),
  logout: vi.fn()
}));

// 2. Create a dummy consumer to consume the context hook
const TestConsumer = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return <div>{user ? `Logged in as ${user.email}` : 'Not logged in'}</div>;
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initially shows loading state', () => {
    // Prevent the callback from firing immediately
    vi.mocked(onAuthStateChanged).mockImplementation(() => vi.fn());
    
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('updates state when a user is authenticated', async () => {
    // Immediately trigger the callback with a mock user
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback({ email: 'test@example.com' } as any);
      return vi.fn(); // Mock the unsubscribe function
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Assert the state changes from loading to authenticated
    await waitFor(() => {
      expect(screen.getByText('Logged in as test@example.com')).toBeInTheDocument();
    });
  });

  it('updates state when no user is authenticated', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(null as any);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not logged in')).toBeInTheDocument();
    });
  });
});
