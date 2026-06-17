-- =============================================================
-- Kalle's Sudoku — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- 1. Create the scores table
CREATE TABLE IF NOT EXISTS scores (
  id              SERIAL PRIMARY KEY,
  username        TEXT    NOT NULL,
  time_spent_seconds FLOAT NOT NULL,
  difficulty      TEXT    NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert', 'master')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index for fast leaderboard queries (per difficulty, sorted by time)
CREATE INDEX IF NOT EXISTS idx_scores_difficulty_time
  ON scores (difficulty, time_spent_seconds ASC);

-- 3. Enable Row Level Security (required for Supabase anon key access)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone to READ scores (public leaderboard)
CREATE POLICY "Allow public reads"
  ON scores FOR SELECT
  USING (true);

-- 5. Allow anyone to INSERT scores (public submission)
CREATE POLICY "Allow public inserts"
  ON scores FOR INSERT
  WITH CHECK (true);
