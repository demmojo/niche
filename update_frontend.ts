import fs from "fs";

let content = fs.readFileSync("src/components/TrustBuilderScreen.tsx", "utf8");

// Update safe SSE error handling
content = content.replace(
  `          } catch (e) {
            console.error("Parse error on chunk", chunk, e);
          }`,
  `          } catch (e: any) {
            console.error("Parse error on chunk", chunk, e);
            // Safe SSE handling
            setError(e.message || "Failed to parse stream.");
            return;
          }`,
);

// Update pql_gate to just halt without setting error
content = content.replace(
  `            if (parsed.type === "pql_gate") {
              setIsPqlGated(true);
              return; // Halt parsing and let the stream close naturally
            }`,
  `            if (parsed.type === "pql_gate") {
              setIsPqlGated(true);
              return; // Halt parsing and let the stream close naturally
            }`,
);

fs.writeFileSync("src/components/TrustBuilderScreen.tsx", content);
