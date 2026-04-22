// Role definitions and helper to get current user's role
export type Rol = 'super-admin' | 'gerente' | 'asesor';

export const ADMIN_ROLES: Rol[] = ['super-admin', 'gerente'];

export const isAdmin = (rol: Rol | null | undefined): boolean =>
  !!rol && ADMIN_ROLES.includes(rol);

// Routes restricted to admin roles only
export const ADMIN_ONLY_ROUTES = [
  '/catalogo',        // catalog edit (index is also admin-only to avoid data leak)
  '/equipo',          // team management
  '/configuracion',
  '/facturas',
  '/herramientas',
];

export const isAdminOnlyRoute = (pathname: string): boolean =>
  ADMIN_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
