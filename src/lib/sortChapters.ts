/** Sorts chapter labels by their leading integer, then alphabetically. */
export function compareChapters(a: string, b: string): number {
  const numA = Number.parseInt(a, 10)
  const numB = Number.parseInt(b, 10)
  const hasNumA = !Number.isNaN(numA)
  const hasNumB = !Number.isNaN(numB)

  if (hasNumA && hasNumB && numA !== numB) return numA - numB
  if (hasNumA !== hasNumB) return hasNumA ? -1 : 1

  return a.localeCompare(b, undefined, { numeric: true })
}