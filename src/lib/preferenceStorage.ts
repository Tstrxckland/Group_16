/**
 * F1.6 Preference Storage
 * Handles reading/writing onboarding preferences to localStorage and persisting
 * them to the user profile after auth.
 */

// [Potentially Generic Suggestion] Extracting the storage key to a named constant
// is standard practice; reject if you prefer the literal inline for this module.
const STORAGE_KEY = "safespace_onboarding_pending";

const EMPTY_STRING_ARRAY: string[] = [];

export interface OnboardingData {
  anxietyLevel: number;
  goals: string[];
  comfortPreferences: string[];
  socialComfortContext?: string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasValidAnxietyLevel(obj: Record<string, unknown>): boolean {
  const level = obj.anxietyLevel;
  return typeof level === "number" && Number.isInteger(level);
}

/**
 * Normalizes parsed object with explicit array defaults. Ensures goals and
 * comfortPreferences are always arrays; missing or invalid values become [].
 */
function normalizeWithDefaults(obj: Record<string, unknown>): OnboardingData {
  const goals = isStringArray(obj.goals) ? obj.goals : EMPTY_STRING_ARRAY;
  const comfortPreferences = isStringArray(obj.comfortPreferences)
    ? obj.comfortPreferences
    : EMPTY_STRING_ARRAY;
  const socialComfortContext = isStringArray(obj.socialComfortContext)
    ? obj.socialComfortContext
    : undefined;

  return {
    anxietyLevel: obj.anxietyLevel as number,
    goals,
    comfortPreferences,
    ...(socialComfortContext !== undefined && { socialComfortContext }),
  };
}

function safeParse(raw: string | null): OnboardingData | null {
  if (raw === null || raw === "") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isNonEmptyObject(parsed)) return null;
  if (!hasValidAnxietyLevel(parsed)) return null;

  return normalizeWithDefaults(parsed);
}

/**
 * Saves onboarding data to localStorage.
 */
export function saveOnboardingToLocalStorage(data: OnboardingData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    // Return early: localStorage may be full, disabled, or in private mode.
    // Safer than throwing—callers avoid try/catch; fail silently for storage layer.
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[preferenceStorage] save failed:", err);
    }
  }
}

/**
 * Retrieves onboarding data from localStorage. Returns null if not present or invalid.
 */
export function getOnboardingFromLocalStorage(): OnboardingData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return safeParse(raw);
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[preferenceStorage] read failed:", err);
    }
    return null;
  }
}

/**
 * Clears onboarding data from localStorage.
 */
export function clearOnboardingFromLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[preferenceStorage] clear failed:", err);
    }
  }
}

/**
 * Persists pending onboarding data to the user profile after auth.
 * Stub: to be wired to Supabase profile update when auth flow integration is added.
 */
export async function persistOnboardingToProfile(): Promise<void> {
  // TODO: read getOnboardingFromLocalStorage(), update user profile in Supabase, clear on success
}
