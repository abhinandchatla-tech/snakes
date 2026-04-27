import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants & Types ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // UP
const GAME_SPEED = 120; // ms

interface Point {
  x: number;
  y: number;
}

const TRACKS = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "AI Synthesist-01",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "cyan"
  },
  {
    id: 2,
    title: "Cyber Drift",
    artist: "Neural Loops",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "pink"
  },
  {
    id: 3,
    title: "Midnight Grid",
    artist: "Deep Static",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "purple"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Use refs for latest state in interval to avoid stale closures if overriding effect
  const directionRef = useRef(direction);
  const nextDirectionRef = useRef(direction); // To prevent multiple quick turns causing self-collision

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const handleNextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  }, []);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    }
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => handleNextTrack();
    
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    }
  }, [handleNextTrack]);

  const formatTime = (time: number) => {
    if (time && !isNaN(time)) {
      const minutes = Math.floor(time / 60);
      const formatMinutes =
        minutes < 10 ? `${minutes}` : `${minutes}`;
      const seconds = Math.floor(time % 60);
      const formatSeconds =
        seconds < 10 ? `0${seconds}` : `${seconds}`;
      return `${formatMinutes}:${formatSeconds}`;
    }
    return '0:00';
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    let isOccupied = true;
    while (isOccupied) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood!;
  }, []);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    setFood(generateFood(INITIAL_SNAKE));
    if (!isPlaying) setIsPlaying(true); // Auto-start music if not playing
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault(); // Prevent scrolling
      }

      if (e.key === ' ' && (!isGameRunning || gameOver)) {
        startGame();
        return;
      }

      const currentDir = directionRef.current;
      let newDir = { ...nextDirectionRef.current };

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) newDir = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) newDir = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) newDir = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) newDir = { x: 1, y: 0 };
          break;
      }
      nextDirectionRef.current = newDir;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  // Main Game Loop
  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const currentDir = nextDirectionRef.current;
        directionRef.current = currentDir;
        setDirection(currentDir);

        const head = prevSnake[0];
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // 1. Check Wall Collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        // 2. Check Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // 3. Check Food Collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
             const newScore = s + 10;
             if (newScore > highScore) {
                 setHighScore(newScore);
             }
             return newScore;
          });
          setFood(generateFood(newSnake));
          // Do not pop the tail
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [isGameRunning, gameOver, food, generateFood, highScore]);

  const handleGameOver = () => {
    setGameOver(true);
    setIsGameRunning(false);
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 h-screen w-full overflow-hidden flex flex-col font-sans relative">
      {/* Header Navigation */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-zinc-950/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(192,38,211,0.5)]">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <span className="text-xl font-black tracking-tighter italic">SYNTH.SNAKE</span>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">Current Score</span>
            <span className="text-2xl font-mono text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">{score.toString().padStart(5, '0')}</span>
          </div>
          <div className="w-[1px] h-10 bg-white/10"></div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">High Score</span>
            <span className="text-2xl font-mono text-fuchsia-500">{highScore.toString().padStart(5, '0')}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar: Playlist */}
        <aside className="w-72 border-r border-white/5 bg-zinc-900/30 p-6 flex flex-col gap-6 shrink-0 z-10">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4">Neural Library</h3>
            <div className="flex flex-col gap-2">
              {TRACKS.map((track, idx) => (
                <div 
                  key={track.id}
                  onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                  className={`group p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    currentTrackIndex === idx 
                      ? 'bg-white/5 border-white/10 ring-1 ring-fuchsia-500/50' 
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
                    currentTrackIndex === idx ? 'bg-fuchsia-600' : 'bg-zinc-800 group-hover:bg-cyan-600'
                  }`}>
                    {currentTrackIndex === idx ? (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    ) : (
                      <div className="w-3 h-3 bg-white/20 rounded-sm"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{track.title}</p>
                    <p className="text-xs text-zinc-500">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-auto">
            <div className="p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl border border-white/5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-fuchsia-500/10 rounded-full blur-2xl"></div>
              <p className="text-[10px] uppercase text-zinc-500 font-bold mb-2">Pro Status</p>
              <p className="text-xs leading-relaxed">Unlock 32-bit lossless neural audio and custom snake skins.</p>
            </div>
          </div>
        </aside>

        {/* Center: Game Arena */}
        <section className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#111_0%,_#050505_100%)] relative overflow-y-auto">
          <div className="relative p-2 rounded-lg bg-zinc-800/20 ring-1 ring-white/10 shrink-0">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-black text-[10px] font-black uppercase rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] z-20">
              {isGameRunning && !gameOver ? "Active Loop" : gameOver ? "System Failure" : "Standby"}
            </div>
            <div 
              className="relative border-2 border-cyan-500/30 rounded bg-black/40 overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)] flex flex-wrap"
              style={{ width: '400px', height: '400px' }}
            >
              {/* Grid Background Lines (Optional visual flair) */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                  backgroundSize: '20px 20px' // MATCH THE GRID CELL SIZE
              }} />

              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnakeHead = snake[0].x === x && snake[0].y === y;
                const isSnakeBody = snake.some((segment, idx) => idx !== 0 && segment.x === x && segment.y === y);
                const isFood = food.x === x && food.y === y;

                return (
                  <div
                    key={i}
                    style={{ width: '20px', height: '20px' }}
                    className={`relative z-10 transition-colors duration-75
                      ${isSnakeHead ? 'bg-fuchsia-400 shadow-[0_0_15px_rgba(192,38,211,0.6)] z-20' : ''}
                      ${isSnakeBody ? 'bg-fuchsia-600 shadow-[0_0_15px_rgba(192,38,211,0.6)]' : ''}
                      ${isFood ? 'bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)] animate-pulse' : ''}
                    `}
                  />
                );
              })}

              {/* Overlays */}
              {!isGameRunning && !gameOver && (
                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <svg width="48" height="48" className="text-cyan-400 mb-4 opacity-80" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                  </svg>
                  <p className="text-xl font-black tracking-widest text-cyan-100 mb-6 uppercase">Insert Coin To Play</p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-cyan-500 text-black font-black rounded hover:bg-cyan-400 transition-colors uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                  >
                    Start System
                  </button>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 z-30 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-red-500/50">
                  <p className="text-4xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">GAME OVER</p>
                  <p className="text-red-200 mb-8 font-medium">Final Score: {score}</p>
                  <button 
                    onClick={startGame}
                    className="px-8 py-3 bg-red-500 text-white font-bold rounded hover:bg-red-400 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  >
                    Reboot Protocol
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex gap-4 z-10 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">CONTROLS:</span>
              <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono font-bold">WASD</span>
              <span className="text-[10px] text-zinc-500 uppercase font-bold">OR</span>
              <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-mono font-bold">ARROWS</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer: Player Controls */}
      <footer className="h-24 bg-zinc-950 border-t border-white/5 px-8 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4 w-1/4">
          <div className="w-12 h-12 rounded-lg bg-fuchsia-600/20 border border-fuchsia-500/50 flex items-center justify-center overflow-hidden shrink-0">
             <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-fuchsia-600/40 to-cyan-500/40"></div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-8">
            <button onClick={handlePrevTrack} className="text-zinc-500 hover:text-white transition-colors">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 4h2v8H4V4zm4 0h2v8H8V4zm4 0h2v8h-2V4z"/></svg>
            </button>
            <button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform">
              {isPlaying ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
              )}
            </button>
            <button onClick={handleNextTrack} className="text-zinc-500 hover:text-white transition-colors">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.5 4v8h-2V4h2zM4 4l6 4-6 4V4z"/></svg>
            </button>
          </div>
          <div className="w-full max-w-md flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden relative cursor-pointer" onClick={(e) => {
                if (audioRef.current && duration) {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const x = e.clientX - rect.left;
                   const perc = x / rect.width;
                   audioRef.current.currentTime = perc * duration;
                }
            }}>
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 pointer-events-none transition-all duration-100 ease-linear" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}></div>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 w-8">
               {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="w-1/4 flex justify-end items-center gap-4">
          <button onClick={() => setIsMuted(!isMuted)}>
             {isMuted ? (
                 <svg width="16" height="16" className="text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
             ) : (
                <svg width="16" height="16" className="text-zinc-500" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.478 7.478 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/><path d="M8 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.854.354L4.792 11H1.5A.5.5 0 0 1 1 10.5v-5A.5.5 0 0 1 1.5 5h3.292l2.854-3.354A.5.5 0 0 1 8 1.5"/></svg>
             )}
          </button>
          <div className="w-24 flex items-center">
              <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
          </div>
        </div>
      </footer>

      <audio 
        ref={audioRef}
        src={currentTrack.url}
      />
    </div>
  );
}
