import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import RoomPage from './pages/RoomPage'
import './App.css'

function App() {
  const [theme, setTheme] = useState('dark')

  function handleThemeToggle() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/room/:roomId"
          element={
            <RoomPage theme={theme} onThemeToggle={handleThemeToggle} />
          }
        />
      </Routes>
    </HashRouter>
  )
}

export default App
