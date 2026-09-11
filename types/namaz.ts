export type Prayer = "fajr" | "zuhr" | "asr" | "maghrib" | "isha";

export interface NamazLog {
  id: string;
  user_id: string;
  prayer: Prayer;
  date: string;
  status: "prayed" | "missed";
  excused: boolean;
  excuse_note: string | null;
  created_at: string;
}

export interface NamazQaza {
  id: string;
  user_id: string;
  prayer: Prayer;
  prayed_at: string;
  note: string | null;
  created_at: string;
}

export const PRAYER_ORDER: Prayer[] = ["fajr", "zuhr", "asr", "maghrib", "isha"];

export const PRAYER_LABELS: Record<Prayer, string> = {
  fajr: "Fajr",
  zuhr: "Zuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

export const BASELINE: Record<Prayer, number> = {
  fajr: -1460,
  zuhr: -365,
  asr: -365,
  maghrib: -365,
  isha: -365,
};
