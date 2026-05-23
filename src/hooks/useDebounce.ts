/**
 * useDebounce — A reusable React hook for debouncing rapidly-changing values.
 *
 * MED-02 FIX: Without debouncing, every keystroke in search boxes triggers
 * an API request or expensive filter computation. Typing "microeconomics" = 13 calls.
 * With a 350ms debounce, only 1 call fires after the user stops typing.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchQuery, 350);
 *   useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    // Cleanup: cancel the pending timeout if value changes before it fires
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
