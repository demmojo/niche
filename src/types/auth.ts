export type AuthMergeState =
  | "IDLE"
  | "REQUESTING_GRANT"
  | "AWAITING_OAUTH"
  | "RESOLVING_CONFLICT"
  | "EXECUTING_MERGE"
  | "SUCCESS"
  | "ERROR";
