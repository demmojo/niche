export const scrubSensitiveData = (obj: any, depth = 0): any => {
  if (depth > 10) return "[TRUNCATED]";
  if (!obj) return obj;
  if (typeof obj === "string") {
    if (obj.startsWith("{") || obj.startsWith("[")) {
      try {
        const parsed = JSON.parse(obj);
        return JSON.stringify(scrubSensitiveData(parsed, depth + 1));
      } catch (e) {
        if (
          obj.toLowerCase().includes("password") ||
          obj.toLowerCase().includes("apikey") ||
          obj.toLowerCase().includes("prompt")
        ) {
          return "[SCRUBBED_MALFORMED]";
        }
        return obj;
      }
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => scrubSensitiveData(item, depth + 1));
  }
  if (typeof obj === "object") {
    const scrubbed: any = {};
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("apikey") ||
        lowerKey.includes("prompt") ||
        lowerKey.includes("imagebase64") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret")
      ) {
        scrubbed[key] = "[SCRUBBED]";
      } else {
        scrubbed[key] = scrubSensitiveData(obj[key], depth + 1);
      }
    }
    return scrubbed;
  }
  return obj;
};

export const createBeforeSend = (event: any): any => {
  if (event.request) {
    if (event.request.headers) {
      const headersToScrub = [
        "authorization",
        "x-api-key",
        "x-firebase-appcheck",
        "cookie",
      ];
      for (const k of Object.keys(event.request.headers)) {
        if (headersToScrub.includes(k.toLowerCase())) {
          delete event.request.headers[k];
        }
      }
    }
    if (event.request.env) {
      delete event.request.env["REMOTE_ADDR"];
    }
    if (event.request.data) {
      event.request.data = scrubSensitiveData(event.request.data);
    }
  }
  return event;
};
