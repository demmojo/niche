## Why

Currently, when a user uploads an image via the Raw Data Library's `UploadDataModal`, the application passes the image directly to the Gemini AI using a local file reference (like `pasted-image...png`). This filename is saved to Firestore as the `sourceUrl`. Because this path is local to the user's session, the image link breaks across sessions or devices, rendering the uploaded image inaccessible. Furthermore, users cannot view or download these images later.

This feature fixes the broken image experience by persisting user-uploaded images to cloud storage and ensuring they are permanently viewable and downloadable.

## What Changes

We are introducing persistent cloud storage for user-uploaded images using **Supabase Storage**.

Before images are sent to the AI for analysis, the React client will compress the image, upload it to a Supabase Storage bucket (e.g., `raw-data-images`), retrieve a public download URL, and use that URL as the `sourceUrl` for the data source. This aligns with the overall Raw Data Library architecture which standardizes on Supabase for all raw data blobs.

Additionally, the `DataSourceCard` component will be updated to display a download button alongside the existing maximize button when an image is hovered.

## Capabilities

### New Capabilities

- `raw-data-image-upload`: The ability to securely upload images to Supabase Storage and link them to a user's data sources.
- `raw-data-image-download`: The ability for a user to download their uploaded images directly from the `DataSourceCard`.

### Modified Capabilities

- `raw-data-ingestion`: Modified to utilize the Supabase Storage URL instead of a local filename when recording the source of the ingested data.

## Impact

This change affects the `UploadDataModal` (upload logic) and the `DataSourceCard` (UI updates). It provides a more robust and complete user experience for the Raw Data Library while maintaining architectural consistency by using Supabase Storage.
