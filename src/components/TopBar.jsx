import { Link } from 'react-router-dom'
import './TopBar.css'

export default function TopBar({ userName, theme, onThemeToggle, onNameClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link to="/" className="topbar-logo">
          <span className="topbar-logo-icon" aria-hidden>✓</span>
          DeckItPocker
        </Link>
      </div>
      <div className="topbar-right">
        {userName && (
          <button
            type="button"
            className="topbar-user-btn"
            onClick={onNameClick}
            title="Change name"
          >
            {userName}
          </button>
        )}
        <span className="topbar-avatar" aria-hidden role="img">👤</span>
        <button
          type="button"
          className="topbar-theme"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀' : '☽'}
        </button>
      </div>
    </header>
  )
}
