import crypto from "crypto";

export const verifyStagingToken = (content: string, token: string) => {
  const actualToken = crypto.createHash("sha256").update(content).digest("hex");
  return actualToken === token;
};
