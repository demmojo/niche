# RFC v10: LangSmith Multiplexing Protocol (Data Plane Adversarial Resilience)

**Author:** Best Practices Researcher AI  
**Date:** April 11, 2026  
**Status:** Proposed  
**Supersedes:** RFC v9 (Failed during adversarial audit)

## 1. Abstract

The LangSmith Multiplexing Protocol relies on a high-throughput Data Plane to ingest large analytic payloads. In RFC v9, the use of standard Pre-Signed PUT URLs exposed the system to four critical adversarial vectors: Cryptographic Quota Exhaustion, Financial Denial of Wallet (DoW), Phantom Claim Checks, and Data Plane Slowloris.

RFC v10 completely revamps the Data Plane architecture to a Zero-Trust, Event-Driven model. By moving from Presigned PUT to cryptographically bounded Presigned POST policies, implementing strict stateful URL quotas, and abolishing client-signaled claim checks in favor of infrastructure-level event notifications, this design conclusively closes all identified adversarial gaps.

---

## 2. Background & Problem Statement

During the security audit of RFC v9, the "Ripcord Audit Gate" identified four severe vulnerabilities in the Data Plane's ingest pipeline:

1. **Cryptographic Quota Exhaustion:** Attackers could continuously call the URL generation endpoint, farming valid cryptographic signatures and exhausting API rate limits, allowing them to hoard URLs for coordinated bursts.
2. **Financial DoW (Denial of Wallet):** Standard Presigned PUT requests do not cryptographically enforce maximum file sizes. An attacker could upload a 5TB file to a URL intended for a 5MB payload, incurring massive AWS/GCP storage and egress costs.
3. **Phantom Claim Checks:** The protocol relied on the client to signal the backend (via a webhook/API call) that the payload was uploaded. Attackers could send this signal _without_ uploading anything, forcing backend workers into infinite polling loops waiting for non-existent files, leading to Worker Starvation.
4. **Data Plane Slowloris:** Malicious clients could initiate a valid upload but trickle bytes at 1 byte per second. This exhausted connection pools and kept infrastructure resources locked indefinitely.

---

## 3. Architecture Overview

To resolve these vulnerabilities, RFC v10 implements a deterministic, infrastructure-enforced perimeter. The client is completely untrusted and has zero ability to dictate worker invocation or bypass payload boundaries.

### 3.1. High-Level Flow

1. **Request:** Client requests a payload upload token.
2. **Quota Check:** System verifies the active sandbox URL quota (Max: 5).
3. **Issue POST Policy:** System returns an AWS S3 Presigned POST (or GCP Signed Policy Document) containing strict cryptographic limits (Size, TTL).
4. **Upload:** Client uploads directly to the Storage bucket. The Cloud Edge strictly enforces the POST policy and connection timeouts.
5. **Infrastructure Event:** Upon successful write to disk, the Storage Bucket emits an `ObjectCreated` event to an Event Bus (SQS / GCP PubSub).
6. **Worker Invocation:** The Event Bus triggers the Cloud Run worker, passing the finalized Object URI.

---

## 4. Detailed Design: The Four Pillars of Resilience

### 4.1. Cryptographic Bounds (Presigned POST)

Standard Presigned PUTs only validate the URL signature, not the payload properties. RFC v10 transitions exclusively to **Presigned POST Policies**.

- **Mechanism:** The backend generates a Base64-encoded policy document and signs it. The client MUST use a `multipart/form-data` POST request.
- **`content-length-range`:** The policy explicitly defines `["content-length-range", 1048576, 524288000]` (1MB to 500MB). If the client attempts to upload 500.1MB, the Cloud Storage Edge drops the connection with a `400 Bad Request` _before_ it hits the storage ledger.
- **Short Expirations:** The policy includes an `X-Amz-Expires` (or equivalent) strictly clamped to **300 seconds (5 minutes)**.

### 4.2. Quota Enforcement (Active Sandbox Limits)

To prevent URL farming and Quota Exhaustion, we implement a Stateful Token Bucket per Sandbox.

- **Mechanism:** We enforce a strict limit of **5 active (pending) URLs per sandbox**.
- **Implementation:** Utilizing a Redis `INCR` (or a Firestore Distributed Sharded Counter, as per our NicheAI workspace rules for high-frequency writes).
- **Lifecycle:**
  - URL Request increments the counter.
  - A TTL is applied to the counter matching the 5-minute URL expiration.
  - Once the infrastructure event (upload success) fires, or the 5 minutes expire, the counter is decremented. If a client hits 5, further URL generation requests return `429 Too Many Requests`.

### 4.3. Event-Driven Processing (Abolishing Client-Signaled Claims)

Client-signaled claim checks violate the Zero-Trust boundary. An attacker cannot be trusted to accurately report upload completion.

- **Mechanism:** We completely remove the REST endpoint for `/api/claims/signal`.
- **Infrastructure Flow:**
  - Storage Bucket is configured with Event Notifications (`s3:ObjectCreated:Post` or `google.storage.object.finalize`).
  - Event pushes to a message queue (AWS SQS or GCP Pub/Sub) acting as a PauseQueue.
  - The queue asynchronously triggers the Cloud Run worker endpoint.
- **Impact:** The worker is **only** invoked if the file exists safely on disk. Phantom claim checks are now mathematically impossible. Worker starvation is eliminated because workers no longer poll; they process deterministically.

### 4.4. Edge Timeouts (Data Plane Slowloris Mitigation)

While Presigned POST policies block massive payloads, attackers can still try to hold connections open by trickling data within the allowed 500MB limit.

- **Mechanism:** Enforce strict cloud-edge HTTP transfer timeouts.
- **Implementation:**
  - **Storage Edge:** Rely on native S3/GCS protections which drop connections that fail to maintain a minimum throughput.
  - **WAF / Ingress:** If utilizing Cloudflare or a custom ingress, configure `client_header_timeout`, `client_body_timeout`, and establish a hard `minimum_bytes_per_second` rule (e.g., 100 KB/s).
  - **Time-to-Live:** The Presigned URL 5-minute expiration acts as a hard boundary for the _initiation_ of the request. Furthermore, the ingress proxy will sever any upload taking longer than a globally defined max duration (e.g., 15 minutes absolute timeout).

---

## 5. Security Posture & Verification

| Threat Vector         | RFC v9 Status | RFC v10 Status | Mechanism of Mitigation                             |
| :-------------------- | :------------ | :------------- | :-------------------------------------------------- |
| **URL Farming**       | 🔴 Vulnerable | 🟢 Mitigated   | Sharded Counter (Max 5 active URLs/sandbox).        |
| **Denial of Wallet**  | 🔴 Vulnerable | 🟢 Mitigated   | Cryptographic `content-length-range` via POST.      |
| **Worker Starvation** | 🔴 Vulnerable | 🟢 Mitigated   | Event-Driven (`ObjectCreated` -> PubSub -> Worker). |
| **Slowloris**         | 🔴 Vulnerable | 🟢 Mitigated   | Edge-level `minimum_bytes_per_second` timeouts.     |

## 6. Implementation Rollout

1. Scaffold `openspec/changes/langsmith-multiplexing-v10/`.
2. Migrate backend URL generation from `s3.getSignedUrl('putObject')` to `s3.createPresignedPost()`.
3. Provision Terraform/Pulumi rules for `ObjectCreated` EventBus triggers.
4. Delete legacy `/api/claims/signal` Express routes.
5. Update client SDKs to perform standard `multipart/form-data` uploads instead of raw binary PUTs.
