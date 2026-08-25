import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send, Mic } from 'lucide-react';

interface VoiceRecorderProps {
  onSendAudio: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendAudio, onCancel }) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 40, 60, 30, 70, 50, 90, 40, 30, 60, 80, 45]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        // Setup audio visualizer
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWaveform = () => {
            if (!isMounted) return;
            analyser.getByteFrequencyData(dataArray);
            const sampled = Array.from(dataArray.slice(0, 16)).map(v => Math.max(15, (v / 255) * 100));
            setAudioLevels(sampled);
            animationFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          updateWaveform();
        }

        // Setup MediaRecorder
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(100);

        // Start timer
        timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

      } catch (err) {
        console.warn('Microphone access denied or error:', err);
        // Fallback timer simulation
        timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
          setAudioLevels(Array.from({ length: 16 }, () => Math.floor(Math.random() * 80) + 20));
        }, 1000);
      }
    }

    startRecording();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleFinishAndSend = () => {
    const finalDuration = Math.max(1, recordingTime);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendAudio(base64Audio, finalDuration);
        };
        reader.readAsDataURL(audioBlob);
      };
      mediaRecorderRef.current.stop();
    } else {
      // Fallback synthetic audio representation
      onSendAudio('synthetic_audio_note', finalDuration);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-purple-50 dark:bg-purple-950/40 p-2 rounded-2xl border border-purple-200 dark:border-purple-800/60 shadow-sm animate-in fade-in slide-in-from-bottom duration-200">
      {/* Delete / Cancel Button */}
      <button
        type="button"
        onClick={onCancel}
        className="p-2.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
        title="Cancelar grabación"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording Indicator & Timer */}
      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium text-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="tabular-nums font-mono">{formatTime(recordingTime)}</span>
      </div>

      {/* Live Animated Waveform */}
      <div className="flex-1 flex items-center justify-center gap-1 h-8 px-2 overflow-hidden">
        {audioLevels.map((lvl, idx) => (
          <div
            key={idx}
            className="w-1 bg-purple-600 dark:bg-purple-400 rounded-full transition-all duration-75"
            style={{ height: `${Math.max(15, Math.min(100, lvl))}%` }}
          />
        ))}
      </div>

      {/* Send Button */}
      <button
        type="button"
        onClick={handleFinishAndSend}
        className="p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
        title="Enviar nota de voz"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
};
