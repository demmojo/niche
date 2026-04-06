## Context

As NicheAI focuses on a Minimum Lovable Product (MLP) with a Reverse Demo Hook PLG strategy, the transition from onboarding (or marketing) into the core workspace must be flawless. The user complained: "when I login I see this page [ZeroFrictionEntry] but it is not clear if I logged in."

We must transition the user to the app and onboard their persona and idea in a guided way if they have not already. We need to fix the Flash of Uninitialized State (FOUS) and explicitly architect the state machine for returning users, while ensuring legacy data is safely migrated via an atomic Firestore batch. Crucially, the PLG motion must not break—pre-authentication inputs must be hydrated into the authenticated wizard.

## Goals / Non-Goals

Goals:

- Automatically bypass the full-screen marketing shell for authenticated users.
- Show the authenticated app shell immediately so users know they are logged in.
- Present a dedicated OnboardingWizard inside the app shell to capture persona and initial product idea.
- Hydrate the OnboardingWizard with pre-authentication session state (`zf_form_data` in sessionStorage) to preserve the PLG "Reverse Demo Hook" momentum.
- Implement an explicit state machine for routing.
- Migrate existing legacy data atomically using a Firestore `writeBatch` to prevent partial migration states.
- Fix integration tests (App.test.tsx) that are currently failing due to brittle legacy data keys.

Non-Goals:

- Redesigning the entire marketing shell.
- Changing the underlying authentication logic.

## Decisions

1. Dedicated OnboardingWizard vs Marketing Shell

- Decision: Stop embedding the marketing ZeroFrictionEntry natively into FounderWorkspace. Extract the core data-gathering logic into an OnboardingWizard component that renders inside the authenticated app shell.
- Rationale: ZeroFrictionEntry is a top-of-funnel component. Throwing authenticated users back into a marketing flow breaks the authenticated app illusion.

2. Pre-Authentication State Hydration

- Decision: The OnboardingWizard MUST hydrate its initial state from `sessionStorage` (`zf_form_data`) left behind by the ZeroFrictionEntry.
- Rationale: If a user engages with the Reverse Demo Hook by typing their idea on the landing page, creates an account, and is then dropped into a blank OnboardingWizard, the PLG motion is broken.

3. Consolidating the Routing State Machine

- Decision: Move routing logic into an explicit state machine that checks `isProductsInitialized === true` AND `profileLoading === false` before rendering the inner workspace. The outer shell (sidebar/header) should render immediately to show logged-in status.
- Rationale: Routing previously fractured across WorkspaceShell, FounderProvider, and FounderWorkspace created a split-brain data model.

4. Atomic Backward-Compatible Data Migration

- Decision: Implement a migration utility that reads legacy `my_product_data_`. If legacy data exists and `products` is empty, use a Firestore `writeBatch` to atomically create a new product, copy the app data, and clear the legacy doc.
- Rationale: Running sequential writes (`addDoc`, `setDoc`) inside a realtime `onSnapshot` callback is dangerous and risks infinite migration loops or duplicated products if disconnected mid-flight. Batching guarantees atomicity.

## Risks / Trade-offs

- Risk: Migration executing inside a realtime listener.
- Mitigation: By using `writeBatch`, we ensure the migration is completely atomic. Furthermore, we guard it heavily so it only attempts execution once per session.

## Future Potential & Wow Features

- Personalized Generative Entry: The OnboardingWizard can leverage the GenAI engine to pre-fill or suggest starting points based on the founder's initial intent.
