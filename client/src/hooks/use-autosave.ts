import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => void | Promise<void>,
  delay: number = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<T>(data);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only auto-save if data has actually changed
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      timeoutRef.current = setTimeout(() => {
        saveFn(data);
        previousDataRef.current = data;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFn, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
