import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Room from './Room'
import { useTrysteroRoom } from '../hooks/useTrysteroRoom'
import './RoomPage.css'

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
  const [showNameDialog, setShowNameDialog] = useState(() => !getStoredUserName())
  const [nameDraft, setNameDraft] = useState('')

  const {
    session,
    players,
    votes,
    myPlayerId,
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
  } = useTrysteroRoom(roomId || '')

  useEffect(() => {
    if (!roomId) {
      navigate('/', { replace: true })
      return
    }
    initSession()
  }, [roomId, initSession, navigate])

  useEffect(() => {
    if (kickedOut) {
      leaveRoom()
      navigate('/', { replace: true })
    }
  }, [kickedOut, leaveRoom, navigate])

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

  const handleNameSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const name = nameDraft.trim()
      if (name) {
        setUserName(name)
        setStoredUserName(name)
        setShowNameDialog(false)
      }
    },
    [nameDraft]
  )

  const displayName = userName || players.find((p) => p.id === myPlayerId)?.name || `Guest-${myPlayerId?.slice(0, 6) || ''}`
  const inviteUrl = roomId ? window.location.origin + window.location.pathname + '#/room/' + roomId : ''

  if (showNameDialog) {
    return (
      <div className="name-dialog-overlay">
        <div className="name-dialog" role="dialog" aria-labelledby="name-dialog-title">
          <h2 id="name-dialog-title">Choose your name</h2>
          <p className="name-dialog-hint">Enter your display name to join the session.</p>
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              placeholder="Your name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="name-dialog-input"
              autoFocus
              autoComplete="name"
              aria-label="Your name"
            />
            <button type="submit" className="name-dialog-submit" disabled={!nameDraft.trim()}>
              Join
            </button>
          </form>
        </div>
      </div>
    )
  }

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
      isAdmin={isAdmin}
      onKick={kickPlayer}
    />
  )
}
