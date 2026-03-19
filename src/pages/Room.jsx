import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import CardGrid from '../components/CardGrid'
import StoryTabs from '../components/StoryTabs'
import { getAverageVote, formatAverage } from '../utils/averageVote'
import './Room.css'

const DEADLINE_OPTIONS = [
  { label: '2h', ms: 2 * 60 * 60 * 1000 },
  { label: '8h', ms: 8 * 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
]

function formatCountdown(deadlineMs) {
  const left = Math.max(0, deadlineMs - Date.now())
  const totalSeconds = Math.floor(left / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export default function Room({
  roomId,
  userName,
  theme,
  onThemeToggle,
  session,
  players,
  votes,
  myPlayerId,
  onVote,
  onReveal,
  onAddStory,
  onStoryStatusChange,
  onSessionUpdate,
  onCopyInvite,
  inviteUrl,
  onNameClick,
  isAdmin,
  onKick,
  setVoteDeadline,
  voteDeadline,
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [countdown, setCountdown] = useState('')
  const currentStoryId = session?.currentStoryId ?? null
  const revealVotes = session?.revealVotes ?? false
  const stories = session?.stories ?? []
  const waitingCount = players.filter((p) => !p.voted).length
  const sessionStartedAt = session?.createdAt ? new Date(session.createdAt).getTime() : null

  useEffect(() => {
    if (!voteDeadline || revealVotes) return
    setCountdown(formatCountdown(voteDeadline))
    const t = setInterval(() => setCountdown(formatCountdown(voteDeadline)), 1000)
    return () => clearInterval(t)
  }, [voteDeadline, revealVotes])

  const sessionTitle = session?.title || 'Planning session'
  const storyVotes = currentStoryId ? votes?.[currentStoryId] : null
  const averageVote =
    revealVotes && storyVotes && Object.keys(storyVotes).length > 0
      ? getAverageVote(storyVotes)
      : null
  const averageLabel = averageVote != null ? formatAverage(averageVote) : null

  function startEditTitle() {
    setTitleDraft(sessionTitle)
    setEditingTitle(true)
  }

  function saveTitle() {
    const t = titleDraft.trim() || sessionTitle
    onSessionUpdate?.({ title: t })
    setEditingTitle(false)
  }

  return (
    <div className="app-layout">
      <TopBar
        userName={userName}
        theme={theme}
        onThemeToggle={onThemeToggle}
        onNameClick={onNameClick}
      />
      <div className="app-main">
        <main className="app-content">
          <div className="room-header">
            {editingTitle ? (
              <input
                className="room-title-input"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                autoFocus
                aria-label="Session title"
              />
            ) : (
              <h1 className="room-title" onClick={startEditTitle} title="Click to edit">
                {sessionTitle}
              </h1>
            )}
            {currentStoryId && (() => {
              const story = stories.find((s) => s.id === currentStoryId)
              return story?.link ? (
                <a
                  href={story.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="room-story-link"
                >
                  {story.link}
                </a>
              ) : null
            })()}
          </div>
          <div className="room-cards-wrap">
            {revealVotes && averageLabel && (
              <div className="room-average" aria-live="polite">
                Average: <strong>{averageLabel}</strong>
              </div>
            )}
            <CardGrid
              selectedValue={votes?.[currentStoryId]?.[myPlayerId]}
              reveal={revealVotes}
              votes={revealVotes ? votes?.[currentStoryId] : null}
              onSelect={onVote}
              currentStoryId={currentStoryId}
            />
          </div>
          {currentStoryId && (
            <div className="room-actions">
              {!revealVotes ? (
                <>
                  {voteDeadline ? (
                    <div className="room-deadline">
                      <span className="room-deadline-label">Voting closes in</span>
                      <span className="room-deadline-countdown">{countdown}</span>
                    </div>
                  ) : (
                    <div className="room-deadline-options">
                      <span className="room-deadline-label">Close voting in:</span>
                      {DEADLINE_OPTIONS.map(({ label, ms }) => (
                        <button
                          key={label}
                          type="button"
                          className="room-deadline-btn"
                          onClick={() => setVoteDeadline?.(ms)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  <button type="button" className="room-reveal-btn" onClick={onReveal}>
                    Reveal now
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="room-new-round-btn"
                  onClick={() => onSessionUpdate?.({ revealVotes: false, voteDeadline: null })}
                >
                  New round
                </button>
              )}
            </div>
          )}
          <StoryTabs
            stories={stories}
            currentStoryId={currentStoryId}
            onSelectStory={(id) => onSessionUpdate?.({ currentStoryId: id })}
            onAddStory={onAddStory}
            onStoryStatusChange={onStoryStatusChange}
          />
        </main>
        <div className="app-sidebar">
          <Sidebar
            waitingCount={waitingCount}
            players={players}
            sessionStartedAt={sessionStartedAt}
            onInviteClick={onCopyInvite}
            inviteUrl={inviteUrl}
            isAdmin={isAdmin}
            myPlayerId={myPlayerId}
            onKick={onKick}
            currentStoryId={currentStoryId}
            revealVotes={revealVotes}
            votes={votes}
          />
        </div>
      </div>
    </div>
  )
}
