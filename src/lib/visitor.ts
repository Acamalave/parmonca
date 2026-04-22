'use client';

import { createClient } from '@/lib/supabase/client';

const LS_DEVICE_KEY = 'parmonca_device_id';
const LS_LAST_SESSION_KEY = 'parmonca_last_session_at';
const SESSION_WINDOW_MS = 30 * 60 * 1000; // 30 min inactive = new session

type TrackMeta = {
  email?: string;
  telefono?: string;
  nombre?: string;
  empresa?: string;
};

function uuid(): string {
  // Prefer crypto.randomUUID (browser 15.4+) with fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000';
  let id = localStorage.getItem(LS_DEVICE_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(LS_DEVICE_KEY, id);
  }
  return id;
}

function parseUtm(url: string) {
  try {
    const u = new URL(url);
    return {
      utm_source: u.searchParams.get('utm_source') || undefined,
      utm_medium: u.searchParams.get('utm_medium') || undefined,
      utm_campaign: u.searchParams.get('utm_campaign') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Fire-and-forget tracking. Safe to call from any client component.
 * Errors are silenced so tracking never breaks the UX.
 */
export async function track(
  tipo:
    | 'page_view'
    | 'product_view'
    | 'filter_applied'
    | 'search'
    | 'form_answer'
    | 'identified'
    | 'quote_submitted'
    | 'category_selected'
    | 'cta_clicked',
  data: Record<string, unknown> = {},
  meta: TrackMeta = {}
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const device_id = getDeviceId();
    const utm = parseUtm(window.location.href);
    const supabase = createClient();

    // Only capture browser context once per session to keep payload small
    const now = Date.now();
    const lastSession = parseInt(localStorage.getItem(LS_LAST_SESSION_KEY) || '0', 10);
    const newSession = !lastSession || now - lastSession > SESSION_WINDOW_MS;
    if (newSession) localStorage.setItem(LS_LAST_SESSION_KEY, String(now));

    await supabase.rpc('parmonca_track_event', {
      p_device_id: device_id,
      p_tipo: tipo,
      p_data: data,
      p_ruta: window.location.pathname,
      p_email: meta.email ?? null,
      p_telefono: meta.telefono ?? null,
      p_nombre: meta.nombre ?? null,
      p_empresa: meta.empresa ?? null,
      p_utm_source: newSession ? (utm.utm_source ?? null) : null,
      p_utm_medium: newSession ? (utm.utm_medium ?? null) : null,
      p_utm_campaign: newSession ? (utm.utm_campaign ?? null) : null,
      p_referrer: newSession ? (document.referrer || null) : null,
      p_user_agent: newSession ? navigator.userAgent : null,
      p_idioma: newSession ? navigator.language : null,
    });
  } catch {
    // Silently ignore tracking errors
  }
}

