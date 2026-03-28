## Why

> **NOTICE:** This spec has been **superseded** by `raw-data-image-storage`.

Users often gather competitive intelligence through visual means, such as screenshots of competitor products, pricing pages, or marketing materials. Currently, the "Import Raw Data" modal only supports text-based files (TXT, CSV, JSON, Markdown). Forcing users to manually extract text from images introduces friction. Adding support for image uploads, drag-and-drop, and copy-paste will drastically improve the data ingestion experience.

## What Changes

The `UploadDataModal` will be extended to accept image files (`.jpg`, `.jpeg`, `.png`, `.webp`). Users will be able to paste images directly from their clipboard into the modal. The UI will support batching multiple images into a single AI analysis request, while maintaining the single-file restriction for text files. Client-side image compression will be added to ensure the payloads sent to the Gemini API remain performant and within limits.

## Capabilities

### New Capabilities

- `image-upload`: Users can select, drag-and-drop, or paste multiple image files into the raw data import modal.
- `client-side-compression`: Images are automatically downscaled/compressed in the browser before being sent to the AI.

### Modified Capabilities

- `raw-data-analysis`: The Gemini API integration will be updated to accept multi-modal inputs (text + inline image data) when extracting strategic insights and sources.

## Impact

- `src/components/UploadDataModal.tsx`: Significant UI and state changes to handle a list of files, paste events, and conditional rendering for images vs. text.
- `src/utils/aiClient.ts` / `src/components/UploadDataModal.tsx` (API Call): The prompt execution logic will be updated to format images as `inlineData` for the `@google/genai` client.
