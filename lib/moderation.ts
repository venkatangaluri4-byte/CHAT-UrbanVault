// Moderation filter for Spanish and English
const BANNED_WORDS_ES = [
  'puta', 'puto', 'chinga', 'chingada', 'pendejo', 'pendeja', 'cabrón', 'cabron',
  'mierda', 'culero', 'culera', 'mamón', 'mamon', 'pinche', 'joto', 'marica',
  'whore', 'fuck', 'shit', 'bitch', 'nigger', 'faggot', 'retard', 'cunt',
  'bastard', 'asshole', 'motherfucker',
]

const HATE_SPEECH_PATTERNS = [
  /\b(racista|racist|nazis?|kkk|white\s*supremac)\b/i,
  /\b(matar|kill|muerte a|death to)\s+\w+/i,
  /\b(odio a los?|i hate)\s+(negro|moreno|indio|mexican|latino)\b/i,
]

const SEVERE_PATTERNS = [
  /\b(violación|rape|pedo|pedofilia|child\s*porn)\b/i,
  /\b(suicid|mátate|kill yourself)\b/i,
]

export interface ModerationResult {
  isAllowed: boolean
  severity: 'none' | 'mild' | 'severe' | 'extreme'
  reason?: string
  filteredMessage?: string
}

export function moderateMessage(message: string): ModerationResult {
  const lower = message.toLowerCase()

  // Check severe/extreme content first
  for (const pattern of SEVERE_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        isAllowed: false,
        severity: 'extreme',
        reason: 'Contenido extremadamente inapropiado detectado',
      }
    }
  }

  // Check hate speech
  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        isAllowed: false,
        severity: 'severe',
        reason: 'Discurso de odio detectado',
      }
    }
  }

  // Check profanity - filter but allow with asterisks
  let filteredMessage = message
  let hasProfanity = false

  for (const word of BANNED_WORDS_ES) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(lower)) {
      hasProfanity = true
      filteredMessage = filteredMessage.replace(regex, (match) =>
        match[0] + '*'.repeat(match.length - 2) + match[match.length - 1]
      )
    }
  }

  if (hasProfanity) {
    return {
      isAllowed: true,
      severity: 'mild',
      reason: 'Lenguaje inapropiado filtrado',
      filteredMessage,
    }
  }

  return { isAllowed: true, severity: 'none', filteredMessage: message }
}

export function getWarningCount(violations: number): {
  action: 'none' | 'warning' | 'mute' | 'ban'
  message: string
} {
  if (violations >= 10) return { action: 'ban', message: 'Usuario baneado permanentemente' }
  if (violations >= 5) return { action: 'mute', message: 'Usuario silenciado temporalmente' }
  if (violations >= 2) return { action: 'warning', message: 'Advertencia: comportamiento inapropiado' }
  return { action: 'none', message: '' }
}
