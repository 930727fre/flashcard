// src/types.ts
import type { State } from 'ts-fsrs';

export interface Card {
  id: string;
  word: string;
  sentence: string;
  note: string;
  due: string;           // ISO 8601
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  lapses: number;
  state: State;          // 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review: string;   // ISO 8601
  lang: string;
  created_at: string;    // ISO 8601
}

export interface Settings {
  fsrs_params: string;   // JSON 字串
  streak_count: string;  // 從 GAS 拿到的通常是字串，建議在使用時轉 Number
  streak_last_date: string;
  
  /** * 今日新領取單字的累積數量
   * 用於判定是否從複習階段 (Phase 1) 進入新背階段 (Phase 2)
   */
  daily_new_count: number | string;
  last_modified: string;  // ISO 8601, used for GAS vs localStorage reconciliation
}

export interface GASResponse<T> {
  status: 'ok' | 'error';
  data?: T;
  message?: string;
}