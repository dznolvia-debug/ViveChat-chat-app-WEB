import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock,
  Reply,
  MoreVertical,
  Trash2,
  Copy,
  Star,
  Edit2,
  Share2,
  Smile,
  Download,
  CornerUpRight
} from 'lucide-react';
import { Message } from '../../types';
import { AudioPlayer } from './AudioPlayer';
import { VideoPlayer } from './VideoPlayer';

interface MessageBubbleProps {
  message: Message;
  isSender: boolean;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string, forEveryone?: boolean) => void;
  onStar: (messageId: string) => void;
  onEdit: (message: Message) => void;
  onForward: (message: Message) => void;
  onOpenMedia: (url: string, type: 'image' | 'video', title?: string) => void;
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '👍', '💜'];

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
  isSender,
  onReply,
  onReact,
  onDelete,
  onStar,
  onEdit,
  onForward,
  onOpenMedia,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatusTicks = () => {
    if (!isSender) return null;
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-purple-300/60 inline ml-1" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-gray-400 dark:text-purple-300/60 inline ml-1" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-gray-400 dark:text-purple-300/60 inline ml-1" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 font-bold inline ml-1" />;
      default:
        return null;
    }
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard?.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  if (message.deletedForEveryone) {
    return (
      <div className={`flex w-full mb-1.5 ${isSender ? 'justify-end' : 'justify-start'}`}>
        <div className="italic text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-purple-950/40 text-gray-500 dark:text-purple-300/70 border border-gray-200/60 dark:border-purple-800/40 select-none">
          🚫 Este mensaje fue eliminado
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex w-full mb-1.5 items-end gap-1.5 ${
        isSender ? 'justify-end' : 'justify-start'
      }`}
      onMouseLeave={() => {
        setShowReactions(false);
        setShowMenu(false);
      }}
    >
      {/* Floating Action Bar (Hover or Click) */}
      <div
        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-white/90 dark:bg-[#1f1433]/90 backdrop-blur-xs p-1 rounded-full shadow-md border border-slate-200/80 dark:border-purple-800/80 ${
          isSender ? 'order-first' : 'order-last'
        }`}
      >
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/60 text-slate-500 hover:text-purple-600 transition-colors"
          title="Reaccionar"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onReply(message)}
          className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/60 text-slate-500 hover:text-purple-600 transition-colors"
          title="Responder"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onStar(message.id)}
          className={`p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors ${
            message.isStarred ? 'text-amber-500' : 'text-slate-500 hover:text-purple-600'
          }`}
          title={message.isStarred ? 'Quitar de destacados' : 'Destacar mensaje'}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
        </button>

        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/60 text-slate-500 hover:text-purple-600 transition-colors"
          title="Más opciones"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Reactions Palette */}
      {showReactions && (
        <div
          className={`absolute -top-9 z-30 flex items-center gap-1 bg-white dark:bg-[#1a1128] p-1.5 rounded-full shadow-xl border border-slate-200 dark:border-purple-800 animate-in zoom-in-75 duration-100 ${
            isSender ? 'right-0' : 'left-0'
          }`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(message.id, emoji);
                setShowReactions(false);
              }}
              className="text-base hover:scale-125 transition-transform p-0.5 rounded-full cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Context Menu Dropdown */}
      {showMenu && (
        <div
          className={`absolute top-6 z-30 w-48 bg-white dark:bg-[#1f1433] rounded-xl shadow-2xl border border-slate-200 dark:border-purple-800/80 py-1 text-xs text-slate-700 dark:text-purple-100 animate-in fade-in duration-150 ${
            isSender ? 'right-0' : 'left-0'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onReply(message);
              setShowMenu(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
          >
            <Reply className="w-4 h-4 text-purple-600" />
            <span>Responder</span>
          </button>

          {message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
            >
              <Copy className="w-4 h-4 text-purple-600" />
              <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onStar(message.id);
              setShowMenu(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
          >
            <Star className={`w-4 h-4 ${message.isStarred ? 'text-amber-500 fill-current' : 'text-purple-600'}`} />
            <span>{message.isStarred ? 'Desmarcar' : 'Destacar'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onForward(message);
              setShowMenu(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
          >
            <Share2 className="w-4 h-4 text-purple-600" />
            <span>Reenviar</span>
          </button>

          {isSender && message.type === 'text' && (
            <button
              type="button"
              onClick={() => {
                onEdit(message);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-left transition-colors"
            >
              <Edit2 className="w-4 h-4 text-purple-600" />
              <span>Editar mensaje</span>
            </button>
          )}

          {isSender && (
            <button
              type="button"
              onClick={() => {
                onDelete(message.id, true);
                setShowMenu(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar para todos</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onDelete(message.id, false);
              setShowMenu(false);
            }}
            className="w-full px-3 py-2 flex items-center gap-2.5 text-slate-600 dark:text-purple-300 hover:bg-slate-50 dark:hover:bg-purple-900/30 text-left transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar para mí</span>
          </button>
        </div>
      )}

      {/* WhatsApp Message Bubble */}
      <div
        className={`relative max-w-[85%] md:max-w-[70%] p-2.5 shadow-xs transition-all ${
          isSender
            ? 'bg-[#d8b4fe] dark:bg-purple-800/90 text-slate-900 dark:text-purple-50 rounded-l-xl rounded-br-xl'
            : 'bg-white dark:bg-[#1e1430] text-slate-900 dark:text-purple-50 rounded-r-xl rounded-bl-xl border border-slate-100 dark:border-purple-900/40'
        }`}
      >
        {/* Group Sender Name */}
        {message.isGroup && !isSender && (
          <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
            <span>{message.senderName || message.senderPhone}</span>
          </div>
        )}

        {/* Forwarded Header */}
        {message.isForwarded && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-purple-300/80 italic mb-1 select-none">
            <CornerUpRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>Reenviado</span>
          </div>
        )}

        {/* Quoted Message / Reply Preview */}
        {message.replyTo && (
          <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/25 border-l-4 border-purple-600 text-xs">
            <span className="font-semibold text-purple-700 dark:text-purple-300 block mb-0.5">
              {message.replyTo.senderName}
            </span>
            <p className="truncate text-slate-600 dark:text-purple-200/80">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Media: Image */}
        {message.type === 'image' && message.mediaUrl && (
          <div className="mb-1 rounded-lg overflow-hidden cursor-pointer relative group/img">
            <img
              src={message.mediaUrl}
              alt="Media"
              className="max-h-72 w-full object-cover rounded-lg hover:scale-[1.01] transition-transform duration-200"
              onClick={() => onOpenMedia(message.mediaUrl!, 'image', message.content)}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMedia(message.mediaUrl!, 'image', message.content);
              }}
              className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
              title="Ver en grande"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Media: Video */}
        {message.type === 'video' && message.mediaUrl && (
          <div className="mb-1 rounded-lg overflow-hidden">
            <VideoPlayer
              src={message.mediaUrl}
              onExpand={() => onOpenMedia(message.mediaUrl!, 'video', message.content)}
            />
          </div>
        )}

        {/* Media: Audio / Voice Note */}
        {message.type === 'audio' && message.mediaUrl && (
          <div className="mb-1">
            <AudioPlayer src={message.mediaUrl} isSender={isSender} />
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}

        {/* Footer: timestamp, edited status, star, checkmarks */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 dark:text-purple-300/70 mt-1 select-none">
          {message.isStarred && <Star className="w-3 h-3 text-amber-500 fill-current" />}
          {message.isEdited && <span className="italic">editado</span>}
          <span>{formatTime(message.timestamp)}</span>
          {renderStatusTicks()}
        </div>

        {/* Emoji Reactions Badge */}
        {message.reactions && message.reactions.length > 0 && (
          <div
            className={`absolute -bottom-2.5 flex items-center gap-0.5 bg-white dark:bg-[#1a1128] px-1.5 py-0.5 rounded-full shadow-md border border-slate-200 dark:border-purple-800 text-xs ${
              isSender ? 'right-2' : 'left-2'
            }`}
          >
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji) => (
              <span key={emoji} className="cursor-pointer">
                {emoji}
              </span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] text-slate-500 dark:text-purple-300 font-semibold ml-0.5">
                {message.reactions.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const MessageBubble = React.memo(MessageBubbleComponent, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.status === next.message.status &&
    prev.message.content === next.message.content &&
    prev.message.isStarred === next.message.isStarred &&
    prev.message.isEdited === next.message.isEdited &&
    prev.message.deletedForEveryone === next.message.deletedForEveryone &&
    prev.isSender === next.isSender &&
    prev.message.reactions?.length === next.message.reactions?.length &&
    prev.onReply === next.onReply &&
    prev.onReact === next.onReact &&
    prev.onDelete === next.onDelete &&
    prev.onStar === next.onStar &&
    prev.onEdit === next.onEdit &&
    prev.onForward === next.onForward &&
    prev.onOpenMedia === next.onOpenMedia
  );
});
