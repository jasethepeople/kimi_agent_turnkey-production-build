export interface DiffToken {
  type: 'same' | 'add' | 'remove'
  text: string
}

/**
 * Word-level LCS diff between two texts. Good enough for version previews
 * (versions are chapter-scale snapshots).
 */
export function wordDiff(before: string, after: string): DiffToken[] {
  const a = before.split(/\s+/).filter(Boolean)
  const b = after.split(/\s+/).filter(Boolean)
  const m = a.length
  const n = b.length
  // Guard against pathological sizes.
  if (m * n > 250_000) {
    return [
      { type: 'remove', text: before.slice(0, 400) + '…' },
      { type: 'add', text: after.slice(0, 400) + '…' },
    ]
  }
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: DiffToken[] = []
  let i = 0
  let j = 0
  const push = (type: DiffToken['type'], text: string) => {
    const last = out[out.length - 1]
    if (last && last.type === type) last.text += ' ' + text
    else out.push({ type, text })
  }
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      push('same', a[i])
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('remove', a[i])
      i++
    } else {
      push('add', b[j])
      j++
    }
  }
  while (i < m) push('remove', a[i++])
  while (j < n) push('add', b[j++])
  return out
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}
