/**
 * In-memory state shape. No DB — synced P2P via Trystero.
 */

export function createInitialSession(roomId, title = 'Planning session') {
  return {
    id: roomId,
    title,
    createdAt: new Date().toISOString(),
    storyLink: null,
    currentStoryId: null,
    stories: [],
    revealVotes: false,
  }
}

export function createPlayer(id, name = `Guest-${id.slice(0, 6)}`) {
  return {
    id,
    name,
    voted: false,
    lastVoteAt: null,
    currentVote: null,
  }
}

export function createStory(id, title = '', link = '') {
  return {
    id,
    title: title || id,
    link: link || null,
    status: 'active',
    estimates: null,
  }
}

/** Merge incoming state from a peer with our state (last-write-wins for session, merge players, merge votes) */
export function mergeState(local, incoming, myPlayerId) {
  if (!incoming) return local

  const session = incoming.session
    ? { ...local?.session, ...incoming.session }
    : local?.session

  const playersMap = new Map()
  ;(local?.players ?? []).forEach((p) => playersMap.set(p.id, { ...p }))
  ;(incoming?.players ?? []).forEach((p) => {
    const existing = playersMap.get(p.id)
    playersMap.set(p.id, existing ? { ...existing, ...p } : { ...p })
  })
  const players = Array.from(playersMap.values())

  const votes = { ...(local?.votes ?? {}), ...(incoming?.votes ?? {}) }

  return {
    session: session || local?.session,
    players,
    votes,
  }
}

export function getVotedForStory(players, votes, storyId) {
  const storyVotes = votes?.[storyId] ?? {}
  return players.map((p) => ({
    ...p,
    voted: p.id in storyVotes,
    lastVoteAt: p.id in storyVotes ? Date.now() : p.lastVoteAt,
    currentVote: storyVotes[p.id] ?? null,
  }))
}
