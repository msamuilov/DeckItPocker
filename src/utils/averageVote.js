/** Map card display value to number for averaging. Returns null for non-numeric (?, ☕). */
const VALUE_TO_NUMBER = {
  '0': 0,
  '½': 0.5,
  '1': 1,
  '2': 2,
  '3': 3,
  '5': 5,
  '8': 8,
  '13': 13,
  '20': 20,
  '40': 40,
  '100': 100,
}

/**
 * Compute average of revealed votes for a story. Ignores ? and ☕.
 * @param {Record<string, string>} storyVotes - playerId -> card value
 * @returns {number | null} average or null if no numeric votes
 */
export function getAverageVote(storyVotes) {
  if (!storyVotes || typeof storyVotes !== 'object') return null
  const nums = Object.values(storyVotes)
    .map((v) => VALUE_TO_NUMBER[v])
    .filter((n) => n !== undefined)
  if (nums.length === 0) return null
  const sum = nums.reduce((a, b) => a + b, 0)
  return sum / nums.length
}

/** Format average for display (e.g. 5.25 -> "5.3", 5 -> "5") */
export function formatAverage(avg) {
  if (avg == null) return null
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1)
}
