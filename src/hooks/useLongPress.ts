import React, { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  shouldPreventDefault?: boolean;
  delay?: number;
}

export function useLongPress(
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
  { shouldPreventDefault = true, delay = 500 }: UseLongPressOptions = {}
) {
  const timeoutRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      isLongPressRef.current = false;
      const clientX = 'touches' in event ? event.touches[0]?.clientX : (event as React.MouseEvent).clientX;
      const clientY = 'touches' in event ? event.touches[0]?.clientY : (event as React.MouseEvent).clientY;
      startPosRef.current = { x: clientX || 0, y: clientY || 0 };

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onMove = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (!startPosRef.current) return;
    const clientX = 'touches' in event ? event.touches[0]?.clientX : (event as React.MouseEvent).clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY : (event as React.MouseEvent).clientY;
    const dx = Math.abs((clientX || 0) - startPosRef.current.x);
    const dy = Math.abs((clientY || 0) - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancel();
    }
  }, [cancel]);

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchMove: (e: React.TouchEvent) => onMove(e),
    onMouseMove: (e: React.MouseEvent) => onMove(e),
    onMouseUp: () => cancel(),
    onMouseLeave: () => cancel(),
    onTouchEnd: () => cancel(),
    onContextMenu: (e: React.MouseEvent) => {
      if (shouldPreventDefault) {
        e.preventDefault();
      }
      onLongPress(e);
    },
  };
}
