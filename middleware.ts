import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/comps',
  '/listings',
  '/contracts',
  '/counter-offer',
  '/flyers',
  '/social',
  '/leads',
  '/open-house',
  '/inspections',
  '/chatbot',
  '/feedback',
  '/cma',
  '/neighborhoods',
  '/nurture',
  '/deadlines',
  '/settings',
  '/admin',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }
  // Cheap presence check — cookie name is `__Secure-realva.session_token` in
  // production (when useSecureCookies is true) and `realva.session_token` in dev.
  const cookie =
    req.cookies.get('__Secure-realva.session_token')?.value ??
    req.cookies.get('realva.session_token')?.value;
  if (!cookie) {
    const login = req.nextUrl.clone();
    login.pathname = '/login';
    login.search = `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|open-house/.+/signin|feedback/respond|feedback/thanks|files).*)'],
};
