## Context

The "Import Raw Data" feature uses the Gemini API to parse uploaded files and extract structured `sources` and `insights`. Gemini has excellent vision capabilities, making it ideal for parsing screenshots. We need to seamlessly integrate image support into the existing React modal without overcomplicating the UI.

## Goals / Non-Goals

**Goals:**

- Support copy-pasting images directly into the `UploadDataModal`.
- Support dragging and dropping multiple images.
- Compress large images on the client-side to save bandwidth and prevent API errors.
- Pass the compressed images to the Gemini API for analysis.

**Non-Goals:**

- Supporting PDF uploads or other complex document formats.
- Batching multiple _text_ files (text files remain 1-at-a-time).

## Decisions

**1. Combined Input State**

- **Decision**: Use a single state `files: File[]` in the modal. If a text file is dropped, it replaces the list (length 1). If images are dropped/pasted, they are appended to the list (up to a max of 5-10 images).
- **Rationale**: Keeps the user experience fluid. Users don't have to explicitly choose "Image Mode" vs "Text Mode" before interacting.
- **Alternatives Considered**:
  - _Separate Tabs_: Clean, but requires an extra click and cognitive load. Rejected in favor of a smart, combined dropzone.

**2. Client-Side Compression Strategy**

- **Decision**: Use an HTML `<canvas>` to resize images before converting them to base64. Limit the max width/height (e.g., 1600px) and use a reasonable JPEG/WebP quality (e.g., 0.8).
- **Rationale**: Adding heavy third-party libraries like `browser-image-compression` is overkill when a simple Canvas helper function can achieve the same result in ~30 lines of code. It ensures we don't blow up the Gemini API payload limits.

**3. Paste Event Handling**

- **Decision**: Attach an `onPaste` event listener to the modal's container element (or use a global listener that only acts when the modal is open).
- **Rationale**: Users expect `Ctrl+V` or `Cmd+V` to "just work" when a modal is focused.

## Risks / Trade-offs

- **Risk: Payload Size Exceeding Gemini Limits** -> Images, even compressed, can be large.
- **Mitigation**: We will hard-limit the number of images per batch (e.g., max 5 images) and aggressively compress them to max 1600px dimensions.
