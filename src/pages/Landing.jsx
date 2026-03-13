import { useNavigate } from 'react-router-dom'
import './Landing.css'

function generateRoomId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function Landing() {
  const navigate = useNavigate()

  function handleCreate() {
    const roomId = generateRoomId()
    navigate(`/room/${roomId}`, { replace: true })
  }

  function handleJoin(e) {
    e.preventDefault()
    const input = e.target.querySelector('input')
    const roomId = (input?.value || '').trim()
    if (roomId) {
      navigate(`/room/${roomId}`, { replace: true })
    }
  }

  return (
    <div className="landing">
      <h1 className="landing-title">DeckItPocker</h1>
      <p className="landing-subtitle">Estimate together, no database required.</p>
      <div className="landing-actions">
        <button type="button" className="landing-btn landing-btn-primary" onClick={handleCreate}>
          Create session
        </button>
        <form className="landing-join" onSubmit={handleJoin}>
          <input
            type="text"
            placeholder="Room ID"
            aria-label="Room ID"
            className="landing-input"
          />
          <button type="submit" className="landing-btn landing-btn-secondary">
            Join session
          </button>
        </form>
      </div>
    </div>
  )
}
