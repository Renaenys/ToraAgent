// ✅ lib/sheetsUtils.js
import { google } from "googleapis";
import { getOAuthClient } from "./googleClient";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function addContactToSheet(accessToken, { name, email }) {
  const auth = getOAuthClient();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });

  // ✅ Step 1: Get current sheet contacts
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Contact!A:B",
  });

  const values = existing.data.values || [];

  // ✅ Step 2: Check for existing email
  const exists = values.some(
    (row) => row[1]?.toLowerCase() === email.toLowerCase()
  );
  if (exists) {
    return { duplicate: true };
  }

  // ✅ Step 3: Append if not duplicate
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "Contact!A:B",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[name, email]],
    },
  });

  return { success: true };
}

export async function getContactsFromSheet(accessToken) {
  const auth = getOAuthClient();
  auth.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Contact!A:B",
  });

  return res.data.values || [];
}
