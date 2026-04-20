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
  // Cheap check — Better-Auth cookie name defaults to 'realva.session_token' (see auth.ts cookiePrefix)
  const cookie = req.cookies.get('realva.session_token')?.value;
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
