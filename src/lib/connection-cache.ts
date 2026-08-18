const GOOGLE_KEY = "campaign_conn_google";
const WHATSAPP_KEY = "campaign_conn_whatsapp";

export type CachedConnection = {
  connected: boolean;
  contact: string | null;
  updatedAt: number;
};

function read(key: string): CachedConnection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CachedConnection;
  } catch {
    return null;
  }
}

function write(key: string, data: CachedConnection) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(data));
}

function clear(key: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(key);
}

export const connectionCache = {
  getGoogle: () => read(GOOGLE_KEY),
  setGoogle: (connected: boolean, contact: string | null) =>
    write(GOOGLE_KEY, { connected, contact, updatedAt: Date.now() }),
  clearGoogle: () => clear(GOOGLE_KEY),

  getWhatsApp: () => read(WHATSAPP_KEY),
  setWhatsApp: (connected: boolean, contact: string | null) =>
    write(WHATSAPP_KEY, { connected, contact, updatedAt: Date.now() }),
  clearWhatsApp: () => clear(WHATSAPP_KEY),
};
