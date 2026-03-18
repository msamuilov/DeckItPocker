const STORAGE_KEY = 'deckitpocker-player-id'

function generateId() {
  return 'p-' + Math.random().toString(36).slice(2, 12) + '-' + Date.now().toString(36)
}

export function getOrCreatePersistentPlayerId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return generateId()
  }
}
