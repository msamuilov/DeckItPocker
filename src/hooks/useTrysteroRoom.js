import { useEffect, useRef, useCallback, useState } from 'react'
import { joinRoom, selfId } from 'trystero'
import {
  mergeState,
  createInitialSession,
  createPlayer,
  createStory,
  getVotedForStory,
} from '../state/sessionState'

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
        if (!players.some((p) => p.id === myId)) {
          players.push(createPlayer(myId))
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
        votes[storyId] = { ...(votes[storyId] ?? {}), [myId]: value }
        const players = (prev.players ?? []).map((p) =>
          p.id === myId
            ? { ...p, voted: true, lastVoteAt: Date.now(), currentVote: value }
            : p
        )
        const next = { ...prev, votes, players }
        broadcastState(next)
        return next
      })
    },
    [myId, broadcastState]
  )

  const revealVotes = useCallback(() => {
    updateSession({ revealVotes: true })
  }, [updateSession])

  const addPlayer = useCallback(
    (name) => {
      setState((prev) => {
        const players = [...(prev.players ?? [])]
        const me = players.find((p) => p.id === myId)
        if (me) {
          const idx = players.indexOf(me)
          players[idx] = { ...me, name }
        } else {
          players.push(createPlayer(myId, name || `Guest-${myId.slice(0, 6)}`))
        }
        const next = { ...prev, players }
        broadcastState(next)
        return next
      })
    },
    [myId, broadcastState]
  )

  const initSession = useCallback(() => {
    setState((prev) => {
      if (prev.session) return prev
      const session = createInitialSession(roomId, 'Planning session', myId)
      const players = [createPlayer(myId)]
      const next = { session, players: [...players], votes: prev.votes ?? {} }
      sendStateRef.current?.(next)
      return next
    })
  }, [roomId, myId])

  const kickPlayer = useCallback(
    (playerId) => {
      setState((prev) => {
        const session = prev.session
        if (!session || session.adminId !== myId) return prev
        const kicked = [...(session.kickedPlayerIds ?? []), playerId]
        const next = { ...prev, session: { ...session, kickedPlayerIds: kicked } }
        broadcastState(next)
        return next
      })
    },
    [myId, broadcastState]
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
  const kickedIds = state.session?.kickedPlayerIds ?? []
  const playersFiltered = (state.players ?? []).filter((p) => !kickedIds.includes(p.id))
  const playersForSidebar = getVotedForStory(
    playersFiltered,
    state.votes ?? {},
    currentStoryId
  )
  const waitingCount = playersForSidebar.filter((p) => !p.voted).length
  const isAdmin = state.session?.adminId === myId
  const kickedOut = kickedIds.includes(myId)

  return {
    state,
    myPlayerId: myId,
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
    broadcastState,
  }
}
