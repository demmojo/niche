import re

with open("src/__tests__/server/campaignRoutes.test.ts", "r") as f:
    text = f.read()

# Fix refund test
old = """    it("logs critical error if refund fails", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(1);
      vi.mocked(credits.deductActionCredit).mockResolvedValueOnce();
      
      const admin = await import("firebase-admin");
      const db = admin.firestore();
      
      vi.spyOn(db, "runTransaction").mockImplementationOnce(async () => {});
      
      const docRefMock = {
        set: vi.fn().mockRejectedValue(new Error("Queue Error")),
      };
      const colSpy = vi.spyOn(db, "collection").mockReturnValueOnce({
        doc: vi.fn().mockReturnValue(docRefMock),
      } as any);

      const transSpy = vi.spyOn(db, "runTransaction").mockRejectedValueOnce(new Error("Refund Error"));
      
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ competitors: [{ name: "test.com" }], baseIdea: {} });

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "CRITICAL: Failed to refund credit for failed campaign start. User: test-uid",
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
      colSpy.mockRestore();
      transSpy.mockRestore();
    });"""

new = """    it("logs critical error if refund fails", async () => {
      const credits = await import("../../server/credits");
      vi.mocked(credits.getActionCredits).mockResolvedValueOnce(1);
      vi.mocked(credits.deductActionCredit).mockResolvedValueOnce();
      
      const admin = await import("firebase-admin");
      const db = admin.firestore();
      
      const docRefMock = {
        add: vi.fn().mockRejectedValue(new Error("Queue Error")),
      };
      vi.mocked(db.collection).mockReturnValueOnce({
        add: docRefMock.add,
      } as any);

      vi.mocked(db.runTransaction).mockRejectedValueOnce(new Error("Refund Error"));
      
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app)
        .post("/api/campaign/start")
        .set("Authorization", "Bearer VALID_TOKEN")
        .send({ competitors: [{ name: "test.com" }], baseIdea: {} });

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "CRITICAL: Failed to refund credit for failed campaign start. User: test-uid",
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });"""

# Because I replaced `set:` with `add:` inside `campaignRoutes.test.ts` via regex earlier, it might not match exact old text.
# Let's just use regex
text = re.sub(r'    it\("logs critical error if refund fails", async \(\) => \{[\s\S]*?consoleErrorSpy\.mockRestore\(\);[\s\S]*?\}\);', new, text)

with open("src/__tests__/server/campaignRoutes.test.ts", "w") as f:
    f.write(text)

