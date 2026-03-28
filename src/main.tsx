import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./components/AuthProvider";
import { VisualKnowledgeProvider } from "./store/visualKnowledgeStore";

// Suppress MetaMask connection errors caused by browser extensions
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason &&
    typeof event.reason.message === "string" &&
    event.reason.message.includes("MetaMask")
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <VisualKnowledgeProvider>
        <App />
      </VisualKnowledgeProvider>
    </AuthProvider>
  </StrictMode>,
);
