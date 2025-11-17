import React from 'react'
import Tile from './Tile'
import CategoryTitle from './CategoryTitle'

export default function Board({ data, round, score, setScore }) {
  const categories = data.categories.slice(0, 6)
  const values = round === 'jeopardy' ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000]

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Category Headers - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-2 sm:mx-0 pb-2 sm:pb-0">
        <div className="grid grid-cols-6 gap-1 sm:gap-2 mb-1 sm:mb-2 min-w-max sm:min-w-0 px-2 sm:px-0">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="p-1 sm:p-2 h-20 sm:h-28 md:h-36 w-32 sm:w-auto flex items-center justify-center text-center"
              style={{
                background: 'var(--jeopardy-gradient)',
                textShadow: '0 4px 10px rgba(0,0,0,0.7), 0 0 20px rgba(255,255,255,0.05)'
              }}
            >
              <CategoryTitle>
                {cat.title}
              </CategoryTitle>
            </div>
          ))}
        </div>
      </div>

      {/* Clue Grid - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="grid grid-cols-6 gap-1 sm:gap-2 min-w-max sm:min-w-0 px-2 sm:px-0">
          {Array.from({ length: 5 }).map((_, row) =>
            categories.map((cat, col) => (
              <div key={`${row}-${col}`}>
                <Tile
                  value={values[row]}
                  clue={cat.clues[row]}
                  score={score}
                  setScore={setScore}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
