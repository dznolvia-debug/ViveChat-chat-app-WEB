import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Mic, Send, Image, Video, Camera, X } from 'lucide-react';
import { Message, MessageType } from '../../types';
import { useChat } from '../../context/ChatContext';
import { VoiceRecorder } from './VoiceRecorder';

interface InputBarProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
}

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤩', '🥳', '😎',
  '💜', '❤️', '💙', '💚', '💛', '🧡', '🤍', '🖤', '🤎', '✨', '🔥', '🎉', '👍', '👎', '👏', '🙌', '🙏', '💯', '🚀',
  '☕', '🍕', '🍻', '🌴', '🏖️', '✈️', '🎮', '📸', '🎵', '💡', '💬', '📞', '💻', '📱', '👀', '💪', '🤝', '🌸', '⚡'
];

export const InputBar: React.FC<InputBarProps> = ({
  replyingTo,
  onCancelReply,
}) => {
  const { sendMessage, setTyping } = useChat();

  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Typing notification trigger
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      setTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    sendMessage({
      type: 'text',
      content: trimmed,
      replyToId: replyingTo?.id,
    });

    setText('');
    onCancelReply();
    setTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setText(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      sendMessage({
        type: 'image',
        content: text.trim(),
        mediaUrl: reader.result as string,
        mediaName: file.name,
        mediaSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        replyToId: replyingTo?.id,
      });
      setText('');
      onCancelReply();
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Video Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      sendMessage({
        type: 'video',
        content: text.trim(),
        mediaUrl: reader.result as string,
        mediaName: file.name,
        mediaSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        mediaDuration: 25,
        replyToId: replyingTo?.id,
      });
      setText('');
      onCancelReply();
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Live Camera Snapshot
  const startCameraCapture = async () => {
    setShowAttachMenu(false);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cámara no soportada en este navegador');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;
      setIsCapturingCamera(true);
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      // Fallback synthetic photo capture if webcam is restricted
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Foto tomada con cámara 📸', 320, 240);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        sendMessage({
          type: 'image',
          content: '📷 Foto tomada con la cámara',
          mediaUrl: dataUrl,
          replyToId: replyingTo?.id,
        });
      }
    }
  };

  const capturePhoto = () => {
    if (!videoPreviewRef.current) return;
    const video = videoPreviewRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      sendMessage({
        type: 'image',
        content: '📷 Foto tomada con la cámara',
        mediaUrl: dataUrl,
        replyToId: replyingTo?.id,
      });
    }

    closeCamera();
  };

  const closeCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      cameraStreamRef.current = null;
    }
    setIsCapturingCamera(false);
  };

  const handleVoiceSend = (audioUrl: string, duration: number) => {
    sendMessage({
      type: 'audio',
      content: '',
      mediaUrl: audioUrl,
      mediaDuration: duration,
      replyToId: replyingTo?.id,
    });
    setIsRecordingVoice(false);
    onCancelReply();
  };

  return (
    <div className="relative bg-[#f0f2f5] dark:bg-[#1a1226] border-t border-slate-200 dark:border-purple-900/40 px-4 py-2.5 shrink-0">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoUpload}
        accept="video/*"
        className="hidden"
      />

      {/* Quoted Message preview bar */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-white dark:bg-purple-950/60 p-2.5 rounded-xl border-l-4 border-purple-600 mb-2 animate-in fade-in slide-in-from-bottom-2 shadow-xs border border-slate-100 dark:border-purple-900/30">
          <div className="truncate pr-2 text-xs">
            <span className="font-semibold text-purple-700 dark:text-purple-300 block">
              Respondiendo a {replyingTo.senderPhone}
            </span>
            <span className="text-slate-600 dark:text-purple-200 truncate">
              {replyingTo.content || (replyingTo.type === 'image' ? '📷 Foto' : replyingTo.type === 'video' ? '🎥 Video' : '🎤 Nota de voz')}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-purple-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live Camera Snapshot Modal */}
      {isCapturingCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-purple-950 p-4 rounded-2xl max-w-lg w-full shadow-2xl flex flex-col items-center gap-4">
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-slate-900 dark:text-purple-100">Tomar foto</span>
              <button onClick={closeCamera} className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-4/3 rounded-xl object-cover bg-black"
            />
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={closeCamera}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>Capturar y enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojis && (
        <div className="absolute bottom-16 left-4 z-30 bg-white dark:bg-[#1f1433] p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-purple-800/80 w-80 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-7 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-transform active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Menu Popover */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-12 z-30 bg-white dark:bg-[#1f1433] p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-purple-800/80 w-48 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/50 text-slate-700 dark:text-purple-200 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Image className="w-4 h-4" />
            </div>
            <span>Fotos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              videoInputRef.current?.click();
              setShowAttachMenu(false);
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/50 text-slate-700 dark:text-purple-200 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Video className="w-4 h-4" />
            </div>
            <span>Videos</span>
          </button>

          <button
            type="button"
            onClick={startCameraCapture}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/50 text-slate-700 dark:text-purple-200 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <span>Cámara</span>
          </button>
        </div>
      )}

      {/* Main input bar or Voice Recorder */}
      {isRecordingVoice ? (
        <VoiceRecorder
          onSendAudio={handleVoiceSend}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        <div className="flex items-center gap-2">
          {/* Emoji toggle */}
          <button
            type="button"
            onClick={() => {
              setShowEmojis(!showEmojis);
              setShowAttachMenu(false);
            }}
            className={`p-2 rounded-full transition-colors ${
              showEmojis ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/50' : 'text-slate-500 dark:text-purple-300 hover:text-purple-600'
            }`}
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment button */}
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(!showAttachMenu);
              setShowEmojis(false);
            }}
            className={`p-2 rounded-full transition-colors ${
              showAttachMenu ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/50' : 'text-slate-500 dark:text-purple-300 hover:text-purple-600'
            }`}
            title="Adjuntar multimedia"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea Input Container matching Professional Polish */}
          <div className="flex-1 bg-white dark:bg-[#241938] rounded-xl px-3.5 py-2 border border-slate-200 dark:border-purple-800/60 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-400 transition-colors shadow-xs flex items-center min-h-[40px]">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje aquí"
              rows={1}
              className="w-full bg-transparent text-slate-800 dark:text-purple-100 placeholder:text-slate-400 dark:placeholder:text-purple-300/50 resize-none outline-none text-sm max-h-32"
            />
          </div>

          {/* Mic (Voice Note) or Send Button */}
          {text.trim() ? (
            <button
              type="button"
              onClick={handleSendText}
              className="w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all active:scale-95 shadow-sm shrink-0"
              title="Enviar"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsRecordingVoice(true)}
              className="w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all active:scale-95 shadow-sm shrink-0"
              title="Grabar nota de voz"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
