import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin, isAdminOnlyRoute } from '@/lib/supabase/roles';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: getUser() must run right after client creation so tokens refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const protectedRoutes = [
    '/dashboard',
    '/cotizaciones',
    '/clientes',
    '/facturas',
    '/pipeline',
    '/catalogo',
    '/configuracion',
    '/herramientas',
    '/equipo',
  ];

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based gate: asesor cannot access admin-only routes
  if (user && isAdminOnlyRoute(pathname)) {
    const { data: profile } = await supabase
      .from('parmonca_profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle();

    if (!isAdmin(profile?.rol)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.searchParams.set('blocked', '1');
      return NextResponse.redirect(url);
    }
  }

  // Signed-in users hitting /login go to their dashboard
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
