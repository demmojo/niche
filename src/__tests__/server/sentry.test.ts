import { describe, it, expect, beforeEach, vi } from "vitest";
import { sentryBeforeSend } from "../../server/sentry";

describe("Sentry beforeSend hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scrubs authorization and custom security headers and IP", () => {
    const mockEvent: any = {
      request: {
        headers: {
          authorization: "Bearer secret-token",
          Authorization: "Bearer secret-token-2",
          "x-api-key": "my-byok-key",
          "X-Firebase-AppCheck": "appcheck-token",
          cookie: "session_id=123",
          "content-type": "application/json",
        },
        env: {
          REMOTE_ADDR: "192.168.1.1",
        },
      },
    };

    const processedEvent = sentryBeforeSend(mockEvent);

    expect(processedEvent.request?.headers?.authorization).toBeUndefined();
    expect(processedEvent.request?.headers?.Authorization).toBeUndefined();
    expect(processedEvent.request?.headers?.["x-api-key"]).toBeUndefined();
    expect(
      processedEvent.request?.headers?.["X-Firebase-AppCheck"],
    ).toBeUndefined();
    expect(processedEvent.request?.headers?.cookie).toBeUndefined();
    expect(processedEvent.request?.headers?.["content-type"]).toBe(
      "application/json",
    );
    expect(processedEvent.request?.env?.REMOTE_ADDR).toBeUndefined();
  });

  it("scrubs sensitive payload data when JSON string", () => {
    const mockEvent: any = {
      request: {
        data: JSON.stringify({
          prompt: "Please generate a summary of NicheAI",
          imageBase64: "data:image/png;base64,...",
          userApiKey: "aiza-secret-key",
          safeField: "hello world",
        }),
      },
    };

    const processedEvent = sentryBeforeSend(mockEvent);
    const parsedData = JSON.parse(processedEvent.request?.data as string);

    expect(parsedData.prompt).toContain("[SCRUBBED]");
    expect(parsedData.imageBase64).toContain("[SCRUBBED]");
    expect(parsedData.userApiKey).toContain("[SCRUBBED]");
    expect(parsedData.safeField).toBe("hello world");
  });

  it("scrubs sensitive payload data when nested object", () => {
    const mockEvent: any = {
      request: {
        data: {
          user: {
            password: "my-secret-password",
            safeField: "hello world",
          },
          prompts: [{ prompt: "test" }],
        },
      },
    };

    const processedEvent = sentryBeforeSend(mockEvent);
    const data = processedEvent.request?.data as any;

    expect(data.user.password).toContain("[SCRUBBED]");
    expect(data.user.safeField).toBe("hello world");
    expect(data.prompts).toContain("[SCRUBBED]");
  });

  it("scrubs sensitive payload data when Array", () => {
    const mockEvent: any = {
      request: {
        data: [{ password: "secret" }, { safeField: "test" }],
      },
    };

    const processedEvent = sentryBeforeSend(mockEvent);
    const data = processedEvent.request?.data as any;

    expect(Array.isArray(data)).toBe(true);
    expect(data[0].password).toContain("[SCRUBBED]");
    expect(data[1].safeField).toBe("test");
  });

  it("scrubs malformed JSON string gracefully", () => {
    const mockEvent: any = {
      request: {
        data: "{prompt=secret&password=123",
      },
    };

    const processedEvent = sentryBeforeSend(mockEvent);

    expect(processedEvent.request?.data).toContain("[SCRUBBED_MALFORMED]");
  });
});
