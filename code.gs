// ═══════════════════════════════════════════════════════════════
//  詞卡 SRS — Google Apps Script 後端 (v4 - Streak 版)
//  部署方式：執行 > 部署 > 新增部署 > 類型選「網頁應用程式」
//             執行身分：我自己 / 存取權：所有人
// ═══════════════════════════════════════════════════════════════

const SHEET_WORDS  = 'words';
const SHEET_CONFIG = 'config';

// words 欄位順序
const WORD_COLS = ['id', 'word', 'translation', 'efactor', 'interval', 'nextReview'];

// config 工作表 key 對應的列號（A欄=key, B欄=value）
const CONFIG_KEYS = {
  lastLogin:   'lastLogin',    // YYYY-MM-DD
  streak:      'streak',       // 整數
};


// ═══════════════════════════════════════════════════════════════
//  doGet — 下載 words 陣列 + 更新並回傳 streak
//  回傳：{ words: [...], streak: N, lastLogin: 'YYYY-MM-DD' }
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    // ── 1. 讀取 words ──
    const wordSheet = getSheet(SHEET_WORDS);
    const lastRow   = wordSheet.getLastRow();
    let words = [];

    if (lastRow >= 2) {
      const data = wordSheet.getRange(2, 1, lastRow - 1, WORD_COLS.length).getValues();
      words = data
        .filter(row => row[0] !== '' && row[0] !== null)
        .map(row => ({
          id:          row[0],
          word:        row[1],
          translation: row[2],
          efactor:     parseFloat(row[3]) || 2.5,
          interval:    parseInt(row[4])   || 0,
          nextReview:  formatDate(row[5]),
        }));
    }

    // ── 2. 計算 streak ──
    const streakResult = updateStreak();

    return jsonResponse({
      words,
      streak:    streakResult.streak,
      lastLogin: streakResult.lastLogin,
      isNewDay:  streakResult.isNewDay,
    });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}


// ═══════════════════════════════════════════════════════════════
//  doPost — 接收整個 words 陣列，整批覆寫
//  Body: { words: [...] }
// ═══════════════════════════════════════════════════════════════
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (_) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const words = body.words;
  if (!Array.isArray(words)) {
    return jsonResponse({ error: 'Body must contain a "words" array' }, 400);
  }

  try {
    const sheet   = getSheet(SHEET_WORDS);
    const lastRow = sheet.getLastRow();

    // 清除舊資料（保留標題列）
    if (lastRow >= 2) {
      sheet.getRange(2, 1, lastRow - 1, WORD_COLS.length).clearContent();
    }

    // 整批寫入
    if (words.length > 0) {
      const rows = words.map(w => [
        w.id,
        w.word,
        w.translation,
        parseFloat(w.efactor)  || 2.5,
        parseInt(w.interval)   || 0,
        w.nextReview            || '',
      ]);
      sheet.getRange(2, 1, rows.length, WORD_COLS.length).setValues(rows);
    }

    return jsonResponse({ success: true, written: words.length });

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}


// ═══════════════════════════════════════════════════════════════
//  STREAK 邏輯
// ═══════════════════════════════════════════════════════════════
function updateStreak() {
  const today     = getTodayStr();
  const lastLogin = getConfig(CONFIG_KEYS.lastLogin) || '';
  let   streak    = parseInt(getConfig(CONFIG_KEYS.streak)) || 0;

  if (lastLogin === today) {
    // 同一天重複登入，不變
  } else if (lastLogin === getYesterdayStr()) {
    // 昨天有登入，連勝 +1
    streak += 1;
  } else {
    // 超過一天沒登入（或第一次），重置為 1
    streak = 1;
  }

  const isNewDay = lastLogin !== today;
  setConfig(CONFIG_KEYS.lastLogin, today);
  setConfig(CONFIG_KEYS.streak,    String(streak));

  return { streak, lastLogin: today, isNewDay };
}


// ═══════════════════════════════════════════════════════════════
//  CONFIG 讀寫（config 工作表：A欄=key, B欄=value）
// ═══════════════════════════════════════════════════════════════
function getConfig(key) {
  const sheet   = getSheet(SHEET_CONFIG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return null;

  const data = sheet.getRange(1, 1, lastRow, 2).getValues();
  for (const row of data) {
    if (String(row[0]) === key) {
      const val = row[1];
      // Sheets 可能把日期欄位自動轉成 Date 物件，統一轉成 YYYY-MM-DD 字串
      if (val instanceof Date && !isNaN(val.getTime())) {
        return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      return String(val);
    }
  }
  return null;
}

function setConfig(key, value) {
  const sheet   = getSheet(SHEET_CONFIG);
  const lastRow = sheet.getLastRow();

  // 找有沒有這個 key
  if (lastRow >= 1) {
    const data = sheet.getRange(1, 1, lastRow, 1).getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        return;
      }
    }
  }

  // 沒有就新增一列
  sheet.getRange(lastRow + 1, 1).setValue(key);
  sheet.getRange(lastRow + 1, 2).setValue(value);
}


// ═══════════════════════════════════════════════════════════════
//  工具函式
// ═══════════════════════════════════════════════════════════════
function getSheet(name) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`工作表「${name}」不存在，請先執行 initializeSheets()`);
  return sheet;
}

