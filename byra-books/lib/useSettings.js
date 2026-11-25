'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

const SettingsCtx = createContext({});
const ReloadCtx = createContext(() => {});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const alive = useRef(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('settings').select('key,value');
    if (!alive.current) return;
    if (error) {
      console.warn('[Byra Books] Gagal memuat pengaturan:', error.message);
      return;
    }
    const o = {};
    (data || []).forEach((r) => (o[r.key] = r.value));
    setSettings(o);
  }, []);

  useEffect(() => {
    alive.current = true;
    load();

    const channel = supabase
      .channel('byra-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => load())
      .subscribe();

    return () => {
      alive.current = false;
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <ReloadCtx.Provider value={load}>
      <SettingsCtx.Provider value={settings}>{children}</SettingsCtx.Provider>
    </ReloadCtx.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsCtx);
}

export function useReloadSettings() {
  return useContext(ReloadCtx);
}
