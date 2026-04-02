// src/api.ts
import type { Card, Settings, GASResponse } from './types';

async function fetchGAS<T>(url: string, params: Record<string, string> = {}): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${queryString}`);
  const result: GASResponse<T> = await res.json();
  if (result.status === 'error') throw new Error(result.message);
  return result.data as T;
}

export const gasApi = {
  ping: (url: string) => fetchGAS<string>(url, { action: 'ping' }),
  getAll: (url: string) => fetchGAS<Card[]>(url, { action: 'getAll' }),
  getSettings: (url: string) => fetchGAS<Settings>(url, { action: 'getSettings' }),

};

export const gasPost = (url: string, payload: object) => {
  return fetch(url, {
    method: 'POST',
    mode: 'no-cors', // 關鍵：盲送模式
    headers: { 'Content-Type': 'text/plain' }, // 避開 preflight
    body: JSON.stringify(payload),
  });
};