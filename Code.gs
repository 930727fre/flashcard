const SS = SpreadsheetApp.getActiveSpreadsheet();

// --- 1. 核心進入點 (GET) ---

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'ping':
        initSheets();
        return response({ status: 'ok', message: 'Connected and Sheets initialized.' });
      case 'getAll':
        return response({ status: 'ok', data: getRawData('cards') });
      case 'getSettings':
        return response({ status: 'ok', data: getSettingsMap() });
      default:
        return response({ status: 'error', message: 'Unknown action' });
    }
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

// --- 2. 核心進入點 (POST) ---

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    switch (action) {
      case 'batchAdd': {
        const cards = postData.cards || [];
        if (cards.length > 0) batchAppendCards(cards);
        return response({ status: 'ok', message: 'Batch add successful' });
      }

      case 'syncAll': {
        const updatedCards = postData.cards || [];
        const newSettings = postData.settings || {};

        const sheet = SS.getSheetByName('cards');
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

        const rows = updatedCards.map(card => headers.map(h => card[h] ?? ''));

        const lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
        if (rows.length > 0) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

        for (var key in newSettings) {
          updateSettingValue(key, String(newSettings[key]));
        }

        return response({ status: 'ok' });
      }
    }
  } catch (err) {
    return response({ status: 'error', message: err.toString() });
  }
}

// --- 3. 設定檔與跨日全自動處理 ---

function getSettingsMap() {
  const data = getRawData('settings');
  const map = {};
  data.forEach(item => map[item.key] = item.value);

  const tz = Session.getScriptTimeZone();
  const now = new Date();
  const todayStr = Utilities.formatDate(now, tz, "yyyy-MM-dd");
  const rawLastDate = String(map.streak_last_date || "").trim();
  const lastUpdateStr = rawLastDate
    ? Utilities.formatDate(new Date(rawLastDate), tz, "yyyy-MM-dd")
    : "";

  let isNewDay = false;
  if (!lastUpdateStr) {
    isNewDay = true;
  } else {
    const lastDayStr = Utilities.formatDate(new Date(lastUpdateStr), tz, "yyyy-MM-dd");
    if (lastDayStr !== todayStr) isNewDay = true;
  }

  if (isNewDay) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = Utilities.formatDate(yesterday, tz, "yyyy-MM-dd");
    const isYesterday = lastUpdateStr === yesterdayStr;

    const newStreak = isYesterday ? parseInt(map.streak_count || 0) + 1 : 1;
    updateSettingValue('streak_count', newStreak.toString());
    updateSettingValue('streak_last_date', todayStr);
    updateSettingValue('daily_new_count', '0');
    map.streak_count = newStreak.toString();
    map.streak_last_date = todayStr;
    map.daily_new_count = '0';
  }

  return map;
}

// --- 4. 資料庫輔助函式 ---

function initSheets() {
  let cardSheet = SS.getSheetByName('cards');
  if (!cardSheet) {
    cardSheet = SS.insertSheet('cards');
    const headers = ['id', 'word', 'sentence', 'note', 'due', 'stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'lapses', 'state', 'last_review', 'lang', 'created_at'];
    cardSheet.appendRow(headers);
    cardSheet.setFrozenRows(1);
  }

  let settingSheet = SS.getSheetByName('settings');
  if (!settingSheet) {
    settingSheet = SS.insertSheet('settings');
    settingSheet.appendRow(['key', 'value']);
    updateSettingValue('streak_count', '0');
    updateSettingValue('daily_new_count', '0');
    updateSettingValue('last_modified', new Date().toISOString());
  }
}

function batchAppendCards(cardsArray) {
  const sheet = SS.getSheetByName('cards');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rows = cardsArray.map(card => headers.map(h => (card[h] ?? "")));
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }
}

function getSettingValue(key) {
  const sheet = SS.getSheetByName('settings');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function updateSettingValue(key, value) {
  const sheet = SS.getSheetByName('settings');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function getRawData(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values.shift();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (h === 'state' && (val === "" || val === null)) val = 0;
      if (val instanceof Date) val = val.toISOString();
      obj[h] = val;
    });
    return obj;
  });
}


function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
