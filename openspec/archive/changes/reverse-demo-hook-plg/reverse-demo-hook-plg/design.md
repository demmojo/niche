# Design: Reverse Demo Hook PLG & Enterprise ML Integration

## Context

The recent "Enterprise ML Orchestration" rollout introduced heavy BullMQ workers that conflict with the "Reverse Demo Hook PLG" UI components. The existing PLG implementation implicitly trusts frontend chains, triggering unbounded compute and dangerous data merging techniques.

## Goals

- Stop Pro-Tier compute bypasses (Denial of Wallet).
- Resolve React 19 "Snapshot Beats the Fetch" crashes during auth merge.
- Guarantee robust Firestore data reparenting regardless of data size.

## Non-Goals

- Redesigning the underlying Enterprise ML Orchestration logic.
- Modifying the initial tarpit/Lite analysis algorithm.

## Decisions

- **Client-Side Gate**: We will explicitly halt the PLG funnel at the "Generate Full Campaign" CTA, displaying the `PQLGateModal.tsx` for unauthenticated users.
- **Optimistic State Freeze**: Using a mutable ref (`isMergingRef.current = true`), we will lock the React state transition from anonymous to permanent until a `200 OK` is returned by the merge endpoint.
- **Chunked Data Migration**: Backend document reparenting will loop `WriteBatch` operations bounded by `.limit(500)` to respect Firestore transaction limits.

## Risks & Trade-offs

- **Non-Atomic Migration**: Chunked batching is not strictly atomic. If a batch fails midway, partial reparenting occurs. This trade-off is accepted as single transactions fundamentally fail at >500 documents. Future mitigation may require tombstone tracking.

## Future Potential

The PQL Gate architecture sets the foundation for expanding into enterprise SSO hooks or usage-based billing checks prior to worker enqueueing.
