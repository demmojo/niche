export function normalizeEmail(email: string): string {
  if (!email) return "";
  let emailStr = email.trim().toLowerCase();
  const parts = emailStr.split("@");
  if (parts.length === 2) {
    let [local, domain] = parts;
    if (domain === "gmail.com" || domain === "googlemail.com") {
      local = local.replace(/\./g, "");
      domain = "gmail.com";
    }
    return `${local}@${domain}`;
  }
  return emailStr;
}
