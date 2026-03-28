<div align="center">
  <img width="1200" height="475" alt="NicheAI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>NicheAI</h1>
  <p>An advanced, AI-driven Competitive Intelligence & Market Analysis tool</p>
</div>

---

## 📖 Overview

**NicheAI** is an AI-powered strategic dashboard and competitor intelligence engine. It helps product teams, founders, and strategists collect, analyze, and synthesize competitor data in real time to generate actionable insights.

The platform includes:
- **Dashboard & Executive Summary**: A high-level overview of your market positioning.
- **Competitor Matrix**: Detailed side-by-side feature and capability comparisons.
- **Raw Data Library**: Organize incoming data streams, news mentions, and Apollo.io organization data.
- **Insight Library**: Save and manage AI-generated strategic insights for product development.
- **Real-time Synchronization**: Background task engine that pulls data from web searches and API endpoints.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Framer Motion
- **Backend**: Express.js (serving API endpoints and Vite middleware)
- **Data & State**: Firebase Firestore (for syncing state across devices), React `useLocalStorage`
- **Testing**: Vitest, React Testing Library, JSDOM
- **AI Integration**: Google GenAI (Gemini)
- **Data Enrichment**: Apollo.io REST API, Google Custom Search API

## 💻 Local Development Setup

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- **Node.js**: v18.0.0 or higher recommended.
- **npm**: v9.0.0 or higher.

### 1. Install Dependencies

Clone the repository and install the project dependencies:

```bash
npm install
```

### 2. Environment Variables

Copy the example environment variables to a new `.env` file:

```bash
cp .env.example .env
```

Open the `.env` file and configure your API keys:

```env
# Google Gemini API key for generating insights
GEMINI_API_KEY="your_gemini_api_key_here"

# The hosted URL for the application
APP_URL="http://localhost:3000"

# Apollo.io API key for fetching company firmographics
APOLLO_API_KEY="your_apollo_api_key_here"

# Google Custom Search API for competitor news
GOOGLE_SEARCH_API_KEY="your_google_search_api_key_here"
GOOGLE_SEARCH_ENGINE_ID="your_google_search_engine_id_here"
```
*(Note: The app will boot with the dummy keys, but data enrichment and AI features will require valid API keys.)*

### 3. Start the Development Server

Start the full-stack development environment (Express + Vite):

```bash
npm run dev
```

The application will be available at **[http://localhost:3000](http://localhost:3000)**.

---

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Express server with Vite middleware in development mode with Hot Module Replacement (HMR). |
| `npm run build` | Builds the React frontend into static assets in the `/dist` directory. |
| `npm run start` | Runs the production Express server, serving the static assets from `/dist`. |
| `npm run lint` | Runs the TypeScript compiler to check for type errors without emitting files. |
| `npm run test` | Runs the Vitest test suite. |
| `npm run clean` | Removes the `/dist` build directory. |

---

## 🧪 Testing

This project uses **Vitest** alongside **React Testing Library** to ensure reliability.

### Running Tests

To run the complete test suite (unit and integration tests):

```bash
npm run test
```

### Test Coverage Highlights

- **`useLocalStorage.test.tsx`**: Validates custom hook side-effects, cache synchronization, and correct behavior without violating React state mutations.
- **`pagination.test.ts`**: Verifies zero-index boundaries and edge cases for data grids.
- **`App.test.tsx`**: Mounts the full application, testing navigation consistency and ensuring global components (like the Background Sync Engine) don't duplicate across tabs.

---

## 📂 Project Structure

```text
├── src/
│   ├── components/       # Reusable React components & Modals
│   ├── hooks/            # Custom React Hooks (e.g., useFirebaseSync)
│   ├── utils/            # Helper functions (e.g., pagination bounds)
│   ├── __tests__/        # Unit and Integration test files
│   ├── App.tsx           # Main application shell and routing state
│   ├── main.tsx          # React DOM entry point
│   ├── types.ts          # TypeScript type definitions
│   └── firebase.ts       # Firebase initialization and offline support
├── server.ts             # Express server entry point (Dev & Prod)
├── package.json          # Project metadata and dependencies
├── vite.config.ts        # Vite build and test configuration
└── firestore.rules       # Firebase security rules
```

## 🤝 Contributing

When making code changes, ensure to format the code properly and pass all linters and test suites:

1. Create a feature branch.
2. Ensure you add tests for new functionality inside `src/__tests__/`.
3. Run `npm run lint` to catch TypeScript errors.
4. Run `npm run test` to verify your changes haven't introduced regressions.
5. Create a Pull Request with a clear description of the modifications.
