# Multi-Product and Team Capabilities

## What We're Building

UI for multi-product and team capabilities.

## Why This Approach

Keep the UI simple, use the existing product dropdown and add a new "Team" settings section.

## Key Decisions

1. **Multiple Products**: Use the existing top-nav dropdown. Superadmin sees "+ Add New Product". Normal user sees a disabled "+ Add New Product" that opens an upgrade/request modal when clicked.
2. **Team Capabilities**: Add a "Team" tab to Settings. Superadmin can invite users via email. Normal user sees the Team tab but everything is disabled, with a button to request access.

## Open Questions

None.
