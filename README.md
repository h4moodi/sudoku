# 🎮 Kalle's Sudoku — Neon Pulse Arcade

A neon-styled, arcade-inspired Sudoku game with 5 difficulty levels, a global leaderboard, retro synth sound effects, and smooth micro-animations.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + TailwindCSS v4 |
| Backend | Ruby 3 + Sinatra + SQLite3 |
| Audio | Web Audio API (procedurally generated) |

## Features

- 🎯 **5 Difficulty levels** — Easy, Medium, Hard, Expert, Master
- 🏆 **Global leaderboard** — persistent scores via SQLite backend
- 📊 **Personal history** — last 50 runs saved in localStorage
- 🖊️ **Notes mode** — pencil-mark candidate digits
- 💡 **Hint system** — reveals one correct cell
- ⌨️ **Full keyboard support** — Arrow keys + 1–9 + Backspace
- 🔊 **Retro synth sounds** — Web Audio API, no files needed
- ⏱️ **Centisecond timer** — high-resolution stopwatch

## Running Locally

### Quick Start (Windows)
Double-click `start.bat` — it launches both servers automatically.

### Manual Start

**Backend** (port 4567):
```bash
cd backend
bundle install
bundle exec ruby app.rb
```

**Frontend** (port 3000):
```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000**

## Project Structure

```
kallesudoku/
├── backend/          # Ruby Sinatra API
│   ├── app.rb        # API routes (leaderboard GET/POST)
│   ├── database.rb   # SQLite3 helpers
│   └── Gemfile
├── frontend/         # React Vite app
│   ├── src/
│   │   ├── App.tsx           # Main game logic
│   │   ├── sudokuEngine.ts   # Puzzle generator
│   │   ├── components/
│   │   │   ├── SudokuBoard.tsx
│   │   │   ├── Keypad.tsx
│   │   │   ├── GameOverlay.tsx
│   │   │   └── RankingList.tsx
│   │   └── utils/audio.ts    # Web Audio synth engine
│   └── index.html
├── start.bat         # Windows launcher
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/leaderboard?difficulty=hard` | Top 10 times for a difficulty |
| `POST` | `/api/leaderboard` | Submit a score `{ username, time, difficulty }` |
| `GET` | `/api/health` | Health check |
