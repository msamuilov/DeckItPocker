import { useState, useEffect } from 'react'
import './Sidebar.css'

export default function Sidebar({
  waitingCount,
  players = [],
  sessionStartedAt,
  onInviteClick,
  inviteUrl,
  isAdmin = false,
  myPlayerId,
  onKick,
  currentStoryId,
  revealVotes = false,
  votes = {},
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!sessionStartedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [sessionStartedAt])

  const hasActiveStory = !!currentStoryId
  const allVoted = hasActiveStory && waitingCount === 0 && players.length > 0
  const timer = sessionStartedAt
    ? formatElapsed(now - sessionStartedAt)
    : '00:00:00'

  const statusMessage = !hasActiveStory
    ? 'Select a story to vote'
    : allVoted
      ? 'All voted'
      : `Waiting on ${waitingCount} player${waitingCount !== 1 ? 's' : ''} to vote`

  return (
    <aside className="sidebar">
      <div className={`sidebar-status ${allVoted ? 'sidebar-status-done' : ''} ${!hasActiveStory ? 'sidebar-status-idle' : ''}`}>
        {statusMessage}
      </div>
      <div className="sidebar-meta">
        <span>Players:</span>
        <span className="sidebar-timer">{timer}</span>
      </div>
      <ul className="sidebar-players" aria-label="Players">
        {players.map((p) => (
          <li key={p.id} className="sidebar-player">
            <span className="sidebar-player-avatar" aria-hidden>👤</span>
            <span className="sidebar-player-name">{p.name}</span>
            <span
              className={`sidebar-player-voted ${p.voted ? 'voted' : ''}`}
              aria-label={p.voted ? 'Voted' : 'Not voted'}
            >
              {p.voted ? '✓' : '○'}
            </span>
            <span className="sidebar-player-time">
              {p.lastVoteAt ? formatElapsed(Date.now() - p.lastVoteAt) : '00:00:00'}
            </span>
            {isAdmin && (p.persistentId || p.id) !== myPlayerId && onKick && (
              <button
                type="button"
                className="sidebar-player-kick"
                onClick={() => onKick(p.persistentId || p.id)}
                title={`Remove ${p.name}`}
                aria-label={`Remove ${p.name}`}
              >
                Kick
              </button>
            )}
          </li>
        ))}
      </ul>
      {currentStoryId && revealVotes && votes?.[currentStoryId] && (
        <div className="sidebar-revealed-votes" aria-label="Who voted what">
          <h3 className="sidebar-revealed-votes-title">Votes</h3>
          <ul className="sidebar-revealed-votes-list">
            {players
              .filter((p) => (p.persistentId || p.id) in (votes[currentStoryId] || {}))
              .map((p) => (
                <li key={p.persistentId || p.id} className="sidebar-revealed-votes-item">
                  <span className="sidebar-revealed-votes-name">{p.name}</span>
                  <span className="sidebar-revealed-votes-value">{votes[currentStoryId][p.persistentId || p.id]}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
      <div className="sidebar-invite">
        <button type="button" className="sidebar-invite-btn" onClick={onInviteClick}>
          Invite a teammate
        </button>
        {inviteUrl && (
          <p className="sidebar-invite-url">
            <small>Share: {inviteUrl}</small>
          </p>
        )}
      </div>
    </aside>
  )
}

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
