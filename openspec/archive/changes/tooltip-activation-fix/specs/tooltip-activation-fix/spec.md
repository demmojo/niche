# Tooltip Activation Fix

This feature standardizes tooltip activation areas and interaction states across the application.

## Features

### 1. Sync Now Button Fix

- **Requirement:** The "Sync Now" button's tooltip must only trigger when the user hovers directly over the button. The invisible tooltip text and the "Learn more" button must not trigger the tooltip when the mouse is below the button.

### 2. General Tooltip Container Fix

- **Requirement:** `Tooltip.tsx` and inline tooltip wrappers must use `inline-flex` or `inline-block` to constrain the hover bounding box to the target element's actual dimensions.

### 3. General Visibility Standard

- **Requirement:** All `group-hover` custom tooltips must include `invisible` in their default state and `group-hover:visible` when hovered, along with `opacity` transitions.

## Scenarios

- **WHEN** the user hovers immediately below the "Sync Now" button
- **THEN** the tooltip does not appear

- **WHEN** the user hovers directly over the "Sync Now" button
- **THEN** the tooltip appears and allows interaction with the "Learn more about syncing" link

- **WHEN** the user hovers over any component wrapped in `Tooltip.tsx`
- **THEN** the tooltip activates only when the pointer intersects the component, not the surrounding empty space
