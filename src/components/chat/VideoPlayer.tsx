import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  onOpenFullscreen?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onOpenFullscreen }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    if (total > 0) {
      setProgress((current / total) * 100);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenFullscreen) {
      onOpenFullscreen();
    } else if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div
      className="relative group rounded-xl overflow-hidden bg-black max-w-[320px] aspect-video flex items-center justify-center cursor-pointer shadow-md"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        playsInline
      />

      {/* Big Center Play/Pause button when paused or hovered */}
      {(!isPlaying || showControls) && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity">
          <button
            type="button"
            className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
        </div>
      )}

      {/* Bottom control bar */}
      <div className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2 transition-opacity ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/30">
          <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-1 rounded-full text-white hover:bg-white/20 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleFullscreen}
          className="p-1 rounded-full text-white hover:bg-white/20 transition-colors"
          title="Pantalla completa"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
