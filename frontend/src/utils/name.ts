/**
 * Nom complet utilisateur / élève : first_name + last_name + middle_name (postnom).
 * À utiliser partout où on affiche un "full name".
 */
export function userFullName(
  u: { first_name?: string; last_name?: string; middle_name?: string | null } | null | undefined
): string {
  if (!u) return ''
  return [u.first_name, u.last_name, u.middle_name].filter(Boolean).join(' ')
}
