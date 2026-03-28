## 1. Sync Now Button Fix

- [ ] 1.1 In `src/App.tsx`, modify `SyncNowButton` wrapper from `flex items-center justify-center` to `inline-flex items-center justify-center`.
- [ ] 1.2 In `src/App.tsx`, update the SyncNowButton tooltip div classes to include `invisible group-hover:visible` (remove `pointer-events-none` if `invisible` is applied, or keep it, just ensure `invisible` is there).

## 2. Tooltip Component Review

- [ ] 2.1 In `src/components/Tooltip.tsx`, update the wrapper container from `flex items-center justify-center` to `inline-flex items-center justify-center`.

## 3. Inline Group-Hover Tooltips Review

- [ ] 3.1 Search for `group-hover:opacity-100` across `src/` and update tooltip containers to include `invisible group-hover:visible` if they don't already. (e.g., `src/App.tsx` line 6283)
- [ ] 3.2 Ensure any parent wrapper `div` with `group` is appropriately sized (using inline elements where applicable) so hover areas are not oversized.
