/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Gamepad2, PlaySquare, RotateCcw } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 15 },
  { x: 10, y: 16 },
  { x: 10, y: 17 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 150;

const TRACKS = [
  {
    id: 1,
    title: "Neon City Drive",
    artist: "AI Synthwave",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    id: 2,
    title: "Cybernetic Pulse",
    artist: "Neural Network",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200",
  },
  {
    id: 3,
    title: "Digital Horizon",
    artist: "Quantum Beats",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&q=80&w=200&h=200",
  }
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Mechanics ---
  const generateFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    setIsGameRunning(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && gameOver) {
        resetGame();
        return;
      }

      setDirection(prev => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            return prev.y !== 1 ? { x: 0, y: -1 } : prev;
          case 'ArrowDown':
          case 's':
          case 'S':
            return prev.y !== -1 ? { x: 0, y: 1 } : prev;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            return prev.x !== 1 ? { x: -1, y: 0 } : prev;
          case 'ArrowRight':
          case 'd':
          case 'D':
            return prev.x !== -1 ? { x: 1, y: 0 } : prev;
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + direction.x,
          y: head.y + direction.y
        };

        // Check bounds
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const speed = Math.max(50, BASE_SPEED - (Math.floor(score / 50) * 10)); // Gets faster
    const gameLoop = setInterval(moveSnake, speed);
    return () => clearInterval(gameLoop);
  }, [isGameRunning, gameOver, direction, food, score, generateFood]);

  // --- Music Mechanics ---
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(console.error);
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgress(0);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgress(0);
  };

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4 md:p-8 font-sans selection:bg-fuchsia-500/30">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <header className="mb-8 text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 font-mono tracking-widest uppercase mb-2 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
            SynthSnake
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-cyan-400 to-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game Area */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative w-full flex flex-col items-center">
              
              <div className="flex justify-between w-full max-w-[400px] mb-4">
                <div className="flex items-center gap-2 relative">
                  <Gamepad2 className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="font-mono text-cyan-400 uppercase tracking-wider text-sm font-semibold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                    Score: {score}
                  </span>
                </div>
                {gameOver && (
                  <span className="font-mono text-pink-500 uppercase tracking-wider text-sm font-semibold animate-pulse drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                    Game Over
                  </span>
                )}
              </div>

              {/* Game Grid */}
              <div 
                className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,1)] ring-1 ring-cyan-900/50"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  aspectRatio: '1/1',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                }}
              >
                {!isGameRunning && !gameOver && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <button 
                      onClick={() => setIsGameRunning(true)}
                      className="group flex flex-col items-center gap-4 transition-transform hover:scale-110"
                    >
                      <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center border-2 border-cyan-400/30 group-hover:border-cyan-400 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all">
                        <PlaySquare className="w-10 h-10 text-cyan-400 translate-x-[2px]" />
                      </div>
                      <span className="font-mono text-cyan-400 uppercase tracking-widest text-xl font-bold bg-slate-950 px-3 py-1 rounded">Start Game</span>
                    </button>
                    <div className="mt-6 text-sm font-mono text-slate-400 flex gap-6 bg-slate-900/50 py-2 px-4 rounded-full border border-slate-800">
                      <span>Use Arrow Keys</span>
                      <span className="text-slate-600">|</span>
                      <span>WASD</span>
                    </div>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                    <div className="text-pink-500 font-mono text-3xl font-bold mb-2 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] tracking-widest uppercase">System Failure</div>
                    <div className="text-cyan-400 font-mono mb-8 text-xl font-semibold drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">Final Score: {score}</div>
                    <button 
                      onClick={resetGame}
                      className="group flex flex-col items-center gap-3 transition-transform hover:scale-110"
                    >
                      <div className="w-16 h-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center border-2 border-fuchsia-400/40 group-hover:border-fuchsia-400 group-hover:bg-fuchsia-500/20 group-hover:shadow-[0_0_40px_rgba(217,70,239,0.5)] transition-all">
                        <RotateCcw className="w-7 h-7 text-fuchsia-400" />
                      </div>
                      <span className="font-mono text-fuchsia-400 uppercase tracking-widest text-sm font-bold bg-slate-950 px-3 py-1 rounded mt-1">Reboot</span>
                    </button>
                  </div>
                )}

                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                  const x = index % GRID_SIZE;
                  const y = Math.floor(index / GRID_SIZE);
                  const isSnakeHead = snake[0].x === x && snake[0].y === y;
                  const isSnakeBody = snake.some((segment, i) => i !== 0 && segment.x === x && segment.y === y);
                  const isFood = food.x === x && food.y === y;

                  let bgClass = "bg-transparent";
                  if (isSnakeHead) {
                    bgClass = "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,1)] z-10 rounded-sm scale-110";
                  } else if (isSnakeBody) {
                    bgClass = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] rounded-sm opacity-90";
                  } else if (isFood) {
                    bgClass = "bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,1)] rounded-full animate-pulse z-10 scale-90";
                  }

                  return (
                     <div key={index} className="w-full h-full p-[1px] relative">
                        <div className={`absolute inset-[1px] ${bgClass}`} />
                     </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar / Music Player */}
          <div className="flex flex-col gap-6">
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] transition-opacity duration-700 group-hover:opacity-10 pointer-events-none">
                   <Gamepad2 className="w-48 h-48 text-fuchsia-500 transform rotate-12 -translate-y-12 translate-x-12" />
                </div>
                
                <h3 className="text-lg font-bold font-mono tracking-widest text-slate-200 mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                   <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                     <Volume2 className="w-4 h-4 text-fuchsia-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
                   </div>
                   NOW PLAYING
                </h3>

                {/* Cover Art visual */}
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)] group-hover:shadow-[0_10px_40px_rgba(217,70,239,0.15)] ring-1 ring-white/5 transition-all duration-500">
                   <img 
                      src={currentTrack.cover} 
                      alt="Cover Art"
                      className={`w-full h-full object-cover transition-transform duration-[30s] ease-linear ${isPlaying ? 'scale-125' : 'scale-100'}`}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-5">
                      <div className="font-bold text-xl text-white mb-1 drop-shadow-md truncate tracking-wide">{currentTrack.title}</div>
                      <div className="text-cyan-400 text-sm font-mono truncate tracking-wider drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{currentTrack.artist}</div>
                   </div>
                </div>

                {/* Audio Element Hidden */}
                <audio 
                  ref={audioRef}
                  src={currentTrack.src}
                  onTimeUpdate={(e) => {
                    const current = e.currentTarget.currentTime;
                    const duration = e.currentTarget.duration || 1;
                    setProgress((current / duration) * 100);
                  }}
                  onEnded={nextTrack}
                  loop={false}
                />

                {/* Progress Bar */}
                <div className="mb-8 group/progress cursor-pointer py-2 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors" onClick={(e) => {
                  if (!audioRef.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left - 8; // Adjust for px-2 pad
                  const width = rect.width - 16;
                  const percent = Math.max(0, Math.min(1, x / width));
                  audioRef.current.currentTime = percent * (audioRef.current.duration || 0);
                  setProgress(percent * 100);
                }}>
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative ring-1 ring-black/50">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(217,70,239,0.8)]"
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                   <button 
                    onClick={prevTrack}
                    className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 active:scale-95"
                   >
                     <SkipBack className="w-6 h-6 fill-current drop-shadow" />
                   </button>

                   <button 
                    onClick={togglePlay}
                    className="w-16 h-16 bg-fuchsia-600 text-white rounded-full flex items-center justify-center hover:bg-fuchsia-500 hover:scale-105 transition-all shadow-[0_0_25px_rgba(217,70,239,0.5)] hover:shadow-[0_0_35px_rgba(217,70,239,0.8)] focus:outline-none focus:ring-4 focus:ring-fuchsia-500/30 active:scale-95"
                   >
                     {isPlaying ? (
                       <Pause className="w-7 h-7 fill-current drop-shadow-md" />
                     ) : (
                       <Play className="w-7 h-7 fill-current pl-1 drop-shadow-md" />
                     )}
                   </button>

                   <button 
                    onClick={nextTrack}
                    className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 active:scale-95"
                   >
                     <SkipForward className="w-6 h-6 fill-current drop-shadow" />
                   </button>
                </div>

             </div>

             {/* Playlist / Next Up */}
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
               <h4 className="text-xs uppercase tracking-widest text-slate-500 font-mono font-bold mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                 Tracklist
               </h4>
               <div className="flex flex-col gap-2.5">
                  {TRACKS.map((track, idx) => (
                    <button 
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`group flex items-center gap-4 p-2.5 rounded-xl transition-all text-left w-full
                        ${currentTrackIndex === idx ? 'bg-slate-800/80 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.3)] shadow-[0_4px_15px_rgba(0,0,0,0.2)]' : 'hover:bg-slate-800/40 border border-transparent'}`}
                    >
                      <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden relative shadow-md">
                        <img src={track.cover} alt={track.title} className={`w-full h-full object-cover transition-transform duration-700 ${currentTrackIndex === idx && isPlaying ? 'scale-110' : 'group-hover:scale-105'}`} />
                        {currentTrackIndex === idx && isPlaying && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-4 h-4 flex items-end justify-center gap-[2px]">
                              <div className="w-[3px] bg-cyan-400 animate-[bounce_1s_infinite_ease-out_0.1s] rounded-t-sm drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]" style={{ height: '60%' }}></div>
                              <div className="w-[3px] bg-fuchsia-400 animate-[bounce_1s_infinite_ease-out_0.3s] rounded-t-sm drop-shadow-[0_0_3px_rgba(236,72,153,0.8)]" style={{ height: '100%' }}></div>
                              <div className="w-[3px] bg-cyan-400 animate-[bounce_1s_infinite_ease-out_0.5s] rounded-t-sm drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]" style={{ height: '40%' }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className={`text-sm tracking-wide truncate font-bold transition-colors ${currentTrackIndex === idx ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]' : 'text-slate-200 group-hover:text-white'}`}>
                          {track.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate font-mono mt-0.5">
                          {track.artist}
                        </div>
                      </div>
                    </button>
                  ))}
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
