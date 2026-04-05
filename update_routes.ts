import fs from "fs";

let content = fs.readFileSync("src/server/scoringRoutes.ts", "utf8");

// 1. Exa Search vs SearchAndContents
content = content.replace(
  `      const exaResponse = await exa.searchAndContents(exaQuery, {
        type: "neural",
        numResults: isAnonymous ? 3 : 15,
        text: { maxCharacters: exaTextLimit },
      });`,
  `      let exaResponse;
      if (isAnonymous) {
        exaResponse = await exa.search(exaQuery, {
          type: "neural",
          useAutoprompt: true,
          numResults: 3,
        });
      } else {
        exaResponse = await exa.searchAndContents(exaQuery, {
          type: "neural",
          numResults: 15,
          text: { maxCharacters: exaTextLimit },
        });
      }`,
);

// 2. Model fallback
content = content.replace(
  `        const hasGlobalQuota = await checkAndIncrementGlobalAnonymousLimit(30);
        if (!hasGlobalQuota) {
          selectedModel = "gemini-3.1-flash";
        }`,
  `        const hasGlobalQuota = await checkAndIncrementGlobalAnonymousLimit(30);
        if (!hasGlobalQuota) {
          selectedModel = process.env.TEASER_MODEL || "gemini-3.1-flash-lite-preview";
        }`,
);

fs.writeFileSync("src/server/scoringRoutes.ts", content);
