// src/lib/fsrs.ts
import { 
  fsrs, 
  Rating, 
  // 在型別前面加上 type 關鍵字
  type RecordLogItem, 
  type Card as FSRSCard, 
  type FSRSParameters 
} from 'ts-fsrs';
import type { Card } from '../types';


export function createFSRSCard(card: Card): FSRSCard {
  // 使用 Number() 強迫轉換，避免 GAS 回傳字串導致演算法崩潰
  return {
    due: new Date(card.due),
    stability: Number(card.stability) || 0,
    difficulty: Number(card.difficulty) || 0,
    elapsed_days: Number(card.elapsed_days) || 0,
    scheduled_days: Number(card.scheduled_days) || 0,
    lapses: Number(card.lapses) || 0,
    state: Number(card.state) || 0, // 關鍵：確保 state 是數字 0-3
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}

// 這裡的參數型別也同步改為 FSRSParameters
export function computeNext(card: Card, rating: Rating, params: FSRSParameters) {
  const f = fsrs(params);
  const fsrsCard = createFSRSCard(card);
  const result = f.repeat(fsrsCard, new Date());
  const next = result[rating].card;

  return {
    due: next.due.toISOString(),
    stability: next.stability,
    difficulty: next.difficulty,
    elapsed_days: next.elapsed_days,
    scheduled_days: next.scheduled_days,
    lapses: next.lapses,
    state: next.state,
    last_review: new Date().toISOString(),
  };
}