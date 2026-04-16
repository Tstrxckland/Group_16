type ContentCategory = "profanity" | "crisis" | "sensitive";

interface SensitiveContentResult {
  hasSensitive: boolean;
  hasCrisisContent: boolean;
}

const SENSITIVE_WORDS: Readonly<Record<ContentCategory, readonly string[]>> = {
  profanity: [
    'fuck', 'fucking', 'fucked', 'fucks',
    'shit', 'shits', 'shitting',
    'damn', 'damned', 'damnit',
    'ass', 'asshole', 'asses',
    'bitch', 'bitches',
    'bastard', 'bastards',
    'crap', 'crappy',
    'hell',
    'piss', 'pissed',
  ],
  crisis: [
    'kill myself', 'kill me', 'end my life', 'end it all',
    'want to die', 'wanna die', 'suicide', 'suicidal',
    'self harm', 'self-harm', 'cut myself', 'hurt myself',
  ],
  sensitive: [
    "retard", "retarded",
    "faggot", "fag",
    "nigger", "nigga",
  ],
} as const;

const getAllSensitiveWords = (): string[] =>
  Object.values(SENSITIVE_WORDS).flat();

const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createPattern = (word: string): RegExp => {
  const escaped = escapeRegExp(word);
  const pattern = word.includes(' ') || word.includes('-')
    ? escaped.replace(/-/g, '[-\\s]?')
    : `\\b${escaped}\\b`;

  return new RegExp(pattern, 'gi');
};

const getNowMs = (): number =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

// Defensive: avoid blocking the UI / event loop with pathological inputs.
// This is not a "hard" RegExp engine timeout (JS has no standard RegExp timeout),
// but it caps overall work for this function.
const REGEX_TIMEOUT_MS = 50;

const censorMatch = (match: string): string => {
  if (match.length <= 2) {
    return '*'.repeat(match.length);
  }
  return match[0] + '*'.repeat(match.length - 1);
};

export const censorContent = (text: unknown): string => {
  if (typeof text !== 'string') {
    return '';
  }

  if (text.trim() === '') {
    return text;
  }

  const start = getNowMs();
  let result = text;

  for (const word of getAllSensitiveWords()) {
    if (getNowMs() - start > REGEX_TIMEOUT_MS) break;
    result = result.replace(createPattern(word), censorMatch);
  }

  return result;
};

export const detectSensitiveContent = (text: unknown): SensitiveContentResult => {
  const defaultResult: SensitiveContentResult = {
    hasSensitive: false,
    hasCrisisContent: false,
  };

  if (typeof text !== 'string' || text.trim() === '') {
    return defaultResult;
  }

  const lowerText = text.toLowerCase();

  const start = getNowMs();

  let hasCrisisContent = false;
  for (const phrase of SENSITIVE_WORDS.crisis) {
    if (getNowMs() - start > REGEX_TIMEOUT_MS) {
      // Conservative timeout behavior.
      return { hasSensitive: false, hasCrisisContent };
    }
    if (lowerText.includes(phrase.toLowerCase())) {
      hasCrisisContent = true;
      break;
    }
  }

  let hasSensitive = false;
  for (const word of getAllSensitiveWords()) {
    if (getNowMs() - start > REGEX_TIMEOUT_MS) break;
    if (createPattern(word).test(text)) {
      hasSensitive = true;
      break;
    }
  }

  return { hasSensitive, hasCrisisContent };
};
