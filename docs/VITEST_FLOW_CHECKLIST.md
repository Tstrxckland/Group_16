# Vitest Flow Checklist

This checklist focuses on validating frontend <-> backend communication after the service-layer refactor.

## Suggested Test Setup

- Use `vitest` with `jsdom`.
- Mock service modules in UI/hook tests (`vi.mock("@/services/...")`).
- Add a small number of integration-style tests for service modules with mocked Supabase client behavior.
- Validate both success and failure paths (toasts, rollback behavior, and state updates).

## Core Flow Coverage

### 1) Authentication

- [ ] Sign up calls `signUpWithEmail` and returns surfaced error/null correctly.
- [ ] Sign in calls `signInWithEmail` and updates auth state.
- [ ] Sign out calls `signOutSession`.
- [ ] Session restore on app init uses `getCurrentSession`.

Passing result:
- AuthProvider exposes correct `user`, `session`, and `loading` transitions for success and failure states.

### 2) Growth Dashboard Stats

- [ ] `useUserStats` reads completed challenge count via `getCompletedChallengesCount`.
- [ ] `useUserStats` reads journal dates via `getJournalEntryDates`.
- [ ] Streak calculation returns expected values for today/yesterday/older data.
- [ ] Error path resets stats to zero and stops loading.

Passing result:
- Dashboard stats render expected numbers and recover gracefully from service failures.

### 3) Journaling

- [ ] Journal page loads entries through `listJournalEntries`.
- [ ] Creating an entry calls `createJournalEntry` and prepends to UI list.
- [ ] Streak recalculates after new entry.
- [ ] Failed load/save shows destructive toast and does not corrupt local state.

Passing result:
- Entries persist and render consistently before/after reload and after create actions.

### 4) Forum Posts

- [ ] Community list fetches via `listCommunityPosts`.
- [ ] Post detail fetches via `getCommunityPostById`.
- [ ] Create post calls `createCommunityPost` with expected anon/tags/content.
- [ ] Edit and delete call `updateCommunityPostContent` / `deleteCommunityPost`.
- [ ] Crisis-content hint still appears when sensitive content is detected.

Passing result:
- CRUD operations are reflected immediately in UI and remain consistent after refresh.

### 5) Likes (Optimistic + Rollback)

- [ ] `toggleLike` optimistically updates liked state and count.
- [ ] On `updatePostLikes` failure, liked state and likes count roll back.
- [ ] Failure toast is shown for like persistence failure.

Passing result:
- No stale optimistic state remains after backend write failures.

### 6) Friend Management

- [ ] Friends page loads dashboard via `loadFriendsDashboard`.
- [ ] Username updates via `updateProfileUsername`.
- [ ] Friend request send/respond/remove call their corresponding service functions.
- [ ] Error paths show expected toasts (duplicate username/request, etc.).

Passing result:
- Friend lists and request state transitions remain accurate across refreshes.

### 7) Messaging

- [ ] Message thread loads via `listMessages`.
- [ ] Sending message calls `sendMessage`.
- [ ] Realtime inserts from `subscribeToMessages` append to thread.
- [ ] Unsubscribe occurs on unmount or friendship switch.

Passing result:
- Message timeline remains ordered, and new messages appear without reload.

### 8) Anonymity + Discreet Mode

- [ ] Profile anonymous toggle calls `updateAnonymousMode`.
- [ ] Profile discreet toggle calls `updateDiscreetMode`.
- [ ] `useDiscreetMode` initial load calls `getDiscreetModeByUserId`.
- [ ] `useDiscreetMode` reacts to realtime updates via `subscribeToDiscreetModeChanges`.

Passing result:
- Toggle state is persisted and reflected across pages after reload and realtime updates.

### 9) Resources Portal

- [ ] Resource cards open expected URLs with `window.open`.
- [ ] Opening links does not mutate app auth or route state.

Passing result:
- External navigation launches safely and does not break in-app session behavior.

## Regression-Focused Cases

- [ ] Non-anonymous forum posting succeeds when profile row is missing (fallback name works).
- [ ] Like failures do not produce unhandled promise state drift.
- [ ] Community detail like button awaits async toggle path safely.

Passing result:
- Refactor-introduced risk points are explicitly covered and stable.
