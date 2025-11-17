import express from 'express'
import sqlite3 from 'sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import cors from 'cors'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Enable CORS for React frontend
app.use(cors())
app.use(express.json())

// Path to the database
const dbPath = path.join(__dirname, '..', 'jarchive.sqlite3')
const scrapeScriptPath = path.join(__dirname, '..', 'scrape_jarchive.py')

// Helper function to scrape a new game
async function scrapeNewGame() {
  try {
    console.log('Scraping new game...')
    // Run from the parent directory where schema.sql and the script are located
    const scriptDir = path.join(__dirname, '..')
    const { stdout, stderr } = await execAsync(`python3 scrape_jarchive.py`, {
      cwd: scriptDir
    })
    if (stderr && !stderr.includes('NotOpenSSLWarning')) {
      console.error('Scrape script stderr:', stderr)
    }
    console.log('Scrape script output:', stdout)
    return true
  } catch (error) {
    console.error('Error scraping game:', error)
    console.error('Error details:', error.message)
    throw error
  }
}

// Helper function to delete all games from database
function deleteAllGames(db) {
  return new Promise((resolve, reject) => {
    // Check if tables exist first
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='shows'", (err, row) => {
      if (err) {
        console.log('Database might not exist yet, skipping delete')
        resolve() // If database doesn't exist, that's fine
        return
      }
      if (!row) {
        console.log('Shows table does not exist yet, skipping delete')
        resolve()
        return
      }
      db.run('DELETE FROM shows', function(err) {
        if (err) {
          // If table doesn't exist or other error, just log and continue
          console.log('Could not delete games (table might not exist):', err.message)
          resolve() // Don't reject, just continue
        } else {
          console.log(`Deleted all games from database`)
          resolve()
        }
      })
    })
  })
}

