# Frontend state management

## Global state (singleton services, `providedIn: 'root'`)

### AuthService
- **Source of truth:** `localStorage` (token + user) + in-memory `BehaviorSubject`s.
- **Streams:** `currentUser$`, `isAuthenticated$` (read-only; components subscribe).
- **Updates:** Only via `login`, `register`, `logout`, `updateSessionWithToken`. Session and both subjects are updated together so `currentUser` and `isAuthenticated` stay in sync.
- **Init:** Reads from storage and validates token; invalid/expired token triggers `clearSession()`.

### OrgContextService
- **Source of truth:** In-memory `BehaviorSubject<CurrentOrg | null>` + `sessionStorage` (persisted on `setCurrentOrg`).
- **Stream:** `currentOrg$`.
- **Updates:** `setCurrentOrg(org)`, `clearCurrentOrg()`. Used when user selects an org from the list or sidebar.

## Derived / reactive state

- **Guards:** `AuthGuard` uses `isAuthenticated$`; `OrgSelectedGuard` uses `currentOrg$`. Both use `take(1)`.
- **Task board/list:** Subscribe to `currentOrg$`, skip first emission, then `distinctUntilChanged` by org id and reload tasks when the selected org changes (so switching spaces updates the list).
- **Layout:** `hasSpaceSelected$` = `currentOrg$.pipe(map(org => isChildOrg(org)))`.

## Local UI state

- **Components:** Modal open/closed, loading flags, form state (e.g. `showTaskModal`, `filterModalOpen`) are local component state (no global store).
- **Signals:** Used for local UI only (e.g. `mobileSidebarOpen`, `settingsOpen`) in layout components.

## Rules

1. **Single source of truth:** Auth and current org live only in their services; components read via `getCurrentUser()`, `getCurrentOrgId()`, or observables.
2. **No duplicate auth/org state:** Don’t copy user or current org into component state; read from the service when needed.
3. **React to org changes:** Views that depend on the current org (tasks, etc.) subscribe to `currentOrg$` and refresh when the org id changes.
