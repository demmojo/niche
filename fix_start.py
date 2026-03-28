import re

with open("src/__tests__/server/campaignRoutes.test.ts", "r") as f:
    text = f.read()

new_text = """    it("logs critical error if refund fails", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(1);
      vi.mocked(credits.deductActionCredit).mockResolvedValueOnce();
      
      const admin = await import("firebase-admin");
      const db = admin.firestore();
      
      vi.mocked(db.collection).mockReturnValueOnce({
        add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
      } as any);

      const { networkIoQueue } = await import("../../server/queues");
      vi.mocked(networkIoQueue.add).mockRejectedValueOnce(new Error("Queue Error"));

      vi.mocked(db.runTransaction).mockRejectedValueOnce(new Error("Refund Error"));
      
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ competitors: [{ name: "test.com" }], baseIdea: {} });

      // Because networkIoQueue.add is fire-and-forget inside the route, the route still returns 202
      // But the error is logged asynchronously! Wait, in my test environment, promises might not resolve immediately.
      // Let's await a tick.
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(response.status).toBe(202);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("CRITICAL: Failed to refund user after queue failure"),
        expect.any(Object)
      );
      
      consoleErrorSpy.mockRestore();
    });"""

text = re.sub(r'    it\("logs critical error if refund fails", async \(\) => \{[\s\S]*?vi\.mocked\(db\.collection\("campaign_jobs"\)\.add\)\.mockRestore\(\);\n    \}\);', new_text, text)

with open("src/__tests__/server/campaignRoutes.test.ts", "w") as f:
    f.write(text)
