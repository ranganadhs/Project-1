import type { MMKV } from 'react-native-mmkv';

export type Kv = {
  getString: (key: string) => string | undefined;
  setString: (key: string, value: string) => void;
  getNumber: (key: string) => number | undefined;
  setNumber: (key: string, value: number) => void;
  getBoolean: (key: string) => boolean | undefined;
  setBoolean: (key: string, value: boolean) => void;
  getObject: <T>(key: string) => T | undefined;
  setObject: <T>(key: string, value: T) => void;
  remove: (key: string) => void;
  clearAll: () => void;
};

/**
 * Typed accessors over an MMKV instance. Shared by the native and web storage
 * modules so the two can never drift in behaviour — only in how the underlying
 * instance is created.
 */
export function createKv(storage: MMKV): Kv {
  return {
    getString: (key) => storage.getString(key),
    setString: (key, value) => storage.set(key, value),

    getNumber: (key) => storage.getNumber(key),
    setNumber: (key, value) => storage.set(key, value),

    getBoolean: (key) => storage.getBoolean(key),
    setBoolean: (key, value) => storage.set(key, value),

    /** Returns undefined on missing OR corrupt data — never throws. */
    getObject: <T>(key: string): T | undefined => {
      const raw = storage.getString(key);
      if (raw === undefined) return undefined;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    },
    setObject: (key, value) => storage.set(key, JSON.stringify(value)),

    // MMKV v4 renamed delete() -> remove(), which returns whether a value was
    // actually removed. Swallowed here so the accessor stays void-returning.
    remove: (key) => void storage.remove(key),
    clearAll: () => storage.clearAll(),
  };
}
