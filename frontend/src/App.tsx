import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, RefreshCw, Trophy, Zap, Sparkles, Smile, ShieldAlert } from 'lucide-react';
import { Difficulty, SudokuCell, HardcodedRank, UserRun } from './types';
import { generateSudoku } from './sudokuEngine';
import SudokuBoard from './components/SudokuBoard';
import Keypad from './components/Keypad';
import RankingList from './components/RankingList';
import GameOverlay from './components/GameOverlay';
import PetalCanvas from './components/PetalCanvas';
import { playPlacementSound, playMistakeSound, playVictorySound, playWelcomeSound } from './utils/audio';
import { supabase } from './utils/supabase';

// Initial global records matching screenshot and premium look (fallback)
const INITIAL_GLOBAL_RANKINGS: HardcodedRank[] = [
  { rank: 1, username: "CYBER_PHOENIX", timeSec: 252.90, avatarUrl: "" },
  { rank: 2, username: "VOID_WALKER", timeSec: 285.20, avatarUrl: "" },
  { rank: 3, username: "HEX_GURU", timeSec: 311.00, avatarUrl: "" }
];

export default function App() {
  // Game states
  const [difficulty, setDifficulty] = useState<Difficulty>('Hard');
  const [cells, setCells] = useState<SudokuCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [totalPlacements, setTotalPlacements] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  
  // Overlay/Scene state
  const [overlayStatus, setOverlayStatus] = useState<'paused' | 'gameover' | 'victory' | 'welcome' | null>('welcome');

  // Persistence/History states
  const [globalRankings, setGlobalRankings] = useState<HardcodedRank[]>(INITIAL_GLOBAL_RANKINGS);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  const [userRuns, setUserRuns] = useState<UserRun[]>(() => {
    const saved = localStorage.getItem('sudoku_user_runs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Fetch global leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      const useSupabase = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (useSupabase) {
        try {
          const { data, error } = await supabase
            .from('scores')
            .select('username, time_spent_seconds')
            .eq('difficulty', difficulty.toLowerCase())
            .order('time_spent_seconds', { ascending: true })
            .limit(10);

          if (error) throw error;

          const ranked = (data || []).map((item, index) => ({
            rank: index + 1,
            username: item.username,
            timeSec: item.time_spent_seconds,
            avatarUrl: ''
          }));
          setGlobalRankings(ranked.length > 0 ? ranked : INITIAL_GLOBAL_RANKINGS);
        } catch (e) {
          console.warn('Failed to fetch leaderboard from Supabase, using fallback:', e);
          setGlobalRankings(INITIAL_GLOBAL_RANKINGS);
        } finally {
          setIsLoadingLeaderboard(false);
        }
      } else {
        // Fallback to local Ruby Sinatra backend API
        try {
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4567/api';
          const res = await fetch(`${API_BASE}/leaderboard?difficulty=${difficulty.toLowerCase()}`);
          if (res.ok) {
            const data = await res.json();
            const ranked = data.map((item: any, index: number) => ({
              rank: index + 1,
              username: item.username,
              timeSec: item.time_spent_seconds,
              avatarUrl: ''
            }));
            setGlobalRankings(ranked.length > 0 ? ranked : INITIAL_GLOBAL_RANKINGS);
          } else {
            setGlobalRankings(INITIAL_GLOBAL_RANKINGS);
          }
        } catch (e) {
          console.warn('Failed to fetch leaderboard from local API, using fallback:', e);
          setGlobalRankings(INITIAL_GLOBAL_RANKINGS);
        } finally {
          setIsLoadingLeaderboard(false);
        }
      }
    };
    fetchLeaderboard();
  }, [difficulty]);

  // Time metrics inside reference to avoid heavy component re-renders
  const [timeSec, setTimeSec] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedOffsetRef = useRef<number>(0);

  // Sync state helpers
  useEffect(() => {
    localStorage.setItem('sudoku_global_ranks', JSON.stringify(globalRankings));
  }, [globalRankings]);

  useEffect(() => {
    localStorage.setItem('sudoku_user_runs', JSON.stringify(userRuns));
  }, [userRuns]);

  // Start fresh board loop
  const initGame = useCallback((diff: Difficulty) => {
    const { puzzleCells } = generateSudoku(diff);
    setCells(puzzleCells);
    setSelectedCell(null);
    setActiveNumber(null);
    setMistakes(0);
    setTotalPlacements(0);
    setHintsUsed(0);
    setTimeSec(0);
    
    // Reset timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    elapsedOffsetRef.current = 0;
    startTimeRef.current = Date.now();
    
    // Automatically close overlay if not welcome
    setOverlayStatus(null);

    // Play delightful neon board startup swoop ring
    playWelcomeSound();
  }, []);

  // Pre-generate a game board on first mount so the board is ready when the welcome screen is dismissed
  useEffect(() => {
    const { puzzleCells } = generateSudoku(difficulty);
    setCells(puzzleCells);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer Tick functions
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    startTimeRef.current = Date.now() - elapsedOffsetRef.current;
    
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setTimeSec(elapsed / 1000);
      elapsedOffsetRef.current = elapsed;
    }, 10); // Update every 10ms for smooth centisecond counts
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Handles starting/pausing from game action loop
  // Only start the timer when a game board actually exists
  useEffect(() => {
    if (!overlayStatus && cells.length > 0) {
      startTimer();
    } else {
      pauseTimer();
    }
    return () => pauseTimer();
  }, [overlayStatus, cells.length, startTimer, pauseTimer]);

  const togglePause = () => {
    if (overlayStatus === null) {
      setOverlayStatus('paused');
    } else if (overlayStatus === 'paused') {
      setOverlayStatus(null);
    }
  };

  // Reset current board
  const handleNewGame = () => {
    initGame(difficulty);
  };

  // Remaining counts map for keypad numbers (count how many slots out of 9 are filled)
  const remainingNumbers = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let num = 1; num <= 9; num++) {
      const placed = cells.filter(c => c.value === num).length;
      counts[num] = Math.max(0, 9 - placed);
    }
    return counts;
  }, [cells]);

  // Derived state to check if board is fully solved
  const isBoardSolved = useMemo(() => {
    return cells.length > 0 && cells.every(c => c.value !== 0 && c.value === c.correctValue);
  }, [cells]);

  // Check board victory condition — wrapped in useCallback to avoid stale closure when called from handleCellInput
  const checkVictory = useCallback((currentCells: SudokuCell[]) => {
    const allFilled = currentCells.every(c => c.value !== 0 && c.value === c.correctValue);
    if (allFilled) {
      pauseTimer();
      setOverlayStatus('victory');

      // Play glorious retro-celebration arpeggio sequence!
      playVictorySound();
      
      // Log personal history
      const newRun: UserRun = {
        id: crypto.randomUUID(),
        difficulty,
        timeSec: elapsedOffsetRef.current / 1000,
        date: new Date().toLocaleDateString(),
        mistakes,
        completed: true
      };
      
      setUserRuns(prev => [newRun, ...prev].slice(0, 50));
    }
  }, [difficulty, mistakes, pauseTimer]);

  // Record a score submission (Support both Supabase and local API fallback)
  const handleLeaderboardSubmit = async (name: string) => {
    const finalSeconds = elapsedOffsetRef.current / 1000;
    const cleanName = name.trim().toUpperCase() || 'ANONYMOUS';

    // Optimistically update local UI immediately
    setGlobalRankings(prev => {
      const updated = [...prev, { rank: 99, username: cleanName, timeSec: finalSeconds, avatarUrl: '' }];
      updated.sort((a, b) => a.timeSec - b.timeSec);
      return updated.map((item, index) => ({ ...item, rank: index + 1 })).slice(0, 10);
    });

    const useSupabase = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (useSupabase) {
      try {
        // Insert score into Supabase
        const { error } = await supabase
          .from('scores')
          .insert([{
            username: cleanName,
            time_spent_seconds: finalSeconds,
            difficulty: difficulty.toLowerCase()
          }]);

        if (error) throw error;

        // Refetch to get the real sorted leaderboard
        const { data } = await supabase
          .from('scores')
          .select('username, time_spent_seconds')
          .eq('difficulty', difficulty.toLowerCase())
          .order('time_spent_seconds', { ascending: true })
          .limit(10);

        const ranked = (data || []).map((item, index) => ({
          rank: index + 1,
          username: item.username,
          timeSec: item.time_spent_seconds,
          avatarUrl: ''
        }));
        setGlobalRankings(ranked.length > 0 ? ranked : INITIAL_GLOBAL_RANKINGS);
      } catch (e) {
        console.warn('Error submitting score to Supabase:', e);
      }
    } else {
      // Fallback to local Ruby Sinatra backend API
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4567/api';
        const res = await fetch(`${API_BASE}/leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanName,
            time: finalSeconds,
            difficulty: difficulty
          })
        });
        
        if (res.ok) {
          const leaderboardRes = await fetch(`${API_BASE}/leaderboard?difficulty=${difficulty.toLowerCase()}`);
          if (leaderboardRes.ok) {
            const data = await leaderboardRes.json();
            const ranked = data.map((item: any, index: number) => ({
              rank: index + 1,
              username: item.username,
              timeSec: item.time_spent_seconds,
              avatarUrl: ''
            }));
            setGlobalRankings(ranked.length > 0 ? ranked : INITIAL_GLOBAL_RANKINGS);
          }
        }
      } catch (e) {
        console.warn('Error submitting score to local API:', e);
      }
    }
  };

  // Inputs a value to selected cell or active keyboard mode targets
  const handleCellInput = useCallback((targetRow: number, targetCol: number, inputVal: number) => {
    setCells(prevCells => {
      let cellToUpdate = prevCells.find(c => c.row === targetRow && c.col === targetCol);
      if (!cellToUpdate || cellToUpdate.isInitial) return prevCells;

      const updatedCells = prevCells.map(c => {
        if (c.row === targetRow && c.col === targetCol) {
          if (isNotesMode) {
            // Notes toggle mode
            const exists = c.notes.includes(inputVal);
            const nextNotes = exists
              ? c.notes.filter(n => n !== inputVal)
              : [...c.notes, inputVal].sort((a, b) => a - b);

            // Play delicate pencil mark sound
            playPlacementSound(true);

            return {
              ...c,
              value: 0, // Clear the central value when writing notes
              isError: false,
              notes: nextNotes
            };
          } else {
            // Standard Value Placements Mode
            const isCorrect = inputVal === c.correctValue;
            
            // Record placements metrics
            setTotalPlacements(p => p + 1);

            if (!isCorrect) {
              // Play friendly, soft retro mistake beep
              playMistakeSound();

              setMistakes(m => m + 1);
            } else {
              // Play elegant success plunk chime
              playPlacementSound(false);
            }

            return {
              ...c,
              value: inputVal,
              isError: !isCorrect,
              notes: [] // Clear notes on placement
            };
          }
        }
        return c;
      });

      // Defer checks to complete state
      setTimeout(() => checkVictory(updatedCells), 100);
      return updatedCells;
    });
  }, [isNotesMode, difficulty, mistakes, pauseTimer]);

  // Interaction handlers on SudokuBoard
  const handleCellSelect = (r: number, c: number) => {
    const isAlreadySelected = selectedCell?.row === r && selectedCell?.col === c;
    if (isAlreadySelected) {
      setSelectedCell(null);
      setActiveNumber(null);
    } else {
      const targetCell = cells.find(item => item.row === r && item.col === c);
      setSelectedCell({ row: r, col: c });

      // Cell-First or Digit-First mapping:
      // If we have an activeNumber selected, and they clicked to fill an empty cell
      if (activeNumber && targetCell && !targetCell.isInitial && targetCell.value === 0) {
        handleCellInput(r, c, activeNumber);
      } else if (targetCell && targetCell.value !== 0) {
        // Highlight occurrences of this number across the board
        setActiveNumber(targetCell.value);
      } else {
        // Clear key state mapping
        setActiveNumber(null);
      }
    }
  };

  // Keyboard number selection is pressed
  const handleNumberSelect = (num: number) => {
    if (activeNumber === num) {
      setActiveNumber(null);
    } else {
      setActiveNumber(num);
      
      // Cell-First mapping: If a cell is active, write to it immediately
      if (selectedCell) {
        const cell = cells.find(c => c.row === selectedCell.row && c.col === selectedCell.col);
        if (cell && !cell.isInitial && cell.value !== num) {
          handleCellInput(selectedCell.row, selectedCell.col, num);
        }
      }
    }
  };

  // Manual Delete of selected active box
  const handleClearCell = () => {
    if (!selectedCell) return;
    setCells(prev => prev.map(c => {
      if (c.row === selectedCell.row && c.col === selectedCell.col && !c.isInitial) {
        return { ...c, value: 0, isError: false, notes: [] };
      }
      return c;
    }));
  };

  // Clear all user inputs and reset board to initial state
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all your entries and reset the board?")) {
      setCells(prev => prev.map(c => {
        if (!c.isInitial) {
          return { ...c, value: 0, isError: false, isRevealed: false, notes: [] };
        }
        return c;
      }));
      setMistakes(0);
      setTotalPlacements(0);
    }
  };

  // Solves the active / first empty box instantly
  const handleGetHint = () => {
    // Locate suitable cell to reveal
    let target = selectedCell
      ? cells.find(c => c.row === selectedCell.row && c.col === selectedCell.col)
      : null;

    if (!target || target.value !== 0) {
      // Sift to find any unsolved cell
      target = cells.find(c => c.value === 0) || null;
    }

    if (target) {
      const { row, col, correctValue } = target;
      
      setHintsUsed(h => h + 1);
      setCells(prev => prev.map(c => {
        if (c.row === row && c.col === col) {
          return {
            ...c,
            value: correctValue,
            isError: false,
            notes: []
          };
        }
        return c;
      }));

      // Auto update active highlights
      setSelectedCell({ row, col });
      setActiveNumber(correctValue);

      setTimeout(() => {
        const fresh = cells.map(c => c.row === row && c.col === col ? { ...c, value: correctValue } : c);
        checkVictory(fresh);
      }, 100);
    }
  };

  // Solves the entire board instantly
  const handleShowSolution = () => {
    if (window.confirm("Do you want to reveal the full solution and complete the grid?")) {
      setCells(prevCells => {
        const solved = prevCells.map(c => ({
          ...c,
          value: c.correctValue,
          isError: false,
          isRevealed: c.value !== c.correctValue,
          notes: []
        }));
        setTimeout(() => checkVictory(solved), 100);
        return solved;
      });
    }
  };

  // Keyboard navigation binds for convenient gaming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (overlayStatus) return; // Ignore on pause/screens
      
      // Check 1-9
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleNumberSelect(num);
        return;
      }

      // Notes Mode Toggle
      if (e.key === 'p' || e.key === 'n') {
        setIsNotesMode(prev => !prev);
        return;
      }

      // Backspace or Delete
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClearCell();
        return;
      }

      // Keyboard arrow keys cell shifting
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedCell) {
        e.preventDefault();
        let { row, col } = selectedCell;
        if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') row = Math.min(8, row + 1);
        if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') col = Math.min(8, col + 1);
        
        const nextCell = cells.find(c => c.row === row && c.col === col);
        setSelectedCell({ row, col });
        if (nextCell && nextCell.value !== 0) {
          setActiveNumber(nextCell.value);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, cells, overlayStatus, handleCellInput, handleNumberSelect]);

  // Clean layout variables
  const accurateRating = useMemo(() => {
    if (totalPlacements === 0) return 100;
    return Math.max(10, Math.min(100, Math.round(((totalPlacements - mistakes) / totalPlacements) * 100)));
  }, [totalPlacements, mistakes]);

  // Formats elapsed stopwatch times as MM:SS.cs
  const formattedMinutes = Math.floor(timeSec / 60).toString().padStart(2, '0');
  const formattedSeconds = Math.floor(timeSec % 60).toString().padStart(2, '0');
  const formattedHund = Math.floor((timeSec % 1) * 100).toString().padStart(2, '0');

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-start p-3 sm:p-6 font-sans overflow-x-hidden selection:bg-sky/40 text-brown-deep">
      {/* Background Falling Flowers Canvas */}
      <PetalCanvas />

      {/* Main Content Layout */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 mt-2 sm:mt-6">
        
        {/* Main Sudoku Card */}
        <div className="bg-cream backdrop-blur-md border border-brown-light/30 rounded-[20px] w-full max-w-[680px] overflow-hidden shadow-[0_8px_40px_rgba(46,31,20,0.08)] flex flex-col">
          
          {/* Header */}
          <header className="p-8 pb-5 max-sm:px-4 max-sm:py-6 relative">
            <div className="text-[10px] tracking-[0.22em] text-brown-mute uppercase font-bold mb-2">
              made just for you ✦
            </div>
            <h1 className="font-display italic font-bold text-4xl sm:text-5xl text-brown-deep leading-none">
              <span className="font-sans not-italic font-normal text-lg text-brown-mute block mb-1">
                sudoku for
              </span>
              kallee
            </h1>
            <p className="text-xs text-brown-light italic mt-2.5 tracking-wide">
              i always be there for you, don't be a stranger ♡
            </p>
          </header>

          {/* Difficulty Strip */}
          <div className="bg-sky/[0.18] border-y border-sky/35 px-8 py-2.5 max-sm:px-4 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-sky-mid tracking-wider uppercase font-semibold mr-1 select-none">
              difficulty
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {(['Easy', 'Medium', 'Hard', 'Expert', 'Master'] as Difficulty[]).map((d) => {
                const isActive = difficulty === d;
                return (
                  <button
                    id={`btn-diff-${d}`}
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      initGame(d);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-sky/38 border-[rgba(100,180,200,0.7)] text-sky-text shadow-sm font-bold'
                        : 'bg-white/45 border-sky/60 text-sky-text hover:bg-sky/20'
                    }`}
                  >
                    {d.toLowerCase()}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] text-sky-mid italic ml-auto max-sm:w-full max-sm:mt-1 max-sm:text-right select-none">
              puzzle #{difficulty.toLowerCase()} ✦ pick
            </span>
          </div>

          {/* Game Workbench */}
          <div className="px-8 py-5 max-sm:px-4 max-sm:py-4 grid grid-cols-1 sm:grid-cols-[1fr_130px] gap-5 items-start">
            
            {/* Left side: Board wrap */}
            <div className="w-full">
              <div className="relative">
                <SudokuBoard
                  cells={cells}
                  selectedCell={selectedCell}
                  onCellSelect={handleCellSelect}
                  highlightNumber={activeNumber}
                />

                {isBoardSolved && overlayStatus === null && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-sand/95 border border-sky-mid/40 rounded-full px-4 py-2.5 flex items-center gap-3 font-sans text-xs shadow-md">
                    <span className="text-sky-text font-bold tracking-wider">🏆 GRID COMPLETE!</span>
                    <button
                      onClick={() => setOverlayStatus('victory')}
                      className="bg-sky hover:bg-sky/80 text-sky-text font-bold px-3 py-1 rounded-full text-[10px] transition-all whitespace-nowrap cursor-pointer border border-sky-mid/20"
                    >
                      REOPEN RESULTS
                    </button>
                  </div>
                )}

                {/* Game Overlay */}
                <GameOverlay
                  status={overlayStatus}
                  difficulty={difficulty}
                  timeSec={timeSec}
                  onAction={
                    overlayStatus === 'welcome'
                      ? () => setOverlayStatus(null)
                      : overlayStatus === 'paused'
                        ? () => setOverlayStatus(null)
                        : overlayStatus === 'gameover' || overlayStatus === 'victory'
                          ? handleNewGame
                          : () => {}
                  }
                  onChangeDifficulty={(diff) => {
                    setDifficulty(diff);
                    initGame(diff);
                  }}
                  onSubmitScore={handleLeaderboardSubmit}
                  onDismiss={() => setOverlayStatus(null)}
                />
              </div>
            </div>

            {/* Right side: Sidebar (Timer, Mistakes, Message, Hint) */}
            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-col w-full sm:w-[130px]">
              
              {/* Timer */}
              <div className="bg-[#fffcf8]/55 border border-brown-light/22 rounded-xl p-3 text-center flex flex-col justify-center relative">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-display text-2xl font-normal text-brown-deep leading-none">
                    {formattedMinutes}:{formattedSeconds}
                  </span>
                  <button
                    id="btn-pause-sidebar"
                    onClick={togglePause}
                    type="button"
                    className="p-1 rounded-full text-brown-mid hover:text-brown-deep hover:bg-brown-light/10 transition-all cursor-pointer flex items-center justify-center"
                    title={overlayStatus === 'paused' ? 'Resume' : 'Pause'}
                  >
                    {overlayStatus === 'paused' ? (
                      <Play className="w-3.5 h-3.5 fill-current text-sky-text animate-pulse" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="text-[9px] text-brown-mute tracking-widest lowercase mt-1.5 select-none">
                  elapsed
                </div>
              </div>

              {/* Mistakes */}
              <div className="bg-[#fffcf8]/55 border border-brown-light/22 rounded-xl p-3 text-center flex flex-col justify-center">
                <span className="font-display text-2xl font-normal text-brown-deep leading-none">
                  {mistakes}
                </span>
                <span className="text-[9px] text-brown-mute tracking-widest lowercase mt-1.5 select-none">
                  mistakes
                </span>
              </div>

              {/* Message Banner */}
              <div className="bg-terracotta/[0.08] border border-terracotta/20 rounded-xl p-3 text-[11px] text-[#7a4e3e] italic leading-relaxed text-center flex items-center justify-center col-span-2 sm:col-span-1">
                {isBoardSolved
                  ? "brilliant work, sweetheart! 🏆"
                  : mistakes === 0
                    ? "fill in the blanks, darling ♡"
                    : mistakes === 1
                      ? "don't rush, love. take your time. ☕"
                      : mistakes === 2
                        ? "breath in, breath out. you got this! 🌸"
                        : "keep going, beautiful! mistakes are steps to learning. ✨"}
              </div>

              {/* Hint Card */}
              <div
                id="btn-hint-card"
                onClick={handleGetHint}
                className="bg-sky/[0.18] border border-sky/35 rounded-xl p-2.5 text-center cursor-pointer hover:bg-sky/30 transition-colors flex flex-col justify-center select-none col-span-2 sm:col-span-1"
              >
                <span className="text-xs font-bold text-sky-text uppercase tracking-wide">
                  need a hint?
                </span>
                <span className="text-[9px] text-sky-mid mt-1">
                  clicks: {hintsUsed}
                </span>
              </div>
            </div>

          </div>

          {/* Keypad */}
          <div className="px-8 pb-4 max-sm:px-4">
            <Keypad
              activeNumber={activeNumber}
              onNumberSelect={handleNumberSelect}
              onClearCell={handleClearCell}
              onGetHint={handleGetHint}
              onShowSolution={handleShowSolution}
              onClearAll={handleClearAll}
              isNotesMode={isNotesMode}
              onToggleNotesMode={() => setIsNotesMode(!isNotesMode)}
              remainingNumbers={remainingNumbers}
            />
          </div>

          {/* Footer */}
          <footer className="px-8 py-4 max-sm:px-4 flex items-center gap-2 border-t border-brown-light/15 flex-wrap">
            <button
              id="btn-newgame-footer"
              onClick={handleNewGame}
              className="bg-brown-deep text-sand font-bold rounded-full px-5 py-2 hover:opacity-85 transition-opacity text-xs tracking-wider uppercase cursor-pointer"
            >
              new puzzle
            </button>
            
            <button
              id="btn-clear-footer"
              onClick={handleClearAll}
              className="bg-transparent text-brown-mute border border-brown-light/35 hover:bg-brown-light/10 font-medium rounded-full px-4.5 py-1.5 transition-colors text-xs tracking-wide cursor-pointer"
            >
              clear board
            </button>

            <div className="flex gap-1.5 ml-auto items-center select-none">
              <div className="w-2.5 h-2.5 rounded-full bg-terracotta" />
              <div className="w-2.5 h-2.5 rounded-full bg-sky" />
              <div className="w-2.5 h-2.5 rounded-full bg-brown-light/35" />
            </div>
          </footer>

        </div>

        {/* Sidebar Scoreboard / Leaderboard (Local and Global tabs) */}
        <div className="w-full max-w-[680px] lg:max-w-none lg:w-[320px] shrink-0">
          <RankingList
            currentDifficulty={difficulty}
            userRuns={userRuns}
            globalRankings={globalRankings}
            isLoading={isLoadingLeaderboard}
            onClearHistory={() => setUserRuns([])}
          />
        </div>

      </div>
    </div>
  );
}
