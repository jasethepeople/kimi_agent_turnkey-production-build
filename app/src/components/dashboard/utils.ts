export function timeAgo(date: Date | string | number): string {
  const d = new Date(date)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export const GENRE_GRADIENTS: Record<string, string> = {
  memoir: 'from-[#3b2f4f] to-[#14121C]',
  fiction: 'from-[#2b3a55] to-[#14121C]',
  mystery: 'from-[#43252b] to-[#14121C]',
  romance: 'from-[#4a2b40] to-[#14121C]',
  'sci-fi': 'from-[#1e3d4a] to-[#14121C]',
  fantasy: 'from-[#33305a] to-[#14121C]',
  historical: 'from-[#4a3a24] to-[#14121C]',
  literary: 'from-[#2f3d33] to-[#14121C]',
}

export function genreGradient(genre: string | null | undefined): string {
  if (!genre) return 'from-[#2C2740] to-[#14121C]'
  const key = genre.toLowerCase()
  for (const [k, v] of Object.entries(GENRE_GRADIENTS)) {
    if (key.includes(k)) return v
  }
  return 'from-[#2C2740] to-[#14121C]'
}
