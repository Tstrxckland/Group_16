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

  return getAllSensitiveWords().reduce(
    (result, word) => result.replace(createPattern(word), censorMatch),
    text
  );
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

  const hasCrisisContent = SENSITIVE_WORDS.crisis.some((phrase) =>
    lowerText.includes(phrase.toLowerCase())
  );

  const hasSensitive = getAllSensitiveWords().some((word) =>
    createPattern(word).test(text)
  );

  return { hasSensitive, hasCrisisContent };
};
