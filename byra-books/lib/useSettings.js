'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useSettings() {
  const [s, setS] = useState({});
  useEffect(() => {
    let alive = true;
    supabase
      .from('settings')
      .select('key,value')
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) { console.warn('[Byra Books] Gagal memuat pengaturan:', error.message); return; }
        const o = {};
        (data || []).forEach((r) => (o[r.key] = r.value));
        setS(o);
      });
    return () => { alive = false; };
  }, []);
  return s;
}
