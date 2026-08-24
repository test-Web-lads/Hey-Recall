import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface DraggableVoiceButtonProps {
  isListening: boolean;
  status: 'idle' | 'listening' | 'processing' | 'error';
  audioVolume: number;
  liveTranscript: string;
  onToggleListening: () => void;
  theme: 'off-white' | 'black';
}

export const DraggableVoiceButton: React.FC<DraggableVoiceButtonProps> = ({
  isListening,
  status,
  audioVolume,
  liveTranscript,
  onToggleListening,
  theme,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('recallme_mic_pos');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 72) : 320,
      y: typeof window !== 'undefined' ? Math.max(80, window.innerHeight - 150) : 500,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef(false);

  const clampPosition = (x: number, y: number) => {
    const minX = 10;
    const maxX = Math.max(minX, (typeof window !== 'undefined' ? window.innerWidth : 400) - 66);
    const minY = 60; // below header
    const maxY = Math.max(minY, (typeof window !== 'undefined' ? window.innerHeight : 700) - 130); // above bottom bar

    return {
      x: Math.min(Math.max(minX, x), maxX),
      y: Math.min(Math.max(minY, y), maxY),
    };
  };

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      hasMovedRef.current = true;
    }

    const nextX = dragStartRef.current.initialX + deltaX;
    const nextY = dragStartRef.current.initialY + deltaY;
    setPosition(clampPosition(nextX, nextY));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch (err) {}

      // Snap cleanly to nearest side edge on release
      setPosition((prev) => {
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
        const snapX = prev.x < screenWidth / 2 ? 12 : Math.max(12, screenWidth - 66);
        const finalPos = clampPosition(snapX, prev.y);
        try {
          localStorage.setItem('recallme_mic_pos', JSON.stringify(finalPos));
        } catch (err) {}
        return finalPos;
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasMovedRef.current) {
      onToggleListening();
    }
  };

  const isDark = theme === 'black';

  return (
    <>
      {/* Clean Live Speech Bubble: shows only user speech text */}
      {isListening && (
        <div
          className="fixed z-50 pointer-events-none select-none transition-all animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: Math.max(16, Math.min(window.innerWidth - 290, position.x - 115)),
            top: position.y > 150 ? position.y - 80 : position.y + 64,
            width: 270,
          }}
        >
          <div
            className={'p-3 rounded-2xl shadow-xl border backdrop-blur-xl ' + (
              isDark
                ? 'bg-[#202c33]/90 border-[#2a3942] text-[#e9edef]'
                : 'bg-white/90 border-slate-200 text-slate-900 shadow-slate-300/50'
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#489fb5] animate-ping" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#16697A] dark:text-[#489fb5]">
                Listening
              </span>
            </div>
            <p
              className={'text-xs font-medium italic min-h-[1.5rem] rounded-xl p-2 border leading-relaxed break-words ' + (
                isDark
                  ? 'bg-[#111b21]/70 border-[#2a3942] text-[#e9edef]'
                  : 'bg-slate-50/70 border-slate-200 text-slate-800'
              )}
            >
              {liveTranscript ? '"' + liveTranscript + '"' : 'Say your reminder...'}
            </p>
          </div>
        </div>
      )}

      {/* Floating & Draggable Action Button (Transparent with theme outline) */}
      <div
        className={'fixed z-50 select-none touch-none cursor-grab active:cursor-grabbing ' + (
          isDragging ? 'transition-none scale-105' : 'transition-all duration-150'
        )}
        style={{
          left: position.x + 'px',
          top: position.y + 'px',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {isListening && (
          <div
            className="absolute inset-0 rounded-full border-2 border-[#489fb5] animate-ping duration-1000 pointer-events-none"
            style={{ transform: `scale(${1.3 + audioVolume * 0.4})` }}
          />
        )}

        <button
          type="button"
          onClick={handleClick}
          className={'w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-transform active:scale-90 ' + (
            isListening
              ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-400 shadow-rose-500/30'
              : isDark
              ? 'bg-black/20 hover:bg-black/30 border-2 border-[#16697A] text-[#489fb5] shadow-[#16697A]/25 hover:border-[#489fb5]'
              : 'bg-white/40 hover:bg-white/60 border-2 border-[#16697A] text-[#16697A] shadow-slate-300/40 hover:border-[#16697A]'
          )}
          title="Drag anywhere • Tap to speak"
          aria-label={isListening ? 'Stop listening' : 'Tap to speak reminder'}
        >
          {status === 'processing' ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#16697A] dark:text-[#489fb5]" />
          ) : isListening ? (
            <MicOff className="w-6 h-6 text-rose-400" />
          ) : (
            <Mic className="w-6 h-6 text-[#16697A] dark:text-[#489fb5] stroke-[2.4px]" />
          )}
        </button>
      </div>
    </>
  );
};
