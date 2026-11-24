"use client";

import { useCallback, useState } from "react";
import { errorText } from "../lib/format";

/**
 * State busy/error/notice untuk aksi kecil di dalam satu bagian UI.
 * `run` mengembalikan teks sukses dari aksi (atau "" untuk tanpa notice).
 */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const run = useCallback(async (action: () => Promise<string | void>, fallback: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const message = await action();
      if (message) setNotice(message);
      return true;
    } catch (err) {
      setError(errorText(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const clear = useCallback(() => {
    setError("");
    setNotice("");
  }, []);

  return { busy, error, notice, run, clear, setError };
}
