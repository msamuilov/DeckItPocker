import './CardGrid.css'

const CARD_VALUES = ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕']

export default function CardGrid({ selectedValue, reveal, votes, onSelect, currentStoryId }) {
  const canSelect = !!currentStoryId && !reveal

  return (
    <div className="card-grid" role="group" aria-label="Planning poker cards">
      {CARD_VALUES.map((value) => {
        const isSelected = selectedValue === value
        const voteCount = reveal && votes ? Object.values(votes).filter((v) => v === value).length : 0
        return (
          <button
            key={value}
            type="button"
            className={`card ${isSelected ? 'card-selected' : ''}`}
            disabled={!canSelect}
            onClick={() => canSelect && onSelect?.(value)}
            aria-pressed={isSelected}
            aria-label={`Estimate ${value}`}
          >
            <span className="card-corner card-corner-tl">{value}</span>
            <span className="card-corner card-corner-br">{value}</span>
            {reveal && voteCount > 0 ? (
              <span className="card-reveal-count">{voteCount}</span>
            ) : (
              <span className="card-value">{value}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
