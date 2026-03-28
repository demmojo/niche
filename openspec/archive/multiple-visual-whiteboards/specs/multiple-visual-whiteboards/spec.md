# Multiple Visual Whiteboards & AI Chat Integration

## 1. State Management (Normalized Store)

- **Cards (`GlobalCardLibrary`)**:
  - `id`: string
  - `title`: string
  - `content`: string
  - `type`: 'competitor' | 'insight' | 'note' | 'category'
  - `tags`: string[]
- **Whiteboards (`WhiteboardStore`)**:
  - `id`: string
  - `name`: string
  - `cardInstances`: Array of `{ cardId, x, y, width, height }`
  - `edges`: Array of `{ id, sourceCardId, targetCardId, type }`

## 2. Features

### 2.1 Multiple Whiteboard Management

- **Requirement:** Users can click a "New Whiteboard" button or switch between existing boards using a sidebar/dropdown.
- **Requirement:** When creating a new whiteboard, a modal prompts the user to select from one of the 10 predefined Templates or "Blank Canvas".

### 2.2 Template Initialization

- **Requirement:** Selecting a template (e.g., SWOT Analysis) automatically populates the whiteboard with pre-positioned cards (Strengths, Weaknesses, Opportunities, Threats) and appropriate visual groupings.

### 2.3 Contextual AI Chat

- **Requirement:** A dedicated or side-by-side Chat Panel next to the active Whiteboard.
- **Requirement:** Typing `@` opens an autocomplete menu of all available Tags and Card titles.
- **Requirement:** When a message is sent containing `@tags`, the system retrieves the content of all cards holding that tag and injects it into the Gemini LLM prompt.
- **Requirement:** The AI's response has a "Pin to Board" action that creates a new Card on the active whiteboard containing the insight.

## Scenarios

- **WHEN** a user creates a new whiteboard and selects the "Competitor Analysis" template, **THEN** a new board is created with pre-placed placeholder cards for 3 competitors.
- **WHEN** a user types "@pricing" in the AI chat and asks "summarize our strategy", **THEN** all cards tagged `#pricing` are injected as context and Gemini provides a summary.
- **WHEN** the user clicks "Pin to Board" on the AI's response, **THEN** a new Card appears in the center of the active whiteboard viewport containing the AI's text.
