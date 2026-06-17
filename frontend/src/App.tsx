import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Pause, RefreshCw, Trophy, Zap, Sparkles, Smile, ShieldAlert } from 'lucide-react';
import { Difficulty, SudokuCell, HardcodedRank, UserRun } from './types';
import { generateSudoku } from './sudokuEngine';
import SudokuBoard from './components/SudokuBoard';
import Keypad from './components/Keypad';
import RankingList from './components/RankingList';
import GameOverlay from './components/GameOverlay';
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

  // Fetch global leaderboard from Supabase
  useEffect(() => {
    const fetchLeaderboard = async () => {
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
        console.warn('Failed to fetch leaderboard, using fallback:', e);
        setGlobalRankings(INITIAL_GLOBAL_RANKINGS);
      } finally {
        setIsLoadingLeaderboard(false);
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

  // Remaining counts map for keypad numbers
  const remainingNumbers = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let num = 1; num <= 9; num++) {
      const solved = cells.filter(c => c.value === num && c.value === c.correctValue).length;
      counts[num] = Math.max(0, 9 - solved);
    }
    return counts;
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

  // Record a score submission to Supabase
  const handleLeaderboardSubmit = async (name: string) => {
    const finalSeconds = elapsedOffsetRef.current / 1000;
    const cleanName = name.trim().toUpperCase() || 'ANONYMOUS';

    // Optimistically update local UI immediately
    setGlobalRankings(prev => {
      const updated = [...prev, { rank: 99, username: cleanName, timeSec: finalSeconds, avatarUrl: '' }];
      updated.sort((a, b) => a.timeSec - b.timeSec);
      return updated.map((item, index) => ({ ...item, rank: index + 1 })).slice(0, 10);
    });

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
  };

  // Keyboard number selection is pressed
  const handleNumberSelect = (num: number) => {
    setActiveNumber(num);
    
    // Cell-First mapping: If a cell is active, write to it immediately
    if (selectedCell) {
      const cell = cells.find(c => c.row === selectedCell.row && c.col === selectedCell.col);
      if (cell && !cell.isInitial && cell.value !== num) {
        handleCellInput(selectedCell.row, selectedCell.col, num);
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
    <div className="min-h-screen bg-[#15121a] text-white flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 font-sans overflow-x-hidden">
      
      {/* Outer Glow Header Rail */}
      <header className="w-full max-w-7xl flex items-center justify-between border-b border-white/10 pb-3 sm:pb-5 mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-xl md:text-2xl font-extrabold font-display tracking-tight text-white flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <span className="text-neon-pink text-glow-pink">KALLE'S</span>
            <span className="text-white">SUDOKU</span>
          </span>
          <span className="hidden md:inline text-neon-pink/40">|</span>
          <span className="hidden md:inline text-[9px] font-mono tracking-widest text-[#aa888f] uppercase">
            ARCADE REVOLVER v2.0
          </span>
        </div>

        {/* Ticking Timer HUD */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 bg-[#1e1a23] px-2 sm:px-4 py-1.5 rounded-lg border border-neon-pink/30 shadow-[0_0_10px_rgba(255,74,142,0.1)]">
            <span className="text-neon-pink font-semibold text-xs shrink-0 select-none animate-pulse">⏰</span>
            <span className="font-mono text-xs sm:text-base md:text-lg font-bold tracking-wide sm:tracking-widest text-neon-pink-glow text-glow-pink">
              {formattedMinutes}:{formattedSeconds}.{formattedHund}
            </span>
          </div>

          {/* Pause Button */}
          <button
            id="btn-pause-header"
            onClick={togglePause}
            type="button"
            className="p-1.5 sm:p-2 rounded-lg bg-[#2c2832] border border-white/10 text-neon-muted hover:text-white transition-all h-8 sm:h-9 flex items-center justify-center cursor-pointer"
            title="Pause puzzle matrix"
          >
            {overlayStatus === 'paused' ? <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-neon-green" /> : <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Hot New Game block */}
          <button
            id="btn-newgame-header"
            onClick={handleNewGame}
            type="button"
            className="bg-neon-pink hover:bg-neon-pink-glow text-[#65002f] font-bold text-[10px] sm:text-xs uppercase tracking-wider py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition-all text-glow-pink cursor-pointer font-mono whitespace-nowrap"
          >
            NEW GAME
          </button>
        </div>
      </header>

      {/* Main Container Workspace layout */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start flex-1">
        
        {/* COL 1: SELECT DIFFICULTIES (lg:col-span-3) — horizontal strip on mobile, vertical sidebar on desktop */}
        <section id="sidebar-difficulty" className="lg:col-span-3 bg-[#1e1a23] rounded-lg border border-white/5 p-3 sm:p-5 order-2 lg:order-none flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-0">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neon-pink-glow">
                Difficulty
              </h2>
              <p className="text-[11px] text-neon-muted lg:hidden">{difficulty.toUpperCase()}</p>
            </div>
            <p className="hidden lg:block text-[11px] text-neon-muted mb-4">SELECT CHALLENGE</p>

            {/* Horizontal on mobile, vertical on desktop */}
            <nav className="flex flex-row flex-wrap gap-2 mt-2 lg:flex-col lg:space-y-2 lg:gap-0 lg:mt-0 lg:mt-4">
              {([
                { id: 'Easy', icon: '❶' },
                { id: 'Medium', icon: '❷' },
                { id: 'Hard', icon: '❸' },
                { id: 'Expert', icon: '❹' },
                { id: 'Master', icon: '❺' }
              ] as const).map((d) => {
                const isActive = difficulty === d.id;
                return (
                  <button
                    id={`btn-diff-${d.id}`}
                    key={d.id}
                    onClick={() => {
                      setDifficulty(d.id);
                      initGame(d.id);
                    }}
                    className={`
                      flex items-center gap-2 py-2 px-3 lg:w-full lg:justify-between lg:py-3 lg:px-4
                      rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-200 border
                      ${
                        isActive
                          ? 'bg-neon-pink text-[#65002f] border-neon-pink shadow-[0_0_15px_rgba(255,74,142,0.4)]'
                          : 'bg-[#15121a] hover:bg-[#2c2832] text-neon-muted hover:text-white border-white/5'
                      }
                    `}
                  >
                    <span className="opacity-80">{d.icon}</span>
                    <span>{d.id.toUpperCase()}</span>
                    {isActive && (
                      <span className="hidden lg:inline text-[9px] bg-[#65002f]/15 px-2 py-0.5 rounded text-white animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Rules — only show on desktop where there's space */}
          <div className="hidden lg:block mt-8 pt-6 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-neon-pink" />
              <span className="text-[10px] font-mono text-white tracking-widest font-bold">ARCADE PROTOCOLS</span>
            </div>
            <ul className="text-[10px] text-neon-muted space-y-2 list-none font-sans leading-relaxed">
              <li>• Every column, row, and 3x3 block must hold numbers <strong className="text-white">1-9</strong>.</li>
              <li>• Relaxed mode: <strong className="text-neon-pink">Infinite lives</strong> enabled.</li>
              <li>• Use <strong className="text-neon-cyan">Notes</strong> mode to coordinate drafts on tricky squares.</li>
              <li>• Keyboard binds enabled (1-9 to input, Arrow keys to navigate!).</li>
            </ul>
          </div>
        </section>

        {/* COL 2: MAIN PLAY ZONE (lg:col-span-6) — first on mobile */}
        <section id="arena-workbench" className="lg:col-span-6 flex flex-col items-center gap-3 sm:gap-5 order-1 lg:order-none">
          
          {/* Header Accuracy Hud bar */}
          <div className="w-full flex items-center justify-between bg-[#1e1a23] p-2.5 sm:p-4 rounded-lg border border-white/5 font-mono">
            
            {/* Accuracy tracker */}
            <div className="flex flex-col gap-1 w-2/3">
              <div className="flex justify-between items-center pr-2">
                <span className="text-[9px] sm:text-[10px] text-neon-muted font-bold tracking-widest">
                  ACCURACY
                </span>
                <span className="text-xs text-neon-green-glow font-bold">
                  {accurateRating}%
                </span>
              </div>
              
              {/* Segmented accuracy bar */}
              <div className="flex gap-0.5 sm:gap-1 h-2 sm:h-2.5 w-full bg-[#15121a] p-0.5 rounded border border-white/5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const segValue = (i + 1) * 10;
                  const isActive = accurateRating >= segValue;
                  return (
                    <div
                      key={i}
                      className={`
                        flex-1 rounded-sm transition-all duration-300
                        ${
                          isActive
                            ? 'bg-[#2ff801] shadow-[0_0_4px_#2ff801]'
                            : 'bg-white/5'
                        }
                      `}
                    />
                  );
                })}
              </div>
            </div>

            {/* Mistakes tracking */}
            <div className="text-right flex flex-col justify-center items-end">
              <span className="text-[9px] sm:text-[10px] text-neon-muted font-bold tracking-widest uppercase mb-1">
                LIVES
              </span>
              <span className="text-xs sm:text-sm tracking-widest font-bold text-neon-cyan animate-pulse">
                ∞
              </span>
            </div>
          </div>

          {/* Puzzle board container area */}
          <div className="relative w-full">
            <SudokuBoard
              cells={cells}
              selectedCell={selectedCell}
              onCellSelect={handleCellSelect}
              highlightNumber={activeNumber}
            />

            {/* In-Play Overlay State Controller */}
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
            />
          </div>

          {/* Keypad & hint triggers panel */}
          <div className="w-full mt-2">
            <Keypad
              activeNumber={activeNumber}
              onNumberSelect={handleNumberSelect}
              onClearCell={handleClearCell}
              onGetHint={handleGetHint}
              isNotesMode={isNotesMode}
              onToggleNotesMode={() => setIsNotesMode(!isNotesMode)}
              remainingNumbers={remainingNumbers}
            />
          </div>
        </section>

        {/* COL 3: LEADERBOARD / HISTORY (lg:col-span-3) */}
        <section id="sidebar-leaderboard" className="lg:col-span-3 self-stretch flex flex-col order-3 lg:order-none">
          <RankingList
            currentDifficulty={difficulty}
            userRuns={userRuns}
            globalRankings={globalRankings}
            isLoading={isLoadingLeaderboard}
            onClearHistory={() => setUserRuns([])}
          />
        </section>
      </main>

      {/* Decorative Arcade footer info */}
      <footer className="mt-12 text-center text-neon-muted text-[10px] uppercase tracking-widest font-mono">
        <p>COSMIC SLATE THEME • POWERED BY ANTIGRAVITY ENGINE</p>
      </footer>
    </div>
  );
}
