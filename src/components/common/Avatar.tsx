import React from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  hasStatus?: boolean;
  statusSeen?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline,
  hasStatus,
  statusSeen,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const getInitials = (n: string) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Story Status Ring if applicable */}
      {hasStatus && (
        <div
          className={`absolute -inset-1 rounded-full border-2 transition-all ${
            statusSeen ? 'border-purple-300 dark:border-purple-900/60' : 'border-purple-600 dark:border-purple-400 animate-pulse'
          }`}
        />
      )}

      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-sm bg-purple-100 dark:bg-purple-900/40`}
          onError={(e) => {
            // fallback to initials on error
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-semibold flex items-center justify-center shadow-sm`}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Online indicator */}
      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full shadow-sm" />
      )}
    </div>
  );
};
