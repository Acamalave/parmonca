'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Rol } from '@/lib/supabase/roles';

export type Profile = {
  id: string;
  email: string;
  nombre: string | null;
  rol: Rol;
  activo: boolean;
  avatar_url: string | null;
  meta_mensual_usd: number | null;
};

/**
 * Returns the current user's profile + role.
 * `loading` is true until the first fetch resolves.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let canceled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!canceled) { setProfile(null); setLoading(false); }
        return;
      }
      const { data } = await supabase
        .from('parmonca_profiles')
        .select('id, email, nombre, rol, activo, avatar_url, meta_mensual_usd')
        .eq('id', user.id)
        .maybeSingle();
      if (!canceled) {
        setProfile(data as Profile | null);
        setLoading(false);
      }
    })();

    return () => { canceled = true; };
  }, []);

  return { profile, loading };
}
