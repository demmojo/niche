export interface GeneratedPromptMeta {
  id: string;
  timestamp: string;
  scope: string;
  stack: string;
  status: "exported" | "validated";
}
