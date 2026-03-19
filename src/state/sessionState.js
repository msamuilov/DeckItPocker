/**
 * In-memory state shape. No DB — synced P2P via Trystero.
 */

export function createInitialSession(roomId, title = 'Planning session', adminId = null) {
  return {
    id: roomId,
    title,
    createdAt: new Date().toISOString(),
    storyLink: null,
    currentStoryId: null,
    stories: [],
    revealVotes: false,
    adminId,
    kickedPlayerIds: [],
    voteDeadline: null,
  }
}

export function createPlayer(id, name = `Guest-${id.slice(0, 6)}`, persistentId = null, role = 'other') {
  const pid = persistentId || id
  return {
    id,
    persistentId: pid,
    name,
    role: role || 'other',
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

  let session = incoming.session
    ? { ...local?.session, ...incoming.session }
    : local?.session
  if (session?.adminId == null && incoming.session?.adminId != null) {
    session = { ...session, adminId: incoming.session.adminId }
  }
  if (session && (incoming.session?.kickedPlayerIds?.length || local?.session?.kickedPlayerIds?.length)) {
    const kicked = new Set([
      ...(local?.session?.kickedPlayerIds ?? []),
      ...(incoming.session?.kickedPlayerIds ?? []),
    ])
    session = { ...session, kickedPlayerIds: [...kicked] }
  }

  const playersMap = new Map()
  const playerKey = (p) => p.persistentId || p.id
  ;(local?.players ?? []).forEach((p) => {
    const key = playerKey(p)
    playersMap.set(key, { ...p, persistentId: p.persistentId || p.id })
  })
  ;(incoming?.players ?? []).forEach((p) => {
    const key = playerKey(p)
    const existing = playersMap.get(key)
    playersMap.set(key, existing ? { ...existing, ...p, persistentId: p.persistentId || p.id } : { ...p, persistentId: p.persistentId || p.id })
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
  const voteKey = (p) => p.persistentId || p.id
  return players.map((p) => {
    const key = voteKey(p)
    return {
      ...p,
      voted: key in storyVotes,
      lastVoteAt: key in storyVotes ? Date.now() : p.lastVoteAt,
      currentVote: storyVotes[key] ?? null,
    }
  })
}
