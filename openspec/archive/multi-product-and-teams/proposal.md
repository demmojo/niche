## Why

Users need the ability to manage multiple products and collaborate with their teams within the application. We also want to expose these capabilities as premium features, meaning normal users can discover them but must request access or upgrade, while superadmins have full access.

## What Changes

- Enhancing the existing product dropdown in the top navigation to support adding new products.
- Adding a new "Team" tab to the Settings area for user management and invitations.
- Implementing role-based UI states (superadmin vs. normal user) for these new features.

## Capabilities

### New Capabilities

- `multi-product-management`: Ability to create and switch between multiple products.
- `team-management`: Ability to invite users to a team via email and manage team members.

### Modified Capabilities

- `product-dropdown`: Updated to include "+ Add New Product" action.
- `settings-navigation`: Updated to include a "Team" tab.

## Impact

- Top navigation component (product dropdown).
- Settings page and its routing/tabs.
- User and Product data models (to support relationships and permissions).
- UI modal system (for upgrade/request access modals).
