/**
 *
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return "Unknown error occurred";

  let msg = "";

  // If error is a string, try to parse it
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      if (parsed.error?.message) msg = parsed.error.message;
      else if (parsed.message) msg = parsed.message;
      else msg = error;
    } catch (e) {
      msg = error;
    }
  } else if (error.message) {
    // If error has a message property
    if (typeof error.message === "string") {
      // Sometimes the message contains a JSON string after a prefix, e.g. "[429] {...}"
      const jsonMatch = error.message.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error?.message) msg = parsed.error.message;
          else if (parsed.message) msg = parsed.message;
          else msg = error.message;
        } catch (e) {
          msg = error.message;
        }
      } else {
        msg = error.message;
      }
    } else if (typeof error.message === "object") {
      // If error.message is an object
      if (error.message.message) msg = error.message.message;
      else {
        try {
          msg = JSON.stringify(error.message);
        } catch (e) {}
      }
    }
  } else if (error.error) {
    // If error is an object with an error property
    if (typeof error.error === "string") msg = error.error;
    else if (typeof error.error === "object" && error.error.message)
      msg = error.error.message;
  }

  if (!msg) {
    try {
      msg = JSON.stringify(error);
    } catch (e) {
      msg = String(error);
    }
  }

  // Add friendly notes for common API errors
  if (
    msg.includes("quota") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED")
  ) {
    return (
      "API Quota Exceeded. Please check your AI API plan or try again later. " +
      msg
    );
  } else if (
    msg.includes("503") ||
    msg.includes("500") ||
    msg.includes("Service Unavailable") ||
    msg.includes("overloaded")
  ) {
    return (
      "AI API is currently experiencing issues or is overloaded. Please try again later. " +
      msg
    );
  }

  return msg;
};
