export function isMockAuthEnabled() {
  return (
    typeof window !== "undefined" &&
    (window.name === "playwright-test" || false)
  );
}
