import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Meeting Planner` : 'Meeting Planner';
  }, [title]);
}

/** Calls onClose when the user clicks outside `ref` or presses Escape while `open`. */
export function useDismiss(ref, open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (e) => {
      if (!ref.current?.contains(e.target)) onCloseRef.current({ viaEscape: false });
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current({ viaEscape: true });
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, open]);
}

/** Moves focus to the first invalid field once React has rendered the new errors. */
export function focusFirstInvalid(form) {
  setTimeout(() => form?.querySelector('[aria-invalid="true"]')?.focus(), 0);
}

/**
 * Success message passed through navigation state ({ state: { flash } }). It is removed from the
 * history entry so a refresh doesn't show it again, and hides itself after a few seconds.
 */
export function useFlash() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState(location.state?.flash || '');

  useEffect(() => {
    if (location.state?.flash) {
      navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(''), 6000);
    return () => clearTimeout(timer);
  }, [flash]);

  return [flash, setFlash];
}
