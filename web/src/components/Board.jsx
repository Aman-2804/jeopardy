import React, { useState, useEffect } from 'react'
import Tile from './Tile'
import CategoryTitle from './CategoryTitle'

export default function Board({ data, round, score, setScore }) {
  const categories = data.categories.slice(0, 6)
  const values = round === 'jeopardy' ? [200, 400, 600, 800, 1000] : [400, 800, 1200, 1600, 2000]
  const [isMobile, setIsMobile] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is below 640px (Tailwind's sm breakpoint)
      const mobile = window.innerWidth < 640
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Show hint on mobile after a short delay
    let hintTimer
    let autoHideTimer
    
    if (window.innerWidth < 640) {
      hintTimer = setTimeout(() => {
        setShowScrollHint(true)
        // Auto-hide after 5 seconds
        autoHideTimer = setTimeout(() => setShowScrollHint(false), 5000)
      }, 1000)
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      if (hintTimer) clearTimeout(hintTimer)
      if (autoHideTimer) clearTimeout(autoHideTimer)
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Scroll hint for mobile users */}
      {isMobile && showScrollHint && (
        <div className="mb-3 mx-2 sm:mx-0">
          <div className="bg-yellow-500 bg-opacity-90 text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-between shadow-lg">
            <span>👆 Swipe left and right to see all categories</span>
            <button
              onClick={() => setShowScrollHint(false)}
              className="ml-3 text-black hover:text-gray-800 font-bold text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Single scroll container for both categories and tiles - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-max sm:min-w-0 px-2 sm:px-0">
          {/* Category Headers */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2 mb-1 sm:mb-2">
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

          {/* Clue Grid */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
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
    </div>
  )
}