// Get a random complete game (always scrapes a new game on app load)
app.get('/api/random-game', async (req, res) => {
  let db = null
  try {
    // Try to open database (will create if doesn't exist)
    db = new sqlite3.Database(dbPath)
    
    // Always delete all existing games first (if database exists)
    await deleteAllGames(db)
    db.close()
    db = null
    
    // Scrape a new random game
    console.log('Scraping new random game...')
    await scrapeNewGame()
    
    // Reopen database after scraping and get the new game
    db = new sqlite3.Database(dbPath)
    return getRandomGame(db, res)
  } catch (error) {
    console.error('Error in random-game endpoint:', error)
    console.error('Error stack:', error.stack)
    if (db) db.close()
    return res.status(500).json({ 
      error: 'Failed to load or scrape game',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Helper function to get and return a random game
function getRandomGame(db, res) {
  // First, try to get the most recently added game (the one we just scraped)
  // This ensures we return the game we just added even if it's not "complete"
  db.get(`
    SELECT s.id, s.show_number
    FROM shows s
    WHERE EXISTS (
      SELECT 1 FROM rounds r WHERE r.show_id = s.id AND r.name = 'jeopardy'
    )
    ORDER BY s.id DESC
    LIMIT 1
  `, (err, game) => {
    if (err) {
      console.error('Database error:', err)
      db.close()
      return res.status(500).json({ error: 'Database error' })
    }
    
    // If no game found, try a less strict query for any game with jeopardy round
    if (!game) {
      db.get(`
        SELECT s.id, s.show_number
        FROM shows s
        WHERE EXISTS (
          SELECT 1 FROM rounds r WHERE r.show_id = s.id AND r.name = 'jeopardy'
        )
        ORDER BY RANDOM()
        LIMIT 1
      `, (err, game2) => {
        if (err || !game2) {
          console.error('No games found in database')
          db.close()
          return res.status(404).json({ error: 'No games found in database' })
        }
        return processGame(db, res, game2.id, game2.show_number)
      })
      return
    }
    
    return processGame(db, res, game.id, game.show_number)
  })
}

// Helper function to process and return game data
function processGame(db, res, showId, showNumber) {
  const approxYear = showNumber ? (1984 + Math.floor((showNumber - 1) / 230)) : null
  
  // Get categories and clues for jeopardy round
  db.all(`
      SELECT c.position, c.name, c.id
      FROM categories c
      JOIN rounds r ON c.round_id = r.id
      WHERE r.show_id = ? AND r.name = 'jeopardy'
      ORDER BY c.position
      LIMIT 6
    `, [showId], (err, categories) => {
      if (err) {
        console.error('Categories error:', err)
        db.close()
        return res.status(500).json({ error: 'Failed to load categories' })
      }
      
      const categoryPromises = categories.map(cat => {
        return new Promise((resolve, reject) => {
          db.all(`
            SELECT id, question, answer, value, row_index, is_daily_double
            FROM clues
            WHERE category_id = ?
            ORDER BY row_index
          `, [cat.id], (err, clues) => {
            if (err) reject(err)
            else resolve({
              title: cat.name,
              clues: clues.map(c => ({
                id: c.id,
                question: c.question,
                answer: c.answer,
                value: c.value,
                rowIndex: c.row_index,
                isDailyDouble: c.is_daily_double === 1
              }))
            })
          })
        })
      })
      
      Promise.all(categoryPromises)
        .then(categoriesData => {
          db.close()
          res.json({
            showId,
            showNumber,
            approxYear,
            categories: categoriesData
          })
        })
        .catch(err => {
          console.error('Clues error:', err)
          db.close()
          res.status(500).json({ error: 'Failed to load clues' })
        })
    })
}

// Get double jeopardy round
app.get('/api/game/:showId/double', (req, res) => {
  const db = new sqlite3.Database(dbPath)
  const showId = req.params.showId
  
  db.all(`
    SELECT c.position, c.name, c.id
    FROM categories c
    JOIN rounds r ON c.round_id = r.id
    WHERE r.show_id = ? AND r.name = 'double'
    ORDER BY c.position
    LIMIT 6
  `, [showId], (err, categories) => {
    if (err) {
      console.error('Categories error:', err)
      db.close()
      return res.status(500).json({ error: 'Failed to load categories' })
    }
    
    const categoryPromises = categories.map(cat => {
      return new Promise((resolve, reject) => {
        db.all(`
          SELECT id, question, answer, value, row_index, is_daily_double
          FROM clues
          WHERE category_id = ?
          ORDER BY row_index
        `, [cat.id], (err, clues) => {
          if (err) reject(err)
          else resolve({
            title: cat.name,
            clues: clues.map(c => ({
              id: c.id,
              question: c.question,
              answer: c.answer,
              value: c.value,
              rowIndex: c.row_index,
              isDailyDouble: c.is_daily_double === 1
            }))
          })
        })
      })
    })
    
    Promise.all(categoryPromises)
      .then(categoriesData => {
        db.close()
        res.json({ categories: categoriesData })
      })
      .catch(err => {
        console.error('Clues error:', err)
        db.close()
        res.status(500).json({ error: 'Failed to load clues' })
      })
  })
})

// Get final jeopardy
app.get('/api/game/:showId/final', (req, res) => {
  const db = new sqlite3.Database(dbPath)
  const showId = req.params.showId
  
  db.get(`
    SELECT cl.id, cl.question, cl.answer, c.name as category
    FROM rounds r
    JOIN categories c ON c.round_id = r.id
    JOIN clues cl ON cl.category_id = c.id
    WHERE r.show_id = ? AND r.name = 'final'
    LIMIT 1
  `, [showId], (err, clue) => {
    db.close()
    
    if (err) {
      console.error('Final jeopardy error:', err)
      return res.status(500).json({ error: 'Failed to load final jeopardy' })
    }
    
    if (!clue) {
      return res.status(404).json({ error: 'No final jeopardy found' })
    }
    
    res.json({
      id: clue.id,
      question: clue.question,
      answer: clue.answer,
      category: clue.category
    })
  })
})

// Delete a game from the database
app.delete('/api/game/:showId', (req, res) => {
  const db = new sqlite3.Database(dbPath)
  const showId = req.params.showId
  
  db.run('DELETE FROM shows WHERE id = ?', [showId], function(err) {
    if (err) {
      console.error('Error deleting game:', err)
      db.close()
      return res.status(500).json({ error: 'Failed to delete game' })
    }
    
    db.close()
    console.log(`Game ${showId} deleted from database`)
    res.json({ success: true, message: `Game ${showId} deleted` })
  })
})

// Serve static files from the React app (after API routes)
app.use(express.static(path.join(__dirname, "dist")))

// Catch-all handler: send back React's index.html file for any non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"))
})

app.listen(PORT, () => {
  console.log(`🎮 Jeopardy API server running on http://localhost:${PORT}`)
})
