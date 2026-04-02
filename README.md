1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21

if(單字庫裡面沒有任何單字){
  請他去新增單字
}
else{
  if(queue==0){
    恭喜已完成
  }
  else{
    if(hasPickedNew==false){
      複習剩幾個
    }
    else{
      新背剩幾個
    }
  }
}


這套邏輯的核心在於 **「任務驅動 (Task-Driven)」**。我們不再關注資料庫裡幾千筆的總數，而是專注於 **「現在桌上有幾張卡片」**。

這裡為你整理好前端與後端對接的完整邏輯鏈條，你可以直接存檔作為開發指南：

---

## 核心邏輯架構：四層判定

### 1. 第一層：冷啟動 (庫存檢查)
* **條件**：`cards.length === 0` 且 `hasPickedNew === false`。
* **意義**：使用者剛註冊，或者背完了所有單字（包含庫存）。
* **UI 表現**：灰色 Box，提示「請去匯入單字」。

### 2. 第二層：任務清空 (今日完結)
* **條件**：`cards.length === 0` 且 `hasPickedNew === true`。
* **意義**：今日份額（複習 + 20 張新詞）已全部消化完畢。
* **UI 表現**：綠色 Box，「恭喜已完成」。按鈕 `disabled`。

### 3. 第三層：複習階段 (Phase 1)
* **條件**：`cards.length > 0` 且 `hasPickedNew === false`。
* **意義**：處理 GAS 回傳的過期舊卡。
* **UI 表現**：藍色 Box，「複習剩餘：X 張」。按鈕文字「開始複習」。

### 4. 第四層：新背階段 (Phase 2)
* **條件**：`cards.length > 0` 且 `hasPickedNew === true`。
* **意義**：複習已清空，目前正在處理今日領取的 20 張新詞。
* **UI 表現**：黃色 Box，「新背剩餘：X 張」。按鈕文字「開始新背」。

---

## 關鍵技術實作要點

### A. Store 初始化守衛 (`fetchEverything`)
為了避免「畫面跳變」，Reload 時的判定流程：
1.  **Fetch**：從 GAS 拿到 `cards` (今日任務) 與 `settings`。
2.  **判定**：
    * 如果 `cards.length === 0` 且 `daily_new_picked` 是 `false`。
    * **Action**：立即發送 `gasPost` 領取新卡，並將本地 `daily_new_picked` 設為 `true`。
3.  **Release**：只有當上述動作完成，才將 `isLoading` 設為 `false`，讓 Dashboard 顯示。

### B. 型別陷阱 (Boolean vs String)
由於 Google Sheets 會自動轉換型別，前端判定必須使用 `String()` 強制轉型：
* **判定式**：`String(settings.daily_new_picked) === 'true'`。
* 這能確保不論 GAS 回傳的是 `true` (Boolean) 還是 `"true"` (String)，邏輯都不會斷掉。

### C. GAS (後端) 的職責
GAS 不再是單純的 `getData`，它必須扮演 **「過濾器」**：
* **`getAll`**：只回傳 `(state != 0 && due <= now) + (今天剛領取的 20 張)`。
* **`getSettings`**：讀取時自動檢查日期。若日期跨日，自動將 `daily_new_picked` 在資料庫重置為 `false`。

---

## 程式碼速查清單 (Dashboard `useMemo`)

```typescript
const stats = useMemo(() => {
  const hasPickedNew = String(settings?.daily_new_picked) === 'true';
  return {
    queueSize: cards.length, // 這就是你最核心的數字
    hasPickedNew: hasPickedNew
  };
}, [cards, settings]);
```

這套邏輯整理好後，你的 App 就會像一個專業的學習工具：**永遠只讓使用者看「現在」該做的事，而把複雜的過濾與領取藏在後台。** 改天要動工時，直接照這份清單檢查即可！