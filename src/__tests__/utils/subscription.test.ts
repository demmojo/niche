import { describe, it, expect } from 'vitest';
import { checkSubscriptionTier } from '../../utils/subscription';

describe('subscription utils', () => {
  it('checkSubscriptionTier always returns true for now', () => {
    expect(checkSubscriptionTier('test_action', 'free')).toBe(true);
    expect(checkSubscriptionTier('test_action', 'pro')).toBe(true);
  });
});
