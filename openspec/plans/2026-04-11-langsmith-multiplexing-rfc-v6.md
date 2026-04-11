# RFC v6: Opt-In Protocol for Structured Multiplexing with Reassembly & Memory Guardrails

**Authors:** NicheAI Engineering  
**Status:** Draft / Proposed  
**Target:** LangSmith SDK / LangChain Architecture  
**Supersedes:** RFC v5

## 1. Abstract

The LangSmith Multiplexing Protocol enables the multiplexing of multiple logical data streams over a single physical transport connection (e.g., WebSocket or TCP). Building upon the highly praised RFC v5 ("Opt-In Protocol for Structured Multiplexing with Reassembly"), RFC v6 retains the core architectural strengths while introducing deterministic **Security & Memory Guardrails**.

This revision resolves critical adversarial feedback from v5 by enforcing hard memory limits, preventing Out-of-Memory (OOM) failures caused by malicious sandboxes, dropped packets, infinite chunk streams, and lateral state exhaustion.

## 2. Motivation & Background

RFC v5 successfully introduced structured multiplexing to the LangSmith Sandbox ecosystem, addressing large payload handling through structured envelopes and out-of-band claim checks. While the protocol semantics were robust, it assumed cooperative endpoints. Adversarial reviews demonstrated that v5 lacked defensive memory constraints. A malicious or misconfigured sandbox could:

1. Stream infinite incomplete chunks, filling the client's reassembly queue.
2. Drop packets midway through a stream, leaving orphaned buffers in memory indefinitely.
3. Rapidly open thousands of streams without sending data, causing lateral state exhaustion (file descriptor and memory map depletion).

RFC v6 shifts the protocol to a zero-trust memory model. All buffers, streams, and reassembly queues are bounded by strict spatial and temporal limits.

## 3. Core Protocol (Retained from v5)

RFC v6 fully preserves the architectural advancements established in v5:

### 3.1 Strict JSON Envelope Opcode `0x1`

All control and metadata operations MUST be wrapped in a strict JSON envelope prefixed by Opcode `0x1`. This ensures predictable parsing boundaries and prevents binary payload corruption from bleeding into control frames.

### 3.2 Chunk Reassembly Logic

Stream payloads that exceed the baseline frame size are fragmented. The multiplexer reconstructs these fragments into contiguous data blocks using deterministic sequence numbers. Reassembly happens strictly in-memory up to the defined threshold, ensuring downstream consumers receive complete, cohesive objects.

### 3.3 Out-of-Band Claim Checks

For massive payloads (e.g., >100MB model weights or extensive log dumps) that would otherwise block the multiplexer, the protocol utilizes the "Claim Check" pattern. The multiplexer receives a lightweight reference (the claim check) pointing to a blob store (e.g., S3/GCS or local temporary file), preventing large payloads from starving the event loop or exhausting memory.

---

## 4. Security & Memory Guardrails (New in v6)

To guarantee client and server resilience, all LangSmith multiplexer implementations MUST enforce the following guardrails. Any violation of these limits MUST result in immediate stream termination (`RST_STREAM`) without attempting graceful recovery.

### 4.1 Max Buffer Size Limit

To prevent memory exhaustion attacks, the multiplexer enforces strict spatial constraints on both a per-stream and global level.

- **Per-Stream High-Water Mark (`high_water_mark`)**: Defaults to **1 MB**. If a stream's receive buffer hits this limit, backpressure is aggressively signaled to the sender (e.g., via Yamux window updates).
- **Global Memory Ceiling (`max_buffer_size`)**: Defaults to **50 MB** combined across all active streams.
- **Enforcement**: If the global ceiling is reached, or if a sender ignores backpressure window constraints and continues transmitting, the multiplexer MUST instantly drop the offending frame and issue a `RST_STREAM` with the error code `MEMORY_EXHAUSTED`.

### 4.2 Buffer TTL (Time-To-Live) for Orphaned Packets

Partial chunks residing in the reassembly queue pose a critical OOM risk if a connection drops, hangs, or if an adversary intentionally withholds the `EOF` frame.

- **Reassembly TTL (`chunk_reassembly_ttl`)**: Defaults to **30 seconds**.
- **Enforcement**: Every time a chunk is placed in the reassembly queue, a TTL timer is initiated or reset. If the remaining chunks required to complete the payload are not received before the TTL expires, the multiplexer MUST purge the orphaned buffer from memory and terminate the stream with a `TIMEOUT_ORPHAN` status. This prevents "slowloris-style" buffer bleeding.

### 4.3 Max Concurrent Streams Limit

Lateral state exhaustion occurs when a malicious actor opens thousands of multiplexed streams without transmitting substantial data, exhausting the runtime's internal connection tracking and memory overhead.

- **Concurrency Ceiling (`MAX_CONCURRENT_STREAMS`)**: Defaults to **100** simultaneous active streams per multiplexed connection.
- **Enforcement**: If a `SYN` (or equivalent open request) is received while the multiplexer is at the concurrency limit, the request MUST be rejected immediately with a `STREAM_REFUSED` control frame.
- **Rate Limiting (Optional but Recommended)**: Implementations MAY employ a token-bucket rate limiter for stream creation (e.g., max 10 new streams per second) to mitigate rapid open/close CPU exhaustion attacks.

## 5. Implementation Considerations

When integrating RFC v6 into the LangSmith Python and TypeScript SDKs:

- The TTL timers SHOULD be implemented using lightweight timer wheels or sweeping garbage collection rather than allocating an OS-level timer per chunk, to avoid CPU overhead.
- The Global Buffer Size must account for the V8/Python GC pause times; aggressive limit enforcement is preferable to relying on language-level garbage collection.

## 6. Conclusion

By introducing the Max Buffer Size, Buffer TTL, and Max Concurrent Streams limits, RFC v6 maintains the flexibility of structured multiplexing while providing a mathematically sound defense against memory-based denial-of-service vectors.
