import { useSyncExternalStore } from "react";
import { toast } from "sonner";

export type NotificationKind = "info" | "success" | "warning" | "error" | "action";

export type AppNotification = {
  id: string;
  title: string;
  body?: string;
  kind: NotificationKind;
  createdAt: number;
  read: boolean;
  /** Optional short hint of what the user should do / take note of. */
  hint?: string;
};

const STORAGE_KEY = "gtech.notifications.v1";
const MAX_ITEMS = 200;

let items: AppNotification[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — keep in memory only */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw) as AppNotification[];
  } catch {
    items = [];
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: AppNotification[] = [];
function getSnapshot() {
  hydrate();
  return items;
}
function getServerSnapshot() {
  return EMPTY;
}

/** Add a notification. Notifications persist until the user removes them. */
export function notify(
  input: { title: string; body?: string; kind?: NotificationKind; hint?: string; toast?: boolean },
) {
  hydrate();
  const item: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    body: input.body,
    hint: input.hint,
    kind: input.kind ?? "info",
    createdAt: Date.now(),
    read: false,
  };
  items = [item, ...items].slice(0, MAX_ITEMS);
  emit();

  if (input.toast !== false) {
    const opts = input.body ? { description: input.body } : undefined;
    if (item.kind === "success") toast.success(item.title, opts);
    else if (item.kind === "error") toast.error(item.title, opts);
    else if (item.kind === "warning") toast.warning(item.title, opts);
    else toast(item.title, opts);
  }
  return item.id;
}

/** Add a notification only once per key (avoids duplicate advisories). */
const onceKeys = new Set<string>();
export function notifyOnce(key: string, input: Parameters<typeof notify>[0]) {
  if (onceKeys.has(key)) return;
  onceKeys.add(key);
  notify(input);
}

export function markRead(id: string) {
  hydrate();
  items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
  emit();
}

export function markAllRead() {
  hydrate();
  items = items.map((n) => (n.read ? n : { ...n, read: true }));
  emit();
}

export function removeNotification(id: string) {
  hydrate();
  items = items.filter((n) => n.id !== id);
  emit();
}

export function clearAllNotifications() {
  hydrate();
  items = [];
  emit();
}

export function useNotifications() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    notifications: list,
    unread: list.filter((n) => !n.read).length,
    markRead,
    markAllRead,
    remove: removeNotification,
    clearAll: clearAllNotifications,
  };
}

export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
