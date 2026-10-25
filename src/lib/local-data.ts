export const LOCAL_DATA_UPDATED = "gtech:local-data-updated";

export function notifyLocalDataUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCAL_DATA_UPDATED));
  }
}

export function readLocalArray<T>(key: string, isEntry: (value: unknown) => value is T): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`[Local demo] Stored data for "${key}" is not a list; ignoring it.`);
      return [];
    }
    return parsed.filter(isEntry);
  } catch (error) {
    console.warn(`[Local demo] Could not read stored data for "${key}"; ignoring it.`, error);
    return [];
  }
}
