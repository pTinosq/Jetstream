import { writable } from 'svelte/store';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const DISMISS_AFTER_MS = 4000;

export const toasts = writable<Toast[]>([]);

let nextId = 0;

/** Show a transient toast; auto-dismisses. */
export function toast(message: string, type: Toast['type'] = 'success'): void {
  const id = nextId++;
  toasts.update((current) => [...current, { id, message, type }]);
  setTimeout(() => dismissToast(id), DISMISS_AFTER_MS);
}

export function dismissToast(id: number): void {
  toasts.update((current) => current.filter((t) => t.id !== id));
}
