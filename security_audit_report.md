# Security Audit Report: CLI Robustness Hardening Plan

**Date:** April 12, 2026
**Target:** `openspec/plans/2026-04-11-cli-robustness-hardening-plan.md`
**Auditor:** `security-sentinel`

## 1. Executive Summary

The `2026-04-11-cli-robustness-hardening-plan.md` represents a highly mature, defensively engineered architecture. It demonstrates a deep understanding of advanced application security concepts, specifically mitigating Time-of-Check to Time-of-Use (TOCTOU) races, OS command injection, Regular Expression Denial of Service (ReDoS), and Event Loop starvation.

The plan establishes a robust "Crash-Only" execution model with O(1) atomic directory swapping, securing the trust boundary. However, minor vulnerabilities were identified concerning ephemeral credential lifecycle management during unmanaged process terminations and potential environment variable inheritance.

## 2. Risk Matrix & Detailed Findings

### 2.1 Orphaned Ephemeral Credentials on SIGKILL (Medium Risk)

- **Location**: Section 4.7 & 3.8
- **Description**: The plan correctly identifies the risk of `process.env` leakage via `/proc/<pid>/environ` and proposes writing an ephemeral `.npmrc` to the local `.tmp/[UUID]/` directory with `0600` permissions. It relies on `process.on('exit')` and `process.on('SIGINT')` to unlink this file.
- **Vulnerability**: Node.js `process.on('exit')` handlers **do not execute** if the process crashes via OOM (Out of Memory) or is terminated via `SIGKILL` (e.g., from a CI orchestrator). Because the boot-time garbage collector explicitly ignores _recent_ `.tmp` directories (based on TTL), the `.npmrc` containing plaintext authentication tokens will reside on disk within the workspace until the TTL expires, exposing it to potential lateral movement or accidental commits.
- **Remediation**:
  1. Ideally, write the ephemeral `.npmrc` to an OS-level `tmpfs` partition (e.g., `/dev/shm` on Linux) where it will naturally disappear on reboot or container teardown.
  2. If it must reside in `.tmp/`, update the boot-time sweep to forcefully scrub/shred any `.npmrc` files inside `.tmp/` _immediately_ on boot, regardless of the directory's TTL.

### 2.2 Git Config Injection via Environment Variables (Low Risk)

- **Location**: Section 3.8
- **Description**: The plan meticulously strips `NPM_CONFIG_*` from the child process environment before spawning `npm`.
- **Vulnerability**: Git itself respects several dangerous environment variables (e.g., `GIT_ASKPASS`, `GIT_SSH_COMMAND`, `GIT_PROXY_COMMAND`, `GIT_EDITOR`) which can be used to achieve arbitrary command execution if an attacker can manipulate the environment before the CLI runs.
- **Remediation**: When spawning `git` processes, ensure the `env` object explicitly strips dangerous `GIT_*` environment variables, mirroring the secure treatment of `NPM_CONFIG_*`.

### 2.3 Potential Symlink Traversal in Git Status/Secret Scanning (Low Risk)

- **Location**: Section 3.7 & Task 4.2
- **Description**: The CLI parses `git diff --cached --name-only -z` to extract changed files and passes them to the Secret Scanner.
- **Vulnerability**: A malicious actor could stage a symlink that points to a sensitive file outside the workspace (e.g., `/etc/passwd`). If the Secret Scanner reads the file _through_ the symlink blindly, it could cause out-of-bounds reads or DoS.
- **Remediation**: The Secret Scanner must use `fs.promises.lstat` to verify that the staged file is a regular file before calling `fs.createReadStream`, explicitly refusing to scan symlinks, or enforcing `resolveConfinedPath` checks on the resolved symlink target.

## 3. Input Validation Analysis

The input validation mechanisms proposed in the plan are **Excellent**:

- **Command Injection**: Prevented by mandating `child_process.spawn` with `shell: false`, banning `exec`, using the `--` POSIX End-of-Options delimiter, and strictly rejecting `\0`, `\n`, `\r`, `\t` in paths.
- **Path Traversal**: Mitigated. Payload dump paths are restricted to an allowlist, dynamically generated via `fs.mkdtemp`, and bounded by the `resolveConfinedPath` utility.
- **DoS / Resource Exhaustion**: Highly resilient. The plan limits file sizes (50MB), enforces a global payload ceiling (500MB), limits file counts (25,000), implements O(1) async directory iteration, and strictly bans nested quantifiers in regex.

## 4. Auth/Authz Bypasses

Credential hygiene and isolation are **Very Strong**:

- Avoids `process.env` injection for tokens.
- Forces `--ignore-scripts`, `--userconfig`, `--globalconfig`, and `--logs-max=0` for NPM executions to prevent malicious workspace `.npmrc` overriding, post-install RCE, and debug log leaks.
- Validates `NPM_CONFIG_PROXY` schemes against `http`/`https` to prevent SSRF or workspace proxy hijacking.

## 5. OWASP Top 10 Compliance Check

The plan exhibits strong alignment with OWASP principles:

- [x] **A01: Broken Access Control** - Mitigated by `resolveConfinedPath` and `0700` sandbox generation.
- [x] **A02: Cryptographic Failures** - Addressed via fast native Secret Scanning prior to atomic swap.
- [x] **A03: Injection** - Mitigated by strict `spawn` execution, positional arguments, and `--` delimiter enforcement.
- [x] **A04: Insecure Design** - Proactively addressed via robust "Crash-Only" methodology and Idempotent Auto-Recovery.
- [x] **A05: Security Misconfiguration** - Mitigated by opting into secure defaults (`--ignore-scripts`).
- [x] **A08: Software and Data Integrity Failures** - Exceptionally well-handled. Mitigated by direct stream-to-Git-object injection (`git hash-object -w --stdin`), explicitly closing the TOCTOU gap between hash validation and index updating.

## 6. Actionable Output

1. **Address SIGKILL Credential Risk**: Update the plan to account for `.npmrc` persistence after a `SIGKILL` by adding a mandatory `.npmrc` cleanup phase to the asynchronous boot-time sweep that ignores TTL restrictions.
2. **Sanitize Git Env Vars**: Add a requirement to strip dangerous `GIT_*` execution variables from spawned git subprocesses.
3. **Handle Symlinks in Scanner**: Specify that the Secret Scanner must use `lstat` to ignore symlinks.
