import type { StateStorage } from 'zustand/middleware';
import { kv } from './storage';

/**
 * Bridges MMKV to zustand's `persist`. MMKV is synchronous, so these satisfy the
 * async StateStorage signature without ever actually deferring — which is why
 * rehydration completes inside `create()` rather than on a later tick.
 */
export const zustandStorage: StateStorage = {
  getItem: (name) => kv.getString(name) ?? null,
  setItem: (name, value) => kv.setString(name, value),
  removeItem: (name) => kv.remove(name),
};
