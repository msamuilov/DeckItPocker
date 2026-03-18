import { useEffect, useRef, useCallback, useState } from 'react'
import { joinRoom, selfId } from 'trystero'
import {
  mergeState,
  createInitialSession,
  createPlayer,
  createStory,
  getVotedForStory,
} from '../state/sessionState'
import { getOrCreatePersistentPlayerId } from '../utils/persistentPlayerId'

const APP_ID = 'deckitpocker'
const STATE_ACTION = 'state'

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
  const broadcastState = useCallback((next) => {
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
    sendStateRef.current = sendState

    getState((incoming, peerId) => {
      setState((prev) => {
        const merged = mergeState(prev, incoming, myId)
        return merged
      })
    })

    room.onPeerJoin((peerId) => {
      setState((prev) => {
        const session = prev.session ?? createInitialSession(roomId)
        const players = [...(prev.players ?? [])]
        const alreadyHaveUs = players.some((p) => (p.persistentId || p.id) === myPersistentId)
        if (!alreadyHaveUs) {
          players.push(createPlayer(myId, `Guest-${myPersistentId.slice(0, 8)}`, myPersistentId))
        }
        const next = { session, players: [...players], votes: prev.votes ?? {} }
        sendState(next)
        return mergeState(prev, next, myId)
      })
    })

    return () => {
      room.leave()
      roomRef.current = null
    }
  }, [roomId, myId])

  const updateSession = useCallback(
    (patch) => {
      setState((prev) => {
        const session = { ...(prev.session ?? createInitialSession(roomId)), ...patch }
        const next = { ...prev, session }
        broadcastState(next)
        return next
      })
    },
    [roomId, broadcastState]
  )

  const setVote = useCallback(
    (storyId, value) => {
      setState((prev) => {
        const votes = { ...(prev.votes ?? {}) }
        votes[storyId] = { ...(votes[storyId] ?? {}), [myPersistentId]: value }
        const players = (prev.players ?? []).map((p) =>
          (p.persistentId || p.id) === myPersistentId
            ? { ...p, voted: true, lastVoteAt: Date.now(), currentVote: value }
            : p
        )
        const next = { ...prev, votes, players }
        broadcastState(next)
        return next
      })
    },
    [myPersistentId, broadcastState]
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
    (name) => {
      setState((prev) => {
        const players = [...(prev.players ?? [])]
        const me = players.find((p) => (p.persistentId || p.id) === myPersistentId)
        if (me) {
          const idx = players.indexOf(me)
          players[idx] = { ...me, id: myId, name }
        } else {
          players.push(createPlayer(myId, name || `Guest-${myPersistentId.slice(0, 8)}`, myPersistentId))
        }
        const next = { ...prev, players }
        broadcastState(next)
        return next
      })
    },
    [myId, myPersistentId, broadcastState]
  )

  const initSession = useCallback(() => {
    setState((prev) => {
      if (prev.session) return prev
      const session = createInitialSession(roomId, 'Planning session', myPersistentId)
      const players = [createPlayer(myId, `Guest-${myPersistentId.slice(0, 8)}`, myPersistentId)]
      const next = { session, players: [...players], votes: prev.votes ?? {} }
      sendStateRef.current?.(next)
      return next
    })
  }, [roomId, myId, myPersistentId])

  const kickPlayer = useCallback(
    (playerPersistentId) => {
      setState((prev) => {
        const session = prev.session
        if (!session || session.adminId !== myPersistentId) return prev
        const kicked = [...(session.kickedPlayerIds ?? []), playerPersistentId]
        const next = { ...prev, session: { ...session, kickedPlayerIds: kicked } }
        broadcastState(next)
        return next
      })
    },
    [myPersistentId, broadcastState]
  )

  const leaveRoom = useCallback(() => {
    roomRef.current?.leave()
    roomRef.current = null
    sendStateRef.current = null
  }, [])

  const addStory = useCallback(
    (title = '', link = '') => {
      const id = `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setState((prev) => {
        const session = prev.session ?? createInitialSession(roomId)
        const stories = [...(session.stories ?? []), createStory(id, title, link)]
        const newSession = { ...session, stories }
        if (!session.currentStoryId) newSession.currentStoryId = id
        const next = { ...prev, session: newSession }
        broadcastState(next)
        return next
      })
    },
    [roomId, broadcastState]
  )

  const setStoryStatus = useCallback(
    (storyId, status) => {
      setState((prev) => {
        const session = prev.session
        if (!session?.stories) return prev
        const stories = session.stories.map((s) =>
          s.id === storyId ? { ...s, status } : s
        )
        const next = { ...prev, session: { ...session, stories } }
        broadcastState(next)
        return next
      })
    },
    [broadcastState]
  )

  const currentStoryId = state.session?.currentStoryId
  const voteDeadline = state.session?.voteDeadline ?? null
  const kickedIds = state.session?.kickedPlayerIds ?? []

  useEffect(() => {
    if (!voteDeadline || state.session?.revealVotes) return
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
    const existingIsUs = existing && (existing.persistentId || existing.id) === myPersistentId && existing.id === myId
    const preferThis = !existing || (pConnected && !existingConnected) || (pIsUs && !existingIsUs)
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
  const waitingCount = playersForSidebar.filter((p) => !p.voted).length
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
