// GPH — استقبال إجابات الاستمارة في Google Sheets
// الصق هذا الكود في Extensions > Apps Script داخل الجدول نفسه.

var SHEET_NAME = "العملاء";
var KEYS = ["ts","name","company","job","phone","email","wilaya","biz","prod","src","prev","needs","goal","qty","when","chan","notes","fdate","int"];
var HEADERS = ["التاريخ","الاسم واللقب","الشركة","الوظيفة","الهاتف","البريد الإلكتروني","الولاية","النشاط","المنتجات","كيف تعرف GPH","تعامل سابق","الاحتياجات","الهدف","الكمية","الموعد","وسيلة التواصل","ملاحظات الممثل","تاريخ المتابعة","درجة الاهتمام"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.setRightToLeft(true);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }
    var row = KEYS.map(function (k) {
      var v = d[k] == null ? "" : String(d[k]);
      // منع تنفيذ الصيغ إذا بدأ النص بـ = أو + أو - أو @
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    });
    sh.appendRow(row);
    return ContentService.createTextOutput("ok");
  } catch (err) {
    return ContentService.createTextOutput("error");
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("GPH form endpoint is running");
}
