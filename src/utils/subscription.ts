import { SubscriptionTier } from '../types';

export const checkSubscriptionTier = (action: string, tier: SubscriptionTier = 'free'): boolean => {
  // Currently always returning true to act as a stub.
  // In the future, logic could check if action === 'export' and tier !== 'free', etc.
  console.log(`Checking subscription for action: ${action} with tier: ${tier}`);
  return true;
};
