import { google } from "googleapis";
import type { Shift, Staff } from "@/types";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

const TZ = process.env.APP_TIMEZONE ?? "Europe/Paris";

// Timezone du serveur de déploiement peut différer — on force le formatage
// en Europe/Paris via Intl.DateTimeFormat, indépendamment du TZ du serveur.
function toLocalStr(isoString: string): string {
  if (!isoString) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).format(new Date(isoString));
}

function toLocalTime(isoString: string): string {
  if (!isoString) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TZ,
    hour: "2-digit", minute: "2-digit",
    hour12: false,
  }).format(new Date(isoString));
}

function getAuthClient() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
  });
}

function shiftToRow(shift: Shift): string[] {
  return [
    shift.id,
    shift.staff_id,
    shift.staff_name,
    shift.date,
    toLocalTime(shift.start_time),
    shift.end_time ? toLocalTime(shift.end_time) : "",
    shift.duration_minutes?.toString() ?? "",
    shift.notes,
    toLocalStr(shift.updated_at),
  ];
}

// Staff sheet columns: A=id | B=name | C=role | D=pin | E=active
export async function getStaffFromSheet(): Promise<Staff[]> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "staff!A2:E", // bỏ qua dòng header
  });

  const rows = response.data.values ?? [];
  const now = new Date().toISOString();

  return rows
    .filter((row) => row[0] && row[1]) // bỏ dòng trống
    .map((row) => ({
      id: row[0],
      name: row[1],
      role: row[2] ?? "",
      pin: row[3] ?? "",
      active: row[4]?.toLowerCase() !== "false",
      created_at: now,
      updated_at: now,
    }));
}

export async function appendShiftToSheet(shift: Shift): Promise<void> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "shifts!A:I",
    valueInputOption: "RAW",
    requestBody: { values: [shiftToRow(shift)] },
  });
}

export async function updateShiftInSheet(shift: Shift): Promise<void> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "shifts!A:A",
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((row) => row[0] === shift.id);

  if (rowIndex === -1) {
    await appendShiftToSheet(shift);
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `shifts!A${rowIndex + 1}:I${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [shiftToRow(shift)] },
  });
}
