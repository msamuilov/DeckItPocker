import { useEffect, useRef, useCallback, useState } from 'react'
import { joinRoom, selfId } from 'trystero'
import {
  createInitialSession,
  createPlayer,
  createStory,
  getVotedForStory,
} from '../state/sessionState'
import { getOrCreatePersistentPlayerId } from '../utils/persistentPlayerId'

const APP_ID = 'deckitpocker'
const STATE_ACTION = 'state'
const ACTION_ACTION = 'action'

/** Only the organizer (room creator) broadcasts state. Participants send actions; organizer applies and broadcasts. */

export function useTrysteroRoom(roomId) {
  const [state, setState] = useState({
    session: null,
    players: [],
    votes: {},
  })
  const roomRef = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const myId = selfId
  const myPersistentId = getOrCreatePersistentPlayerId()

  const sendStateRef = useRef(null)
  const sendActionRef = useRef(null)

  const isOrganizer = () => stateRef.current.session?.adminId === myPersistentId

  /** Only organizer sends state. Participants never call this to broadcast. */
  const broadcastState = useCallback((next) => {
    if (!isOrganizer()) return
    const sendState = sendStateRef.current
    if (!sendState) return
    const payload = typeof next === 'function' ? next(stateRef.current) : next
    sendState(payload)
  }, [])

  useEffect(() => {
    if (!roomId) return

    const config = { appId: APP_ID }
    const room = joinRoom(config, roomId)
    roomRef.current = room

    const [sendState, getState] = room.makeAction(STATE_ACTION)
    const [sendAction, getAction] = room.makeAction(ACTION_ACTION)
    sendStateRef.current = sendState
    sendActionRef.current = sendAction

    getState((incoming) => {
      if (!incoming || !incoming.session) return
      setState(incoming)
    })

    getAction((data, peerId) => {
      const prev = stateRef.current
      if (!prev.session || prev.session.adminId !== myPersistentId) return
      if (data?.type === 'requestState') {
        sendState(prev)
        return
      }
      const next = applyAction(prev, data, peerId)
      if (next) {
        sendState(next)
        setState(next)
      }
    })

    room.onPeerJoin((peerId) => {
      const prev = stateRef.current
      if (!prev.session || prev.session.adminId !== myPersistentId) return
      const players = [...(prev.players ?? [])]
      const exists = players.some((p) => p.id === peerId)
      if (!exists) {
        players.push(
          createPlayer(peerId, `Guest-${String(peerId).slice(0, 8)}`, peerId, 'other')
        )
      }
      const next = { ...prev, players, votes: prev.votes ?? {} }
      sendState(next)
      setState(next)
    })

    return () => {
      room.leave()
      roomRef.current = null
      sendStateRef.current = null
      sendActionRef.current = null
    }
  }, [roomId, myPersistentId])

  useEffect(() => {
    if (!roomId || !roomRef.current) return
    const hasSession = stateRef.current.session != null
    const peerCount = Object.keys(roomRef.current.getPeers?.() ?? {}).length
    if (hasSession || peerCount === 0) return
    const t = setTimeout(() => {
      if (!stateRef.current.session) {
        sendActionRef.current?.({ type: 'requestState' })
      }
    }, 500)
    return () => clearTimeout(t)
  }, [roomId])

  const updateSession = useCallback(
    (patch) => {
      if (!isOrganizer()) return
      setState((prev) => {
        const session = { ...(prev.session ?? createInitialSession(roomId)), ...patch }
        const next = { ...prev, session }
        sendStateRef.current?.(next)
        return next
      })
    },
    [roomId]
  )

  const setVote = useCallback(
    (storyId, value) => {
      if (isOrganizer()) {
        setState((prev) => {
          const votes = { ...(prev.votes ?? {}) }
          votes[storyId] = { ...(votes[storyId] ?? {}), [myPersistentId]: value }
          const players = (prev.players ?? []).map((p) =>
            (p.persistentId || p.id) === myPersistentId
              ? { ...p, voted: true, lastVoteAt: Date.now(), currentVote: value }
              : p
          )
          const next = { ...prev, votes, players }
          sendStateRef.current?.(next)
          return next
        })
      } else {
        sendActionRef.current?.({ type: 'vote', persistentId: myPersistentId, storyId, value })
        setState((prev) => {
          const votes = { ...(prev.votes ?? {}) }
          votes[storyId] = { ...(votes[storyId] ?? {}), [myPersistentId]: value }
          const players = (prev.players ?? []).map((p) =>
            (p.persistentId || p.id) === myPersistentId
              ? { ...p, voted: true, lastVoteAt: Date.now(), currentVote: value }
              : p
          )
          return { ...prev, votes, players }
        })
      }
    },
    [myPersistentId]
  )

  const revealVotes = useCallback(() => {
    updateSession({ revealVotes: true, voteDeadline: null })
  }, [updateSession])

  const setVoteDeadline = useCallback(
    (durationMs) => {
      const deadline = Date.now() + durationMs
      updateSession({ voteDeadline: deadline, revealVotes: false })
    },
    [updateSession]
  )

  const addPlayer = useCallback(
    (name, role = 'other') => {
      if (isOrganizer()) {
        setState((prev) => {
          const players = [...(prev.players ?? [])]
          const me = players.find((p) => (p.persistentId || p.id) === myPersistentId)
          if (me) {
            const idx = players.indexOf(me)
            players[idx] = { ...me, id: myId, name, role: role || 'other' }
          } else {
            players.push(
              createPlayer(myId, name || `Guest-${myPersistentId.slice(0, 8)}`, myPersistentId, role || 'other')
            )
          }
          const next = { ...prev, players }
          sendStateRef.current?.(next)
          return next
        })
      } else {
        sendActionRef.current?.({
          type: 'join',
          fromPeerId: myId,
          persistentId: myPersistentId,
          name: name || `Guest-${myPersistentId.slice(0, 8)}`,
          role: role || 'other',
        })
        setState((prev) => {
          const players = [...(prev.players ?? [])]
          const me = players.find((p) => (p.persistentId || p.id) === myPersistentId)
          if (me) {
            const idx = players.indexOf(me)
            players[idx] = { ...me, id: myId, name, role: role || 'other' }
          } else {
            players.push(
              createPlayer(myId, name || `Guest-${myPersistentId.slice(0, 8)}`, myPersistentId, role || 'other')
            )
          }
          return { ...prev, players }
        })
      }
    },
    [myId, myPersistentId]
  )

  const initSession = useCallback(() => {
    setState((prev) => {
      if (prev.session) return prev
      const peers = roomRef.current?.getPeers?.() ?? {}
      const peerCount = Object.keys(peers).length
      if (peerCount > 0) return prev
      const session = createInitialSession(roomId, 'Planning session', myPersistentId)
      const players = [
        createPlayer(myId, `Guest-${myPersistentId.slice(0, 8)}`, myPersistentId, 'other'),
      ]
      const next = { session, players, votes: {} }
      sendStateRef.current?.(next)
      return next
    })
  }, [roomId, myId, myPersistentId])

  const kickPlayer = useCallback(
    (playerPersistentId) => {
      if (!isOrganizer()) return
      setState((prev) => {
        const session = prev.session
        if (!session || session.adminId !== myPersistentId) return prev
        const kicked = [...(session.kickedPlayerIds ?? []), playerPersistentId]
        const next = { ...prev, session: { ...session, kickedPlayerIds: kicked } }
        sendStateRef.current?.(next)
        return next
      })
    },
    [myPersistentId]
  )

  const leaveRoom = useCallback(() => {
    roomRef.current?.leave()
    roomRef.current = null
    sendStateRef.current = null
    sendActionRef.current = null
  }, [])

  const addStory = useCallback(
    (title = '', link = '') => {
      if (!isOrganizer()) return
      const id = `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setState((prev) => {
        const session = prev.session ?? createInitialSession(roomId)
        const stories = [...(session.stories ?? []), createStory(id, title, link)]
        const newSession = { ...session, stories }
        if (!session.currentStoryId) newSession.currentStoryId = id
        const next = { ...prev, session: newSession }
        sendStateRef.current?.(next)
        return next
      })
    },
    [roomId]
  )

  const setStoryStatus = useCallback(
    (storyId, status) => {
      if (!isOrganizer()) return
      setState((prev) => {
        const session = prev.session
        if (!session?.stories) return prev
        const stories = session.stories.map((s) =>
          s.id === storyId ? { ...s, status } : s
        )
        const next = { ...prev, session: { ...session, stories } }
        sendStateRef.current?.(next)
        return next
      })
    },
    []
  )

  const currentStoryId = state.session?.currentStoryId
  const voteDeadline = state.session?.voteDeadline ?? null
  const kickedIds = state.session?.kickedPlayerIds ?? []

  useEffect(() => {
    if (!isOrganizer() || !voteDeadline || state.session?.revealVotes) return
    if (Date.now() >= voteDeadline) {
      updateSession({ revealVotes: true, voteDeadline: null })
      return
    }
    const t = setInterval(() => {
      if (Date.now() >= voteDeadline) {
        clearInterval(t)
        updateSession({ revealVotes: true, voteDeadline: null })
      }
    }, 1000)
    return () => clearInterval(t)
  }, [voteDeadline, state.session?.revealVotes, updateSession])

  const connectedPeerIds = new Set(Object.keys(roomRef.current?.getPeers?.() ?? {}))
  const playersMerged = (state.players ?? []).reduce((acc, p) => {
    const key = p.persistentId || p.id
    const existing = acc.get(key)
    const pConnected = connectedPeerIds.has(p.id)
    const existingConnected = existing && connectedPeerIds.has(existing.id)
    const pIsUs = key === myPersistentId && p.id === myId
    const existingIsUs =
      existing &&
      (existing.persistentId || existing.id) === myPersistentId &&
      existing.id === myId
    const preferThis =
      !existing || (pConnected && !existingConnected) || (pIsUs && !existingIsUs)
    if (preferThis) acc.set(key, p)
    return acc
  }, new Map())
  const playersFiltered = Array.from(playersMerged.values()).filter(
    (p) => !kickedIds.includes(p.persistentId || p.id)
  )
  const playersForSidebar = getVotedForStory(
    playersFiltered,
    state.votes ?? {},
    currentStoryId
  )
  const waitingCount = playersForSidebar.filter(
    (p) => p.role !== 'po' && !p.voted
  ).length
  const isAdmin = state.session?.adminId === myPersistentId
  const kickedOut = kickedIds.includes(myPersistentId)

  return {
    state,
    myPlayerId: myPersistentId,
    session: state.session,
    players: playersForSidebar,
    votes: state.votes ?? {},
    waitingCount,
    isAdmin,
    kickedOut,
    updateSession,
    setVote,
    revealVotes,
    addPlayer,
    initSession,
    addStory,
    setStoryStatus,
    kickPlayer,
    leaveRoom,
    setVoteDeadline,
    voteDeadline,
    broadcastState,
  }
}

function applyAction(prev, data, peerId) {
  if (!data || !data.type) return null
  if (!prev.session) return null

  switch (data.type) {
    case 'vote': {
      const { persistentId, storyId, value } = data
      if (!storyId || value == null) return null
      const votes = { ...(prev.votes ?? {}) }
      votes[storyId] = { ...(votes[storyId] ?? {}), [persistentId]: value }
      const players = (prev.players ?? []).map((p) =>
        (p.persistentId || p.id) === persistentId
          ? { ...p, voted: true, lastVoteAt: Date.now(), currentVote: value }
          : p
      )
      return { ...prev, votes, players }
    }
    case 'join': {
      const { fromPeerId, persistentId, name, role } = data
      const players = [...(prev.players ?? [])]
      const idx = players.findIndex((p) => p.id === (fromPeerId ?? peerId))
      if (idx >= 0) {
        players[idx] = {
          ...players[idx],
          persistentId: persistentId ?? players[idx].persistentId,
          name: name ?? players[idx].name,
          role: role || 'other',
        }
      } else {
        players.push(
          createPlayer(
            fromPeerId ?? peerId,
            name || `Guest-${(persistentId || peerId).toString().slice(0, 8)}`,
            persistentId ?? fromPeerId ?? peerId,
            role || 'other'
          )
        )
      }
      return { ...prev, players }
    }
    default:
      return null
  }
}
