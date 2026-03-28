# Proposal: Codebase Bug Hunt and Test Quality Review

## Why

As NicheAI prepares for a major version release following the addition of many new features, there is a risk of undiscovered bugs, regressions, and technical debt. The current test suite, while extensive, has identified weaknesses: fragile DOM selectors (`getAllByText()[0]`), heavy mocking of Firebase/Firestore leaving integration gaps, over-suppression of console errors hiding React lifecycle warnings, and missing explicit coverage gates.

## What Changes

A comprehensive, structured review of the entire NicheAI codebase to discover latent bugs, improve test quality, and ensure system robustness. This initiative leverages machine learning engineering best practices to automate and scale the QA process.

## Capabilities

- **Test Fixture Capture**: Capture real data samples from API/DB boundaries to create concrete static test fixtures instead of overly mocked tests.
- **Commit Bisection Debugging**: Wrap automated `git bisect` with test scripts to find culprit commits in O(log n) time when dealing with regressions.
- **Simplicity First (YAGNI)**: Avoid complex custom AST-based code generators. Write tests manually for critical missing coverage and use static hardcoded JSON fixtures over live record-replay MSW proxies.

## Impact

- Reduced context switching by analyzing domains one at a time.
- Higher test reliability by eliminating false positives/negatives in React component testing.
- Enhanced clarity and health of the test suite via strictly-typed console mock suppressions and separate environment setups.
