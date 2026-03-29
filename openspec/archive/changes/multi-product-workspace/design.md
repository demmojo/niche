## Context

A previous attempt to add multi-product support used a Python regex script (`add_product_selector.py`) to rewrite `App.tsx` and local storage keys. This bypassed the OpenSpec workflow, violated React composition principles, and risked silent data corruption. We are replacing this with a standard React 19 Context architecture.

## Goals / Non-Goals

**Goals:**

- Implement `<WorkspaceStateContext>` and `<WorkspaceDispatchContext>` using React 19 Context API to manage the active product state without re-render cascades.
- Abstract superadmin bootstrapping (`prod-kageform` default) into `useSuperadminBootstrap`, strictly gated by backend-verified Firebase Custom Claims.
- Prevent state bleed between products using `AbortController` and namespaced cache keys.
- Prevent Insecure Direct Object Reference (IDOR) by enforcing backend/Firestore Row-Level Security.

**Non-Goals:**

- Implementing a full RBAC (Role-Based Access Control) system for team members within a workspace (deferred).
- Refactoring the entire routing system to be strictly URL-based (slugs) in this specific spec (deferred to future, but Context must support it).

## Decisions

**1. Use React Context over Zustand**

- **Decision**: We will use React 19's native Context API (using `<Context>` directly instead of `.Provider`, and utilizing the `use()` hook where appropriate).
- **Rationale**: Workspace switching is a low-frequency action. Context avoids introducing new third-party dependencies (aligning with our MLP philosophy) and perfectly handles scoped state and dependency injection for testing.
- **Alternatives Considered**:
  - _Zustand_: Rejected because it introduces global singleton state which makes rendering multiple distinct workspaces on the same screen (e.g., comparison views) difficult.
  - _Regex Script Injection_: Rejected due to catastrophic brittleness, AST-ignorance, and lack of type safety.

**2. Isolate Superadmin Logic & Secure the Network**

- **Decision**: Extract superadmin logic into `useSuperadminBootstrap`. Ensure the client does not spoof privileges.
- **Rationale**: `App.tsx` should not contain hardcoded business logic. Furthermore, client-side email checks (`mo.hassaniv@gmail.com`) are vulnerable to manipulation. All superadmin capabilities must be verified via Firebase Custom Claims (`token.claims.superadmin === true`).

## Risks / Trade-offs

- **Risk: Snapshot Beats the Fetch Race Conditions** -> If a user switches workspaces while a network request is in flight, the UI might render data for the wrong workspace.
- **Mitigation (Immediate)**: We will implement an `AbortController` pattern tied to `activeProductId`. When the ID changes, pending network requests will be aborted. Furthermore, data fetching tools must strictly use `activeProductId` as part of their cache keys (e.g. `['insights', activeProductId]`).
- **Risk: Cross-Tenant Data Bleed (IDOR)** -> Client-side context is untrusted.
- **Mitigation (Immediate)**: All API routes and Firestore rules must independently verify that `req.user.uid` is authorized for the requested `activeProductId`.

## Future Potential & Wow Features

- **URL-First Workspace Routing**: Transition from hidden global state to URL-driven workspaces (e.g., `/[workspaceId]/dashboard`) to enable deep-linking and eliminate tab-sync split-brain issues.
- **Formal RBAC System**: Deprecate the hardcoded `useSuperadminBootstrap` hook once a formal Organization/Tenant RBAC structure is fully implemented.
