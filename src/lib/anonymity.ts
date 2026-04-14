export const ANONYMOUS_DISPLAY_NAME = "Anonymous User";

interface PublicIdentityInput {
  isAnonymous: boolean;
  authorName?: string | null;
  fallbackName?: string;
}

interface PublicIdentity {
  displayName: string;
  initial: string;
  showProfileLink: boolean;
}

/**
 * Maps profile/post identity into a safe public representation.
 * Anonymous users always get a generic identity with no profile link.
 */
export function getPublicIdentity({
  isAnonymous,
  authorName,
  fallbackName = "User",
}: PublicIdentityInput): PublicIdentity {
  if (isAnonymous) {
    return {
      displayName: ANONYMOUS_DISPLAY_NAME,
      initial: "A",
      showProfileLink: false,
    };
  }

  const trimmedName = (authorName ?? "").trim();
  const displayName = trimmedName.length > 0 ? trimmedName : fallbackName;
  const initial = displayName[0]?.toUpperCase() ?? "U";

  return {
    displayName,
    initial,
    showProfileLink: true,
  };
}
