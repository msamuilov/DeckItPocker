import { useState } from 'react'
import './StoryTabs.css'

const TABS = [
  { id: 'active', label: 'Active Stories' },
  { id: 'completed', label: 'Completed Stories' },
  { id: 'all', label: 'All Stories' },
]

export default function StoryTabs({
  stories = [],
  currentStoryId,
  onSelectStory,
  onAddStory,
  onStoryStatusChange,
}) {
  const [tab, setTab] = useState('active')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLink, setNewLink] = useState('')

  function handleSubmitAdd(e) {
    e.preventDefault()
    onAddStory?.(newTitle.trim(), newLink.trim())
    setNewTitle('')
    setNewLink('')
    setShowAddForm(false)
  }

  const activeStories = stories.filter((s) => s.status === 'active')
  const completedStories = stories.filter((s) => s.status === 'completed')
  const displayedStories =
    tab === 'active' ? activeStories : tab === 'completed' ? completedStories : stories

  return (
    <div className="story-tabs">
      <div className="story-tabs-header">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`story-tabs-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="story-tabs-count">
              {t.id === 'active'
                ? activeStories.length
                : t.id === 'completed'
                  ? completedStories.length
                  : stories.length}
            </span>
          </button>
        ))}
      </div>
      <ul className="story-tabs-list">
        {displayedStories.map((story) => (
          <li key={story.id} className="story-tabs-item">
            <button
              type="button"
              className={`story-tabs-story ${currentStoryId === story.id ? 'current' : ''}`}
              onClick={() => onSelectStory?.(story.id)}
            >
              {story.link ? (
                <a
                  href={story.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="story-tabs-link"
                >
                  {story.link}
                </a>
              ) : (
                <span className="story-tabs-title">{story.title || story.id}</span>
              )}
            </button>
            {story.status === 'active' && (
              <button
                type="button"
                className="story-tabs-complete"
                onClick={() => onStoryStatusChange?.(story.id, 'completed')}
                title="Mark completed"
              >
                Complete
              </button>
            )}
            {story.status === 'completed' && (
              <button
                type="button"
                className="story-tabs-complete"
                onClick={() => onStoryStatusChange?.(story.id, 'active')}
                title="Mark active"
              >
                Reactivate
              </button>
            )}
          </li>
        ))}
      </ul>
      {showAddForm ? (
        <form className="story-tabs-add-form" onSubmit={handleSubmitAdd}>
          <input
            type="text"
            placeholder="Story title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="story-tabs-add-input"
            autoFocus
          />
          <input
            type="url"
            placeholder="Link (optional)"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            className="story-tabs-add-input"
          />
          <div className="story-tabs-add-actions">
            <button type="submit" className="story-tabs-add-submit">Add</button>
            <button type="button" className="story-tabs-add-cancel" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="story-tabs-add" onClick={() => setShowAddForm(true)}>
          Add story
        </button>
      )}
    </div>
  )
}
