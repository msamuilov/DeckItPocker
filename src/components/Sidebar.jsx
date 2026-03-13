import { useState, useEffect } from 'react'
import './Sidebar.css'

export default function Sidebar({
  waitingCount,
  players = [],
  sessionStartedAt,
  onInviteClick,
  inviteUrl,
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!sessionStartedAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [sessionStartedAt])

  const allVoted = waitingCount === 0 && players.length > 0
  const timer = sessionStartedAt
    ? formatElapsed(now - sessionStartedAt)
    : '00:00:00'

  return (
    <aside className="sidebar">
      <div className={`sidebar-status ${allVoted ? 'sidebar-status-done' : ''}`}>
        {allVoted
          ? 'All voted'
          : `Waiting on ${waitingCount} player${waitingCount !== 1 ? 's' : ''} to vote`}
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
          </li>
        ))}
      </ul>
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
