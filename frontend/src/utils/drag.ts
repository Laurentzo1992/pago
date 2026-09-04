import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * Minimal drag-by-handle helper: attach the returned onPointerDown to a
 * "handle" element, and onMove receives the pixel delta for each frame.
 */
export function useDragHandle(onMove: (dx: number, dy: number) => void, onStart?: () => void) {
  const last = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    last.current = { x: e.clientX, y: e.clientY };
    onStart?.();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!last.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    onMove(dx, dy);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    last.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}
