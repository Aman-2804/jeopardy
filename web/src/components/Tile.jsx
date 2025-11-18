import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Tile({ value, clue, score, setScore }) {
  const [answered, setAnswered] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showWager, setShowWager] = useState(false)
  const [wager, setWager] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const isDailyDouble = clue.isDailyDouble || false
  const finalValue = isDailyDouble ? (wager ? parseInt(wager) : value) : value
  
  const dailyDoubleAudioRef = useRef(null)
  const correctAudioRef = useRef(null)
  const incorrectAudioRef = useRef(null)

  useEffect(() => {
    dailyDoubleAudioRef.current = new Audio('/daily-double.mp3')
    correctAudioRef.current = new Audio('/correct.mp3')
    incorrectAudioRef.current = new Audio('/incorrect.mp3')
    
    return () => {
      dailyDoubleAudioRef.current?.pause()
      correctAudioRef.current?.pause()
      incorrectAudioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (showWager && isDailyDouble) {
      dailyDoubleAudioRef.current?.play().catch(() => {})
    }
  }, [showWager, isDailyDouble])

  useEffect(() => {
    if (showResult) {
      if (isCorrect) {
        correctAudioRef.current?.play().catch(() => {})
      } else if (userAnswer) {
        // Only play incorrect sound if they submitted an answer, not if they passed
        incorrectAudioRef.current?.play().catch(() => {})
      }
    }
  }, [showResult, isCorrect, userAnswer])

  const handleClick = () => {
    if (!answered) {
      if (isDailyDouble) {
        setShowWager(true)
      } else {
        setShowModal(true)
      }
    }
  }

  const handleWagerSubmit = () => {
    const wagerAmount = parseInt(wager) || value
    // Max wager is the higher of: current score or the max value for the round
    const maxWager = Math.max(score, value)
    // Ensure wager is between $5 and maxWager
    const finalWager = Math.max(5, Math.min(wagerAmount, maxWager))
    setWager(finalWager.toString())
    setShowWager(false)
    setShowModal(true)
  }

  // Helper function to normalize answers for comparison
  const normalizeAnswer = (answer) => {
    if (!answer) return ''
    
    // Convert to lowercase and remove punctuation
    let normalized = answer.trim().toLowerCase().replace(/[^\w\s]/g, '')
    
    // Remove question prefixes (what is, what are, who is, who are, etc.)
    const questionPrefixes = [
      /^what\s+is\s+/i,
      /^what\s+are\s+/i,
      /^who\s+is\s+/i,
      /^who\s+are\s+/i,
      /^where\s+is\s+/i,
      /^where\s+are\s+/i,
      /^when\s+is\s+/i,
      /^when\s+are\s+/i,
      /^how\s+is\s+/i,
      /^how\s+are\s+/i,
      /^which\s+is\s+/i,
      /^which\s+are\s+/i
    ]
    
    for (const prefix of questionPrefixes) {
      normalized = normalized.replace(prefix, '').trim()
    }
    
    return normalized.trim()
  }

  // Helper function to compare answers, handling pluralization
  const compareAnswers = (userAns, correctAns) => {
    // Empty answers are always incorrect
    if (!userAns || !userAns.trim()) return false
    
    const userNorm = normalizeAnswer(userAns)
    const correctNorm = normalizeAnswer(correctAns)
    
    // If normalized user answer is empty, it's incorrect
    if (!userNorm || userNorm.length === 0) return false
    
    // Exact match
    if (userNorm === correctNorm) return true
    
    // Check if one contains the other
    if (userNorm.includes(correctNorm) || correctNorm.includes(userNorm)) return true
    
    // Handle pluralization - remove trailing 's' and compare
    const userSingular = userNorm.replace(/s$/, '')
    const correctSingular = correctNorm.replace(/s$/, '')
    
    if (userSingular === correctNorm || userNorm === correctSingular) return true
    if (userSingular === correctSingular && userSingular.length > 0) return true
    
    // Check if singular forms match when one has 's' and other doesn't
    if (userNorm.endsWith('s') && userNorm.slice(0, -1) === correctNorm) return true
    if (correctNorm.endsWith('s') && correctNorm.slice(0, -1) === userNorm) return true
    
    return false
  }

  const handleSubmit = () => {
    const correct = compareAnswers(userAnswer, clue.answer)
    
    setIsCorrect(correct)
    setShowResult(true)
    
    if (correct) {
      setScore(prevScore => prevScore + finalValue)
    } else {
      setScore(prevScore => Math.max(0, prevScore - finalValue))
    }
  }

  const handlePass = () => {
    setIsCorrect(false)
    setShowResult(true)
  }

  const closeModal = () => {
    setAnswered(true)
    setShowModal(false)
    setShowWager(false)
    setShowResult(false)
    setUserAnswer('')
    setWager('')
  }

  if (answered) {
    return (
      <div className="bg-black h-20 sm:h-24 md:h-28 w-32 sm:w-auto flex items-center justify-center border-2 border-black">
      </div>
    )
  }

  return (
    <>
      <motion.div
        onClick={handleClick}
        className="h-20 sm:h-24 md:h-28 w-32 sm:w-auto flex items-center justify-center font-bold text-2xl sm:text-3xl md:text-4xl cursor-pointer border-2 relative group touch-manipulation"
        style={{
          background: 'var(--jeopardy-gradient)',
          borderColor: '#000',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <div
          className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 group-active:opacity-40 transition-opacity duration-150"
          style={{ pointerEvents: 'none' }}
        />
        <span className="money-value relative z-10 text-2xl sm:text-4xl lg:text-5xl">${value}</span>
      </motion.div>

      <AnimatePresence>
        {showWager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{
              background: 'linear-gradient(135deg, #0A0F99 0%, #071277 50%, #0A0F99 100%)',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="h-full w-full flex items-center justify-center px-4 sm:px-6 md:px-8 py-4 overflow-y-auto"
            >
              <div className="max-w-2xl w-full">
                <div className="bg-yellow-500 border-4 sm:border-6 md:border-8 border-yellow-300 p-4 sm:p-6 md:p-12 rounded-2xl sm:rounded-3xl text-center shadow-2xl">
                  <div className="text-white text-3xl sm:text-4xl md:text-6xl font-black mb-4 sm:mb-6 md:mb-8" style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                    DAILY DOUBLE
                  </div>
                  <div className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8" style={{ fontFamily: 'Georgia, serif' }}>
                    Current Score: ${score}
                  </div>
                  <div className="bg-black bg-opacity-40 p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 md:mb-8">
                    <label className="block text-yellow-300 text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
                      ENTER YOUR WAGER
                    </label>
                    <input
                      type="number"
                      value={wager}
                      onChange={(e) => setWager(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleWagerSubmit()}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 text-xl sm:text-2xl md:text-3xl text-center font-bold rounded-xl border-4 border-white bg-white text-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
                      style={{ fontFamily: 'Georgia, serif' }}
                      placeholder={`Max: $${Math.max(score, value)}`}
                      min="5"
                      max={Math.max(score, value)}
                      autoFocus
                    />
                    <div className="text-white text-base sm:text-lg md:text-xl mt-3 sm:mt-4">
                      Maximum wager: ${Math.max(score, value)}
                    </div>
                  </div>
                  <button
                    className="px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 bg-white text-blue-900 rounded-xl sm:rounded-2xl hover:bg-yellow-300 active:bg-yellow-300 font-black text-lg sm:text-xl md:text-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-105 transition-all min-h-[44px] touch-manipulation"
                    onClick={handleWagerSubmit}
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    CONFIRM WAGER
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{
              background: 'linear-gradient(135deg, #0A0F99 0%, #071277 50%, #0A0F99 100%)',
            }}
          >
            {!showResult ? (
              /* Question Display Screen */
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full w-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-4 overflow-y-auto"
              >
                {/* The Jeopardy Question - Full Screen Centered */}
                <div 
                  className="text-white text-center max-w-6xl mb-4 sm:mb-8"
                  style={{
                    fontFamily: 'Georgia, "ITC Korinna", serif',
                    textShadow: '0 4px 12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight tracking-wide uppercase px-2"
                    style={{ letterSpacing: '0.02em' }}
                  >
                    {clue.question}
                  </motion.div>
                </div>

                {/* Answer Input Section - Appears Below Question */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mt-4 sm:mt-8 md:mt-16 w-full max-w-3xl"
                >
                  <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-white border-opacity-20">
                    <label className="block text-white text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-center tracking-wide">
                      YOUR ANSWER
                    </label>
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl md:text-2xl text-center font-bold rounded-xl border-4 border-white bg-white text-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all"
                      style={{ fontFamily: 'Georgia, serif' }}
                      autoFocus
                    />
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 mt-4 sm:mt-6">
                      <button
                        className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-green-600 text-white rounded-xl hover:bg-green-500 active:bg-green-500 font-bold text-base sm:text-lg md:text-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 transition-all min-h-[44px] touch-manipulation"
                        onClick={handleSubmit}
                      >
                        SUBMIT
                      </button>
                      <button
                        className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 active:bg-gray-600 font-bold text-base sm:text-lg md:text-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-100 transition-all min-h-[44px] touch-manipulation"
                        onClick={handlePass}
                      >
                        PASS
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* Result Display Screen */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="h-full w-full flex items-center justify-center px-4 sm:px-6 md:px-8 py-4 overflow-y-auto"
              >
                <div className="max-w-4xl w-full">
                  <div className={`p-4 sm:p-6 md:p-12 rounded-2xl sm:rounded-3xl text-center shadow-2xl ${
                    isCorrect 
                      ? 'bg-green-600 border-4 sm:border-6 md:border-8 border-green-400' 
                      : 'bg-red-600 border-4 sm:border-6 md:border-8 border-red-400'
                  }`}>
                    {isCorrect ? (
                      <>
                        <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6 animate-bounce">✅</div>
                        <div className="text-white text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4" style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                          CORRECT!
                        </div>
                        <div className="text-white text-xl sm:text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                          You earned ${finalValue}!
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6">❌</div>
                        <div className="text-white text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4" style={{ fontFamily: 'Georgia, serif', textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
                          {userAnswer ? 'INCORRECT!' : 'PASSED'}
                        </div>
                        <div className="bg-black bg-opacity-40 p-4 sm:p-6 rounded-xl mt-4 sm:mt-6 mb-4 sm:mb-6">
                          <div className="text-yellow-300 text-lg sm:text-xl md:text-2xl font-bold mb-2">CORRECT ANSWER:</div>
                          <div className="text-white text-2xl sm:text-3xl md:text-4xl font-bold uppercase px-2" style={{ fontFamily: 'Georgia, serif' }}>
                            {clue.answer}
                          </div>
                        </div>
                        {userAnswer && (
                          <div className="text-white text-xl sm:text-2xl md:text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                            You lost ${finalValue}!
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-center mt-6 sm:mt-8 md:mt-12">
                    <button
                      className="px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 bg-white text-blue-900 rounded-xl sm:rounded-2xl hover:bg-yellow-300 active:bg-yellow-300 font-black text-lg sm:text-xl md:text-2xl shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-105 transition-all min-h-[44px] touch-manipulation"
                      onClick={closeModal}
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      CONTINUE
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
