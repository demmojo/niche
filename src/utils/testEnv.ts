export function isMockAuthEnabled() {
  return (
    typeof window !== "undefined" &&
    (window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true"))
  );
}
