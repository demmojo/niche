/**
 *
 */
export async function calculateImageHash(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // Create a worker from the file URL
    const worker = new Worker(
      new URL("../workers/dHashWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    /**
     *
     */
    worker.onmessage = (e) => {
      if (e.data.type === "success") {
        resolve(e.data.hash);
      } else {
        reject(new Error(e.data.error));
      }
      worker.terminate();
    };

    /**
     *
     */
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };

    try {
      const bitmap = await createImageBitmap(file);
      worker.postMessage(bitmap, [bitmap]);
    } catch (e) {
      reject(e);
      worker.terminate();
    }
  });
}
