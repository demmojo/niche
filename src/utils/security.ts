import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

/**
 * Security utilities for NicheAI ML Orchestration
 *
 * Includes functions to prevent Prompt Injection and ensure data safety
 * before parsing it into LLM Context models.
 */

/**
 * Strips `<` and `>` characters from user input to prevent XML-based prompt injection
 * such as Role Confusion via `</user_input>` tag breakout.
 *
 * @param input Raw user input string
 * @returns Sanitized string
 */
export const sanitizeUserInput = (input: string): string => {
  if (typeof input !== "string") return input;
  return input.replace(/[<>]/g, "");
};

/**
 * Safely parses raw Markdown and returns sanitized HTML using an AST-based
 * approach (`rehype-sanitize`). This prevents Stored XSS if LLM extraction fails
 * and falls back to rendering raw unstructured output.
 *
 * @param markdown Raw markdown string
 * @returns A promise resolving to sanitized HTML
 */
export const sanitizeMarkdownFallback = async (
  markdown: string,
): Promise<string> => {
  if (!markdown) return "";
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize) // AST-based sanitization
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
};
