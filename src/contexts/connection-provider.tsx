"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { connectionCache } from "@/lib/connection-cache";
import { whatsappApi } from "@/lib/campaign-api";

type GoogleState = {
  connected: boolean;
  email: string | null;
  loading: boolean;
  initialized: boolean;
};

type WhatsAppState = {
  connected: boolean;
  phone: string | null;
  loading: boolean;
  initialized: boolean;
};

type ConnectionContextValue = {
  google: GoogleState;
  whatsapp: WhatsAppState;
  refreshGoogle: (background?: boolean) => Promise<void>;
  refreshWhatsApp: (background?: boolean) => Promise<void>;
  setGoogleConnected: (email: string) => void;
  setGoogleDisconnected: () => void;
  setWhatsAppConnected: (phone: string) => void;
  setWhatsAppDisconnected: () => void;
};

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const mounted = useRef(false);
  const cacheHydrated = useRef(false);

  const [google, setGoogle] = useState<GoogleState>({
    connected: false,
    email: null,
    loading: false,
    initialized: false,
  });

  const [whatsapp, setWhatsApp] = useState<WhatsAppState>({
    connected: false,
    phone: null,
    loading: false,
    initialized: false,
  });

  useEffect(() => {
    if (cacheHydrated.current) return;
    cacheHydrated.current = true;

    const cachedGoogle = connectionCache.getGoogle();
    if (cachedGoogle) {
      setGoogle({
        connected: cachedGoogle.connected,
        email: cachedGoogle.contact,
        loading: false,
        initialized: true,
      });
    }

    const cachedWhatsApp = connectionCache.getWhatsApp();
    if (cachedWhatsApp) {
      setWhatsApp({
        connected: cachedWhatsApp.connected,
        phone: cachedWhatsApp.contact,
        loading: false,
        initialized: true,
      });
    }
  }, []);

  const refreshGoogle = useCallback(async (background = false) => {
    if (!background && !google.initialized) {
      setGoogle((g) => ({ ...g, loading: true }));
    }
    try {
      const resp = await fetch("/api/auth/google/status", { credentials: "include" });
      const data = await resp.json();
      const connected = !!data.connected;
      const email = data.email ?? null;
      connectionCache.setGoogle(connected, email);
      setGoogle({ connected, email, loading: false, initialized: true });
    } catch {
      setGoogle((g) => ({ ...g, loading: false, initialized: true }));
    }
  }, [google.initialized]);

  const refreshWhatsApp = useCallback(async (background = false) => {
    if (!background && !whatsapp.initialized) {
      setWhatsApp((w) => ({ ...w, loading: true }));
    }
    try {
      const data = await whatsappApi.getStatus();
      const connected = !!data.connected && !!data.phone;
      const phone = data.phone ?? null;
      connectionCache.setWhatsApp(connected, phone);
      setWhatsApp({ connected, phone, loading: false, initialized: true });
    } catch {
      setWhatsApp((w) => ({ ...w, loading: false, initialized: true }));
    }
  }, [whatsapp.initialized]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    void refreshGoogle(true);
    void refreshWhatsApp(true);
  }, [refreshGoogle, refreshWhatsApp]);

  const setGoogleConnected = useCallback((email: string) => {
    connectionCache.setGoogle(true, email);
    setGoogle({ connected: true, email, loading: false, initialized: true });
  }, []);

  const setGoogleDisconnected = useCallback(() => {
    connectionCache.clearGoogle();
    setGoogle({ connected: false, email: null, loading: false, initialized: true });
  }, []);

  const setWhatsAppConnected = useCallback((phone: string) => {
    connectionCache.setWhatsApp(true, phone);
    setWhatsApp({ connected: true, phone, loading: false, initialized: true });
  }, []);

  const setWhatsAppDisconnected = useCallback(() => {
    connectionCache.clearWhatsApp();
    setWhatsApp({ connected: false, phone: null, loading: false, initialized: true });
  }, []);

  const value = useMemo(
    () => ({
      google,
      whatsapp,
      refreshGoogle,
      refreshWhatsApp,
      setGoogleConnected,
      setGoogleDisconnected,
      setWhatsAppConnected,
      setWhatsAppDisconnected,
    }),
    [
      google,
      whatsapp,
      refreshGoogle,
      refreshWhatsApp,
      setGoogleConnected,
      setGoogleDisconnected,
      setWhatsAppConnected,
      setWhatsAppDisconnected,
    ]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnections() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnections must be used within ConnectionProvider");
  return ctx;
}
