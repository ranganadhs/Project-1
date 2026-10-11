import { useRef } from 'react';
import { haptics } from '@/lib/haptics';
import { useModelStore } from './model-store';
import type { ModelId } from './types';

/**
 * Drives `downloadProgress` from 0→1 on an interval instead of a real
 * `react-native-fs` fetch task (see on_device_ai_student_companion.md §3.2
 * "Zero-Cloud Cost Strategy"). Swap the body of `tick` for the real download
 * progress callback when the fetch pipeline exists — every caller (Model
 * Setup, Settings) already reads `downloadingModelId`/`downloadProgress`
 * from the store, so nothing downstream changes.
 */
const TICK_MS = 150;
const STEP = 0.08;

export function useDummyDownload() {
  const startDownload = useModelStore((s) => s.startDownload);
  const setDownloadProgress = useModelStore((s) => s.setDownloadProgress);
  const markDownloadComplete = useModelStore((s) => s.markDownloadComplete);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const begin = (id: ModelId) => {
    if (timer.current) clearInterval(timer.current);
    startDownload(id);
    haptics.medium();

    let progress = 0;
    timer.current = setInterval(() => {
      progress = Math.min(1, progress + STEP);
      setDownloadProgress(progress);
      if (progress >= 1) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        haptics.success();
        markDownloadComplete();
      }
    }, TICK_MS);
  };

  return { begin };
}
