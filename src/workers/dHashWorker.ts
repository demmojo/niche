/// <reference lib="webworker" />

/**
 *
 */
self.onmessage = async (e: MessageEvent) => {
  const bitmap: ImageBitmap = e.data;

  try {
    const hash = await calculateDHash(bitmap);
    self.postMessage({ type: "success", hash });
  } catch (error: any) {
    self.postMessage({ type: "error", error: error.message });
  } finally {
    // Free memory
    bitmap.close();
  }
};

/**
 *
 */
async function calculateDHash(bitmap: ImageBitmap): Promise<string> {
  // Resize to 9x8 to calculate difference horizontally
  const width = 9;
  const height = 8;

  // Check if OffscreenCanvas is available
  if (typeof OffscreenCanvas === "undefined") {
    throw new Error("OffscreenCanvas is not supported in this environment.");
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not get 2d context");

  // Draw the image onto the canvas, forcing resize
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale and build pixel array
  const pixels: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Luminance formula
    const gray = r * 0.299 + g * 0.587 + b * 0.114;
    pixels.push(gray);
  }

  // Calculate difference hash
  let hashBits = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const currentPos = y * width + x;
      const nextPos = currentPos + 1;

      const leftPixel = pixels[currentPos];
      const rightPixel = pixels[nextPos];

      // If left pixel is brighter than right pixel, bit is 1, else 0
      hashBits += leftPixel > rightPixel ? "1" : "0";
    }
  }

  // Convert binary string to hexadecimal
  let hexHash = "";
  for (let i = 0; i < hashBits.length; i += 4) {
    const nibble = hashBits.substring(i, i + 4);
    hexHash += parseInt(nibble, 2).toString(16);
  }

  return hexHash;
}
