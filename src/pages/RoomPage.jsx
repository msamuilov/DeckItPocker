import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Room from './Room'
import { useTrysteroRoom } from '../hooks/useTrysteroRoom'

const USER_NAME_KEY = 'deckitpocker-username'

function getStoredUserName() {
  try {
    return localStorage.getItem(USER_NAME_KEY) || ''
  } catch {
    return ''
  }
}

function setStoredUserName(name) {
  try {
    localStorage.setItem(USER_NAME_KEY, name)
  } catch {}
}

export default function RoomPage({ theme, onThemeToggle }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [userName, setUserName] = useState(getStoredUserName)
  const [inviteCopied, setInviteCopied] = useState(false)

  const {
    session,
    players,
    votes,
    myPlayerId,
    waitingCount,
    updateSession,
    setVote,
    revealVotes,
    addPlayer,
    initSession,
    addStory,
    setStoryStatus,
  } = useTrysteroRoom(roomId || '')

  useEffect(() => {
    if (!roomId) {
      navigate('/', { replace: true })
      return
    }
    initSession()
  }, [roomId, initSession, navigate])

  useEffect(() => {
    if (userName) {
      addPlayer(userName)
      setStoredUserName(userName)
    }
  }, [userName, addPlayer])

  const handleCopyInvite = useCallback(() => {
    const base = window.location.origin + window.location.pathname
    const hash = '#/room/' + roomId
    const url = base + hash
    navigator.clipboard?.writeText(url).then(() => {
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    })
  }, [roomId])

  const handleNameClick = useCallback(() => {
    const name = window.prompt('Your name', userName || '')
    if (name != null && name.trim()) {
      setUserName(name.trim())
    }
  }, [userName])

  const displayName = userName || players.find((p) => p.id === myPlayerId)?.name || `Guest-${myPlayerId?.slice(0, 6) || ''}`
  const inviteUrl = roomId ? window.location.origin + window.location.pathname + '#/room/' + roomId : ''

  return (
    <Room
      roomId={roomId}
      userName={displayName}
      theme={theme}
      onThemeToggle={onThemeToggle}
      session={session}
      players={players}
      votes={votes}
      myPlayerId={myPlayerId}
      onVote={(value) => setVote(session?.currentStoryId, value)}
      onReveal={revealVotes}
      onAddStory={addStory}
      onStoryStatusChange={setStoryStatus}
      onSessionUpdate={updateSession}
      onCopyInvite={handleCopyInvite}
      inviteUrl={inviteCopied ? 'Copied!' : inviteUrl}
      onNameClick={handleNameClick}
    />
  )
}
