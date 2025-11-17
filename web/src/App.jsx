import React, { useState, useEffect } from 'react'
import Board from './components/Board'
import Score from './components/Score'
import AudioPlayer from './components/AudioPlayer'
import FinalJeopardy from './components/FinalJeopardy'

// Use relative URLs in production, localhost in development
const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : ''

export default function App() {
  const [data, setData] = useState(null)
  const [showId, setShowId] = useState(null)
  const [showNumber, setShowNumber] = useState(null)
  const [approxYear, setApproxYear] = useState(null)
  const [round, setRound] = useState('jeopardy')
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [finalData, setFinalData] = useState(null)
  const [showFinal, setShowFinal] = useState(false)

  const loadRandomGame = async () => {
    setLoading(true)
    setError(null)
    try {
      // Server will always scrape a new game (deletes old ones automatically)
      const response = await fetch(`${API_URL}/api/random-game`)
      if (!response.ok) throw new Error('Failed to load game')
      const gameData = await response.json()
      setData({ categories: gameData.categories })
      setShowId(gameData.showId)
      setShowNumber(gameData.showNumber)
      setApproxYear(gameData.approxYear)
      setRound('jeopardy')
      setScore(0)
    } catch (err) {
      console.error('Error loading game:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadDoubleJeopardy = async () => {
    if (!showId) return
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/game/${showId}/double`)
      if (!response.ok) throw new Error('Failed to load double jeopardy')
      const doubleData = await response.json()
      setData({ categories: doubleData.categories })
      setRound('double')
    } catch (err) {
      console.error('Error loading double jeopardy:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadFinalJeopardy = async () => {
    if (!showId) return
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/game/${showId}/final`)
      if (!response.ok) throw new Error('Failed to load final jeopardy')
      const finalData = await response.json()
      setFinalData(finalData)
      setShowFinal(true)
    } catch (err) {
      console.error('Error loading final jeopardy:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFinalComplete = () => {
    setShowFinal(false)
    setFinalData(null)
    loadRandomGame()
  }

  useEffect(() => {
    loadRandomGame()
  }, [])

  if (loading) return <div className="p-8 text-white text-center text-2xl">Loading game...</div>
  if (error) return <div className="p-8 text-red-500 text-center text-2xl">Error: {error}</div>
  if (!data) return <div className="p-8 text-white text-center text-2xl">No game data</div>

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black border-b border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--money-gold)' }}>
              JEOPARDY!
            </h1>
            {showNumber && (
              <p className="text-white text-xs sm:text-sm mt-1">
                Game #{showNumber} from {approxYear}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Score score={score} />
            <AudioPlayer />
            <button
              className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm sm:text-base min-h-[44px]"
              onClick={() => {
                if (round === 'jeopardy') {
                  loadDoubleJeopardy()
                } else if (round === 'double') {
                  loadFinalJeopardy()
                }
              }}
              disabled={showFinal}
            >
              {round === 'jeopardy' ? 'Next Round' : round === 'double' ? 'Final Jeopardy' : 'Next Round'}
            </button>
            <button
              className="px-3 py-2 sm:px-4 sm:py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 font-bold text-sm sm:text-base min-h-[44px]"
              onClick={loadRandomGame}
            >
              New Game
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 sm:p-4 md:p-6 bg-black">
        {showFinal && finalData ? (
          <FinalJeopardy 
            finalData={finalData} 
            score={score} 
            setScore={setScore}
            onComplete={handleFinalComplete}
          />
        ) : (
          <Board data={data} round={round} score={score} setScore={setScore} />
        )}
      </main>
    </div>
  )
}
