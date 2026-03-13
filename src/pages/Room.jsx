import { useState } from 'react'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import CardGrid from '../components/CardGrid'
import StoryTabs from '../components/StoryTabs'
import './Room.css'

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
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const currentStoryId = session?.currentStoryId ?? null
  const revealVotes = session?.revealVotes ?? false
  const stories = session?.stories ?? []
  const waitingCount = players.filter((p) => !p.voted).length
  const sessionStartedAt = session?.createdAt ? new Date(session.createdAt).getTime() : null

  const sessionTitle = session?.title || 'Planning session'

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
          <CardGrid
            selectedValue={votes?.[currentStoryId]?.[myPlayerId]}
            reveal={revealVotes}
            votes={revealVotes ? votes?.[currentStoryId] : null}
            onSelect={onVote}
            currentStoryId={currentStoryId}
          />
          {currentStoryId && (
            <div className="room-actions">
              {!revealVotes ? (
                <button type="button" className="room-reveal-btn" onClick={onReveal}>
                  Reveal votes
                </button>
              ) : (
                <button
                  type="button"
                  className="room-new-round-btn"
                  onClick={() => onSessionUpdate?.({ revealVotes: false })}
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
          />
        </div>
      </div>
    </div>
  )
}
