# Flashcard

A spaced repetition flashcard app powered by the [FSRS](https://github.com/open-spaced-repetition/fsrs4anki) algorithm, with Google Sheets as the database.

## Features

- FSRS algorithm for optimal review scheduling
- Daily cap of 20 new cards
- Streak tracking
- Batch import via CSV/TSV
- Offline-first with localStorage cache, synced to Google Sheets on session end

## Stack

- React 19 + TypeScript + Vite
- Zustand for state management
- Mantine 9 for UI
- Google Apps Script + Google Sheets as backend

## Setup

### 1. Google Apps Script

1. Go to [script.google.com](https://script.google.com) and create a new project
2. Copy the contents of `Code.gs` into the editor
3. Deploy as a **Web App** (Execute as: Me, Who has access: Anyone)
4. Copy the deployment URL

### 2. App

Open the app and paste your GAS deployment URL when prompted.

## Card Format (Batch Import)

One card per line, comma or tab separated:

```
word, example sentence, note
Apple, An apple a day keeps the doctor away., 蘋果
```

## Data Sync

- On dashboard load: compares local `last_modified` with GAS; fetches from GAS if newer, pushes if local is ahead
- On review session end: syncs full card data and settings to GAS
- On batch import: clears local cache to force re-fetch from GAS
