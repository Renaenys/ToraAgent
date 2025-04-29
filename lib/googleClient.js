// ✅ lib/googleClient.js
import { google } from "googleapis";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
}

export function getGoogleClient(accessToken) {
  const auth = getOAuthClient();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}