function jsonResponse(obj, status) {
  const payload = status && status !== 200 ? Object.assign({ status }, obj) : obj;
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTodayStr() {
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}

function formatDate(value) {
  if (!value || value === '') return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const tz = Session.getScriptTimeZone();
    return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
  } catch (_) { return String(value); }
}


// ═══════════════════════════════════════════════════════════════
//  INITIALIZE — 在 GAS 編輯器手動執行一次即可
// ═══════════════════════════════════════════════════════════════

/**
 * 建立所有必要的工作表與標題列
 * 在 GAS 編輯器選擇此函式後點「執行」，只需執行一次
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── words 工作表 ──
  let words = ss.getSheetByName(SHEET_WORDS);
  if (!words) {
    words = ss.insertSheet(SHEET_WORDS);
    Logger.log('建立工作表：words');
  }
  // 清空所有資料
  words.clearContents();
  Logger.log('words 資料已清空');
  const wordHeaders = ['id', 'word', 'translation', 'efactor', 'interval', 'nextReview'];
  words.getRange(1, 1, 1, wordHeaders.length).setValues([wordHeaders]);
  // 格式化標題列
  words.getRange(1, 1, 1, wordHeaders.length)
    .setFontWeight('bold')
    .setBackground('#4a4a4a')
    .setFontColor('#ffffff');
  // 凍結標題列
  words.setFrozenRows(1);
  // 欄位寬度
  words.setColumnWidth(1, 60);   // id
  words.setColumnWidth(2, 160);  // word
  words.setColumnWidth(3, 200);  // translation
  words.setColumnWidth(4, 80);   // efactor
  words.setColumnWidth(5, 80);   // interval
  words.setColumnWidth(6, 120);  // nextReview
  Logger.log('words 工作表初始化完成');

  // ── config 工作表 ──
  let config = ss.getSheetByName(SHEET_CONFIG);
  if (!config) {
    config = ss.insertSheet(SHEET_CONFIG);
    Logger.log('建立工作表：config');
  }
  // 清空所有資料
  config.clearContents();
  Logger.log('config 資料已清空');
  config.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  config.getRange(1, 1, 1, 2)
    .setFontWeight('bold')
    .setBackground('#4a4a4a')
    .setFontColor('#ffffff');
  config.setFrozenRows(1);
  config.setColumnWidth(1, 140);
  config.setColumnWidth(2, 140);
  // 初始資料
  config.getRange(2, 1, 2, 2).setValues([
    ['lastLogin', ''],
    ['streak',    '0'],
  ]);
  Logger.log('config 工作表初始化完成');

  Logger.log('✅ 初始化完成！現在可以部署 Web App 了。');
}


/**
 * 填入範例單字（方便測試）
 * 執行前請先執行 initializeSheets()
 */
function seedSampleWords() {
  const sheet = getSheet(SHEET_WORDS);

  const samples = [
    [1, 'ephemeral',    '短暫的',               2.5, 0, ''],
    [2, 'serendipity',  '意外發現美好事物的能力', 2.5, 0, ''],
    [3, 'ubiquitous',   '無所不在的',            2.5, 0, ''],
    [4, 'melancholy',   '憂鬱；哀愁',            2.5, 0, ''],
    [5, 'resilience',   '韌性；恢復力',          2.5, 0, ''],
    [6, 'ambiguous',    '模稜兩可的',            2.5, 0, ''],
    [7, 'tenacious',    '堅韌的；頑強的',        2.5, 0, ''],
    [8, 'eloquent',     '口才流利的；有說服力的', 2.5, 0, ''],
    [9, 'pragmatic',    '務實的',                2.5, 0, ''],
    [10,'meticulous',   '一絲不苟的；極為細心的', 2.5, 0, ''],
  ];

  // 清除舊資料（保留標題）
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, WORD_COLS.length).clearContent();
  }

  sheet.getRange(2, 1, samples.length, WORD_COLS.length).setValues(samples);
  Logger.log(`✅ 已填入 ${samples.length} 個範例單字`);
}


// ═══════════════════════════════════════════════════════════════
//  本地測試函式
// ═══════════════════════════════════════════════════════════════
function _testGet() {
  Logger.log(doGet({}).getContent());
}

function _testPost() {
  const result = doPost({
    postData: {
      contents: JSON.stringify({
        words: [
          { id:1, word:'apple',     translation:'蘋果',  efactor:2.5, interval:0, nextReview:'' },
          { id:2, word:'ephemeral', translation:'短暫的', efactor:2.6, interval:6, nextReview:'2025-12-31' },
        ]
      })
    }
  });
  Logger.log(result.getContent());
}

function _testSetLastLogin() {
  setConfig(CONFIG_KEYS.lastLogin, '2025-03-18');
  Logger.log('lastLogin 已設定為 2025-03-18');
  Logger.log('streak:', getConfig(CONFIG_KEYS.streak));
}

function _testStreak() {
  Logger.log('streak result:', JSON.stringify(updateStreak()));
  Logger.log('lastLogin:', getConfig('lastLogin'));
  Logger.log('streak:', getConfig('streak'));
}
}
