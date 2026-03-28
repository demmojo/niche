## Context

System logs provide visibility into internal actions but currently expose our technology stack. They can also take up a significant amount of vertical space when JSON API Call Details are expanded by default. Obfuscating names and collapsing details will resolve these issues.

## Goals / Non-Goals

**Goals:**

- Hide proprietary AI and search tool names behind generic action labels.
- Provide a cleaner, collapsible UI for API Call Details and Context Data.
- Retain the raw data format in the logs themselves (stored in the system/database) for diagnostic purposes.

**Non-Goals:**

- Modify the backend system or the `addLog` function to stop generating specific tool names.
- Replace the logging system entirely.

## Decisions

**1. Client-Side Label Mapping**

- **Decision**: Map action names using a `getGenericLabel` function in `src/App.tsx`.
- **Rationale**: Keeps the actual stored logs detailed while obfuscating the UI, preventing exposing the stack.
- **Alternatives Considered**:
  - _Backend modification_: Modify the `addLog` function to use generic names instead. Rejected because this removes diagnostic details from the logs.

**2. Native HTML `<details>` element**

- **Decision**: Use `<details>` and `<summary>` elements for the JSON accordion.
- **Rationale**: Native HTML elements provide built-in accordion functionality without the need for additional React state or complex conditional rendering logic.
- **Alternatives Considered**:
  - _Custom React Component with state_: Managing expanded/collapsed states in a React component requires more overhead and makes the code slightly more complex.

## Risks / Trade-offs

- **Risk: Styling inconsistencies** -> Using native HTML elements might look slightly different across browsers.
- **Mitigation**: Add basic styling with Tailwind CSS to ensure a consistent look.
