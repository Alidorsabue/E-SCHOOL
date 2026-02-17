/**
 * Ordonne les niveaux de classe RDC : 1ère < 2ème < … < 6ème.
 * Utilisé pour sélectionner par défaut la « classe la plus inférieure »
 * quand l'enseignant est titulaire de plusieurs classes.
 */
export function classLevelOrder(name: string): number {
  const s = String(name ?? '')
  if (/\b1(?:ère|re)/i.test(s)) return 1
  if (/\b2(?:ème|e)\b/i.test(s)) return 2
  if (/\b3(?:ème|e)\b/i.test(s)) return 3
  if (/\b4(?:ème|e)\b/i.test(s)) return 4
  if (/\b5(?:ème|e)\b/i.test(s)) return 5
  if (/\b6(?:ème|e)\b/i.test(s)) return 6
  return 999
}

/** Retourne la classe avec le niveau le plus bas (1ère avant 2ème, etc.). */
export function sortClassesByLevel<T extends { name?: string | null }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => classLevelOrder(a.name ?? '') - classLevelOrder(b.name ?? ''))
}
