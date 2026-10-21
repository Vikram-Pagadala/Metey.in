/**
 * METEY website enquiries: saves each enquiry to this Google Sheet and emails the office.
 * Setup steps are in README.md next to this file.
 */
const NOTIFY_TO = "info@metey.in";
const NOTIFY_CC = "prasad@metey.in";
const SHEET_NAME = "Enquiries";
const HEADERS = ["Received", "Reference", "Name", "Email", "Phone", "Service", "Message", "Page"];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Hidden "website" field: people never see it, spam bots fill it in. Pretend success.
  if (p.website) return json({ result: "success" });

  const d = {
    name: text(p.name, 200),
    email: text(p.email, 200),
    phone: text(p.phone, 50),
    service: text(p.service, 100) || "Not sure yet",
    message: text(p.message, 5000),
    page: text(p.page, 200)
  };
  if (!d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !d.message) {
    return json({ result: "error", error: "Name, a valid email and a message are required." });
  }

  // One enquiry at a time, so reference numbers never repeat.
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  let ref;
  try {
    const sheet = getSheet();
    const year = new Date().getFullYear();
    ref = "METEY-" + year + "-" + String(sheet.getLastRow()).padStart(4, "0");
    sheet.appendRow([new Date(), ref, cell(d.name), cell(d.email), cell(d.phone), cell(d.service), cell(d.message), cell(d.page)]);
  } finally {
    lock.releaseLock();
  }

  // The enquiry is already saved; a mail failure is logged but does not fail the form.
  try {
    MailApp.sendEmail({
      to: NOTIFY_TO,
      cc: NOTIFY_CC,
      replyTo: d.email,
      name: "METEY website",
      subject: "New enquiry " + ref + ": " + d.service + " - " + d.name,
      body: [
        "A new enquiry arrived through metey.in.",
        "",
        "Reference: " + ref,
        "Name: " + d.name,
        "Email: " + d.email,
        "Phone: " + (d.phone || "-"),
        "Service: " + d.service,
        "",
        "About the project:",
        d.message,
        "",
        "Reply to this email to answer " + d.name + " directly.",
        "All enquiries: " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      ].join("\n")
    });
  } catch (err) {
    console.error("Notification email failed for " + ref + ": " + err);
  }

  return json({ result: "success", ref: ref });
}

/* Opening the web-app URL in a browser shows this, which confirms the deployment works. */
function doGet() {
  return ContentService.createTextOutput("METEY enquiry endpoint is running.");
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function text(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

/* Sheets treats text starting with = + - @ as a formula; store it as plain text instead. */
function cell(v) {
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
