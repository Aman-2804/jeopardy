# Play Any Real Jeopardy Episode (2000–Present)

▶️ [Play Live Demo] https://aman-2804-jeopardy.hf.space

A web-based Jeopardy! trivia game that uses real historical game data from J! Archive. Play classic Jeopardy! rounds with authentic questions and answers.


<div align="center">
  <img src="https://github.com/user-attachments/assets/3d67acce-93ee-4f25-abf0-d5a0b3e51e2d" width="49%" />
  <img src="https://github.com/user-attachments/assets/0e7b7929-592c-45a4-9c56-cadb95235dc2" width="49%" />
</div>

<div align="center">
  <img src="https://github.com/user-attachments/assets/79eca603-d3ff-4f43-b00b-876930248e18" width="49%" />
  <img src="https://github.com/user-attachments/assets/cca683c3-9f09-4bc2-aa45-9254e81687f9" width="49%" />
</div>


## Features

- 🎮 **Authentic Jeopardy Experience**: Play with real questions from historical Jeopardy! games
- 🎨 **Beautiful UI**: Styled to match the classic Jeopardy! board with smooth animations
- 🎵 **Background Music**: Automatic looping Jeopardy! theme music
- 📊 **Score Tracking**: Keep track of your score as you play
- 🔄 **Multiple Rounds**: Play both Jeopardy! and Double Jeopardy! rounds
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

**⚠️ IMPORTANT: Node.js must be installed before proceeding with any installation steps.**

- **Node.js** (v16 or higher) - [Download Node.js](https://nodejs.org/)
- **Python** (v3.7 or higher) - For running the scraping script
- **npm** (comes with Node.js)


## Installation

1. Clone the repository:
```bash
git clone https://github.com/Aman-2804/jeopardy-trivia-game.git
cd jeopardy-trivia-game
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Navigate to the web directory and install Node.js dependencies:
```bash
cd web
npm install
```

## Running the Application

To run both the backend server and frontend development server:

```bash
npm run dev:all
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5173

Open http://localhost:5173 in your browser to play!

### Running Separately

If you prefer to run them separately:

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run dev
```

## Project Structure

```
jeopardy-trivia-game/
├── web/                    # Web application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── Board.jsx
│   │   │   ├── CategoryTitle.jsx
│   │   │   ├── Score.jsx
│   │   │   └── Tile.jsx
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   │   └── jeopardy-themelq.mp3
│   ├── server.js           # Express backend server
│   └── package.json
├── jarchive.sqlite3        # SQLite database with game data
├── schema.sql              # Database schema
└── scrape_jarchive.py      # Script to populate database
```

## Technologies Used

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Audio**: HTML5 Audio API

## Database Setup

The game uses a SQLite database (`jarchive.sqlite3`) containing scraped Jeopardy! game data. If you need to populate or update the database, you can use the `scrape_jarchive.py` script (requires Python and the dependencies listed in `requirements.txt`).

## Development

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## License

This project is for educational purposes. Jeopardy! is a trademark of Jeopardy Productions, Inc.

## Acknowledgments

- Game data sourced from [J! Archive](https://j-archive.com/)
- Jeopardy! is a trademark of Jeopardy Productions, Inc.
