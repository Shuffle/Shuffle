import { useRef, useEffect, useCallback } from "react";

export const useDebouncedCallback = (callback, delay = 300) => {
  const timeoutRef = useRef(null);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      savedCallback.current(...args);
    }, delay);
  }, [delay]);
};

export default useDebouncedCallback;


