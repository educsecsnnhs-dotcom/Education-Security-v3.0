// utils/sheetsClient.js
const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();

// Load Google credentials from .env (stringified service account key)
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets = google.sheets({ version: "v4", auth });

/**
 * Get values from a sheet
 * @param {string} sheetId - Google Sheet ID
 * @param {string} range - Range like "Sheet1!A1:Z50"
 */
async function getSheetValues(sheetId, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });
  return res.data.values || [];
}

module.exports = { getSheetValues };
