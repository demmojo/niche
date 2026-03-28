## Context

We are expanding the platform to support teams and multiple products per organization/user. To drive upgrades, we want to make these features visible to all users, but restricted based on their role/plan.

## Goals / Non-Goals

**Goals:**

- Provide superadmins the ability to add multiple products.
- Provide superadmins the ability to invite team members via email.
- Show normal users the multi-product and team features in a disabled state to drive upgrade requests.
- Keep the UI simple by reusing existing patterns (dropdowns, settings tabs).

**Non-Goals:**

- Granular role-based access control (RBAC) beyond superadmin vs. normal user.
- Complex billing integration at this stage (just a request access modal).

## Decisions

**1. Multiple Products UI**

- **Decision**: Use the existing top-nav dropdown for product switching and creation.
- **Rationale**: Keeps the UI clean and centralizes product context in a familiar location.

**2. Team Management UI**

- **Decision**: Add a "Team" tab to the existing Settings modal/page.
- **Rationale**: Settings is the standard location for account and organizational management.

**3. Upsell Experience**

- **Decision**: Show disabled controls (e.g., disabled "+ Add New Product" button, disabled Team settings) that trigger an upgrade/request modal on click.
- **Rationale**: Increases feature discoverability and acts as an organic upsell mechanism.

## Risks / Trade-offs

- **Risk: User Frustration** -> Seeing disabled features might frustrate users who expect a fully unlocked product.
- **Mitigation**: Ensure the messaging on the upgrade/request modal is polite, clear, and explains the value of the premium features.
