import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface AudioPlayerProps {
  src?: string;
  duration?: number;
  isSender?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, duration = 12, isSender = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Generate static pseudo waveform bars
  const totalBars = 28;
  const barHeights = React.useMemo(() => {
    return Array.from({ length: totalBars }, (_, i) => {
      // sinusoidal natural-looking voice wave pattern
      const val = Math.sin(i * 0.4) * 40 + Math.cos(i * 0.9) * 20 + 40;
      return Math.max(20, Math.min(95, Math.floor(val)));
    });
  }, [totalBars]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (!src || src === 'synthetic_audio_note') {
      // Simulated audio playback
      if (isPlaying) {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setIsPlaying(true);
        const startTime = currentTime >= duration ? 0 : currentTime;
        setCurrentTime(startTime);

        const stepMs = 100 / playbackRate;
        const incSec = 0.1;

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
          setCurrentTime(prev => {
            if (prev + incSec >= duration) {
              clearInterval(timerRef.current!);
              setIsPlaying(false);
              return duration;
            }
            return prev + incSec;
          });
        }, stepMs);
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (index: number) => {
    const targetTime = (index / totalBars) * duration;
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const formatTime = (sec: number) => {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${m}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeBarIndex = Math.floor((progressPercent / 100) * totalBars);

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[240px] max-w-[290px] select-none">
      {src && src !== 'synthetic_audio_note' && (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow transition-transform active:scale-95 shrink-0 ${
          isSender
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Time */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Waveform bars */}
        <div className="flex items-center gap-[2.5px] h-7 cursor-pointer py-1" title="Adelantar o retroceder">
          {barHeights.map((h, i) => {
            const isPlayed = i <= activeBarIndex;
            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                className={`w-[3px] rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isSender
                      ? 'bg-purple-700 dark:bg-purple-300'
                      : 'bg-purple-600 dark:bg-purple-400'
                    : isSender
                      ? 'bg-purple-300/80 dark:bg-purple-900/60'
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>

        {/* Time and Speed */}
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-purple-300/80 mt-0.5">
          <span>{formatTime(currentTime > 0 ? currentTime : duration)}</span>
          <div className="flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/70 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-200 transition-colors"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
