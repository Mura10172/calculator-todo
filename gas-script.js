// ========================================
// Google Apps Script - Todo連携 (v2)
// スプレッドシートの「拡張機能 → Apps Script」に貼り付け
// ※ 貼り付け後「デプロイ」→「デプロイを管理」→ 鉛筆アイコン →
//   バージョンを「新バージョン」にして「デプロイ」をクリック
// ========================================

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET: パラメータなし→データ取得、パラメータあり→データ書き込み
function doGet(e) {
  // ?action=save&data=... の場合は書き込み
  if (e.parameter.action === 'save') {
    return saveTodos(e.parameter.data);
  }
  // それ以外は読み取り
  return loadTodos();
}

// POST: データ書き込み
function doPost(e) {
  return saveTodos(e.postData.contents);
}

// データ読み取り
function loadTodos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var todos = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] !== '' && data[i][1] !== '') {
      todos.push({
        id: Number(data[i][0]),
        text: String(data[i][1]),
        done: data[i][2] === '完了',
        updatedAt: String(data[i][3])
      });
    }
  }

  return createJsonResponse({ status: 'ok', todos: todos });
}

// データ書き込み
function saveTodos(jsonStr) {
  try {
    var body = JSON.parse(jsonStr);
    var todos = body.todos || [];
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // ヘッダー行を残してデータをクリア
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
    }

    // 新しいデータを書き込み
    var now = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    if (todos.length > 0) {
      var values = [];
      for (var i = 0; i < todos.length; i++) {
        values.push([
          todos[i].id,
          todos[i].text,
          todos[i].done ? '完了' : '未完了',
          now
        ]);
      }
      sheet.getRange(2, 1, values.length, 4).setValues(values);
    }

    return createJsonResponse({ status: 'ok', count: todos.length });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}
