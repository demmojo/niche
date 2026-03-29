## Why

The application currently assumes a single-product experience. A script was previously used to forcefully inject multi-product selection via regex, bypassing architectural standards and risking silent data corruption. We need a native, scalable React Context architecture to support users managing multiple products/workspaces and to allow superadmins to impersonate or bootstrap default states.

## What Changes

We are introducing a native `<WorkspaceProvider>` using React Context to manage the `activeProductId` and the user's list of products. We are also extracting the privileged superadmin bootstrapping logic into a dedicated hook (`useSuperadminBootstrap`) to maintain the Single Responsibility Principle in `App.tsx`.

## Capabilities

### New Capabilities

- `multi-product-management`: Users can create and switch between multiple product workspaces.
- `workspace-context-isolation`: Safe, React-native state isolation preventing data bleed across products.
- `superadmin-bootstrapping`: Dedicated hook for handling superadmin overrides and initialization.

### Modified Capabilities

- `app-initialization`: `App.tsx` will no longer hardcode product logic but will delegate to the `WorkspaceProvider`.

## Impact

This change affects the global state management layer of the frontend. All components that previously relied on a single global product state or raw local storage keys will now consume the `useWorkspace` hook.
