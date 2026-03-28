# Brainstorm: Image and Screenshot Import

**Date:** 2026-03-19

## What We're Building

We are extending the existing "Import Raw Data" modal (`UploadDataModal.tsx`) to support image uploads. Users will be able to drag-and-drop or copy-paste screenshots and images directly into the modal for AI analysis. The modal will handle multiple images simultaneously, batching them into a single request, while text files remain restricted to single uploads. Client-side compression will be applied to images to optimize API requests.

## Why This Approach

By extending the existing state instead of creating separate tabs, we maintain a seamless, single-step user experience. The user can simply drop or paste what they have without worrying about pre-selecting a mode. Client-side compression ensures that high-resolution screenshots don't exceed API limits or cause slow uploads, which is a modern best practice.

## Key Decisions

- **Combined Input:** The dropzone and paste handler will accept both text files and images. If a text file is added, it replaces any existing file. If images are added, they accumulate in a list (up to a reasonable limit, e.g., 5-10).
- **Batch Processing:** All uploaded images will be sent together in a single prompt to the Gemini API (`inlineData` parts) to extract consolidated insights.
- **Client-Side Compression:** A lightweight utility (e.g., HTML Canvas resizing) will compress large images before converting them to base64 for the API.
- **Paste Event Handling:** An `onPaste` listener will be attached to the modal container to intercept clipboard image data.
- **Testing and Review:** We will manually test the import flow (both text and image) to ensure backward compatibility and robust error handling.

## Open Questions

None. All major constraints have been clarified.

## Next Steps

Run `/workflows:plan` or `/create-openspec` to formalize the implementation tasks.
