# flashcard

A serverless spaced-repetition flashcard app powered by Google Sheets as a database.

**[→ Use the app](https://930727fre.github.io/flashcard)**

---

## How It Works

- Flashcards are stored in your own Google Sheet
- A Google Apps Script acts as the API
- The SM-2 algorithm tracks how well you know each word and schedules the next review
- Your streak is tracked every time you open the app

---

## Set Up Your Own Database

### 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet
2. Name it anything you like (e.g. `Vocab DB`)

### 2. Open Apps Script

1. In your spreadsheet, click **Extensions → Apps Script**
2. Delete all existing code in the editor
3. Paste the entire contents of [`code.gs`](./code.gs) into the editor
4. Click **Save** (💾)

### 3. Initialize the Database

1. In the Apps Script editor, select the function `initializeSheets` from the dropdown at the top
2. Click **Run**
3. Google will ask for permissions — click **Review permissions**, choose your account, then click **Allow**
4. This creates two sheets: `words` (your vocabulary) and `config` (streak data)

> Optionally run `seedSampleWords` to populate 10 example words for testing.

### 4. Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon ⚙ next to "Type" and select **Web app**
3. Fill in the fields:
   - **Description**: anything (e.g. `v1`)
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

> ⚠️ Every time you edit `Code.gs`, you must create a **new deployment** (not update existing) for changes to take effect.

### 5. Open the App

1. Go to **[https://930727fre.github.io/flashcard](https://930727fre.github.io/flashcard)**
2. Paste your Web App URL into the input field
3. Click **載入單字庫 →**

---

## Adding Words

Click the **＋ 新增** button in the top-right corner after loading.

**Single mode** — enter one word and translation at a time.

**Batch mode** — paste multiple lines, one per line, comma-separated:
```
ephemeral,短暫的
serendipity,意外發現美好事物的能力
ubiquitous,無所不在的
```

---

## Review Scoring

| Score | Meaning |
|-------|---------|
| 1 | Completely forgot |
| 2 | Very fuzzy / wrong |
| 3 | Barely remembered |
| 4 | Got it, felt easy |
| 5 | Instant recall |

Scores below 3 reset the interval. Scores 3 and above increase it using the SM-2 algorithm.

---

## Streak

Your login streak is tracked server-side in the `config` sheet. Missing two consecutive days resets it to 1.