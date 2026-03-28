/**
 *
 */
export function downscaleImageBase64(base64Image: string): string {
  return base64Image;
}

/**
 *
 */
export async function compressImage(
  file: File,
  options?: any,
): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    /**
     *
     */
    reader.onload = () => {
      resolve({
        base64Data: (reader.result as string).split(",")[1],
        mimeType: file.type,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
