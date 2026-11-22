'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export function useSettings() {
  const [s, setS] = useState({});
  useEffect(() => {
    supabase
      .from('settings')
      .select('key,value')
      .then(({ data }) => {
        const o = {};
        (data || []).forEach((r) => (o[r.key] = r.value));
        setS(o);
      });
  }, []);
  return s;
}
