// List of sensitive/trigger words to censor
const sensitiveWords = [
  // Profanity
  'fuck', 'fucking', 'fucked', 'fucks',
  'shit', 'shits', 'shitting',
  'damn', 'damned', 'damnit',
  'ass', 'asshole', 'asses',
  'bitch', 'bitches',
  'bastard', 'bastards',
  'crap', 'crappy',
  'hell',
  'piss', 'pissed',
  
  // Crisis/trigger words - handle with care
  'kill myself', 'kill me', 'end my life', 'end it all',
  'want to die', 'wanna die', 'suicide', 'suicidal',
  'self harm', 'self-harm', 'cut myself', 'hurt myself',
  
  // Slurs and hate speech (abbreviated list)
  'retard', 'retarded',
  'faggot', 'fag',
  'nigger', 'nigga',
];

// Create regex patterns for each word (case-insensitive, whole word matching where appropriate)
const createPattern = (word: string): RegExp => {
  // For phrases, match them directly
  if (word.includes(' ') || word.includes('-')) {
    return new RegExp(word.replace(/[-]/g, '[-\\s]?'), 'gi');
  }
  // For single words, match whole words only
  return new RegExp(`\\b${word}\\b`, 'gi');
};

/**
 * Censors sensitive words in text by replacing them with asterisks
 */
export const censorContent = (text: string): string => {
  let censored = text;
  
  for (const word of sensitiveWords) {
    const pattern = createPattern(word);
    censored = censored.replace(pattern, (match) => {
      // Keep first letter, replace rest with asterisks
      if (match.length <= 2) return '*'.repeat(match.length);
      return match[0] + '*'.repeat(match.length - 1);
    });
  }
  
  return censored;
};

/**
 * Checks if content contains sensitive words
 * Returns array of detected categories
 */
export const detectSensitiveContent = (text: string): { hasSensitive: boolean; hasCrisisContent: boolean } => {
  const lowerText = text.toLowerCase();
  
  const crisisPatterns = [
    'kill myself', 'kill me', 'end my life', 'end it all',
    'want to die', 'wanna die', 'suicide', 'suicidal',
    'self harm', 'self-harm', 'cut myself', 'hurt myself'
  ];
  
  const hasCrisisContent = crisisPatterns.some(pattern => lowerText.includes(pattern));
  
  const hasSensitive = sensitiveWords.some(word => {
    const pattern = createPattern(word);
    return pattern.test(text);
  });
  
  return { hasSensitive, hasCrisisContent };
};
