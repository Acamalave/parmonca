import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PAIS_COOKIE = 'parmonca_pais';

// ── Tienda en stand-by ────────────────────────────────────────────────────
// La tienda pública queda oculta (redirige al home) sin borrar nada de código.
// Vista previa interna: visitar /acceso-tienda?clave=<TIENDA_PREVIEW_CLAVE>
// fija una cookie que vuelve a habilitar las rutas para ese navegador.
const RUTAS_TIENDA = ['/productos', '/repuestos', '/cotizar'];
const PREVIEW_COOKIE = 'parmonca_preview';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Activación de la vista previa de la tienda (solo con la clave correcta).
  if (pathname === '/acceso-tienda') {
    const clave = request.nextUrl.searchParams.get('clave');
    const esperada = process.env.TIENDA_PREVIEW_CLAVE;
    if (clave && esperada && clave === esperada) {
      const res = NextResponse.redirect(new URL('/productos', request.url));
      res.cookies.set(PREVIEW_COOKIE, '1', {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
      return res;
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Stand-by: la tienda redirige al home salvo vista previa activa.
  const esTienda = RUTAS_TIENDA.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );
  if (esTienda && request.cookies.get(PREVIEW_COOKIE)?.value !== '1') {
    return NextResponse.redirect(new URL('/', request.url));
  }

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
