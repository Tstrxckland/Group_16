# Anonymous User Public Presence Design

This design defines how users appear in public spaces (forums and group chats) when anonymity is enabled.

## Goals

- Make anonymous participation easy and consistent.
- Prevent accidental exposure of identifying information.
- Keep moderation traceability server-side without exposing identity to other users.

## Public Identity Rules

When a user is anonymous:

- Display name: `Anonymous User`
- Avatar: generic anonymous icon (no initials, no profile image)
- Profile entry points: disabled (no profile link, no hover card, no user detail preview)
- Never show: username, email, display name, profile photo, or user-id-derived identifiers

When a user is not anonymous:

- Display name: profile display name fallback to `User`
- Avatar: normal initial/avatar presentation
- Profile entry points: allowed per page rules

## Scope

Apply this behavior to:

- Community/forum posts
- Community/forum comments
- Group chat messages in public rooms

Do not automatically apply to private one-to-one chats unless product policy requires it.

## UX Pattern

For each anonymous message/post in a public feed:

- Header:
  - Anonymous avatar icon
  - `Anonymous User`
  - Relative timestamp only
- Body:
  - Post/message content
- Footer:
  - Standard engagement actions (like/reply/report)
  - No profile action

## Data Safety Requirements

- Anonymous rendering must be computed from `is_anonymous`.
- Frontend should use a shared helper to map identity safely.
- Backend should avoid returning unnecessary identifying fields for anonymous records in public endpoints.
- Internal moderation tooling can retain `user_id` mapping server-side, but that mapping is never shown to regular users.

## Current Implementation Notes

- Shared helper added: `src/lib/anonymity.ts`
  - `ANONYMOUS_DISPLAY_NAME`
  - `getPublicIdentity(...)`
- Community feed now uses this helper when mapping fetched posts and newly created posts.

## Acceptance Criteria

- Anonymous users always render as `Anonymous User` in public spaces.
- No initials, display name, username, or profile links appear for anonymous users.
- Rendering is consistent across all public surfaces that show user identity.
- Toggling profile anonymity affects future public posts/messages.
