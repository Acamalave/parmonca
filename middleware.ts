import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PAIS_COOKIE = 'parmonca_pais';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Autodetección de país en la primera visita: fijamos la cookie sólo si el
  // visitante aún no la tiene, para no pisar una elección manual posterior.
  // Vercel expone el país por IP en `x-vercel-ip-country` (ISO-3166, p.ej. CR).
  if (!request.cookies.get(PAIS_COOKIE)) {
    const country = request.headers.get('x-vercel-ip-country');
    const pais = country === 'CR' ? 'CR' : 'PA';
    response.cookies.set(PAIS_COOKIE, pais, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, images, and API.
     * The /api/cotizacion endpoint must remain public for the store form.
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
