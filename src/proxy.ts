import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, APIs, and public pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname === '/blocked' ||
    pathname === '/about' ||
    pathname === '/support' ||
    pathname === '/hostel-guide' ||
    pathname === '/rules' ||
    pathname === '/faq' ||
    pathname === '/terms' ||
    pathname === '/privacy'
  ) {
    return NextResponse.next();
  }

  // 2. Fetch local session storage/cookie simulation or Supabase Auth token
  // Supabase stores auth cookies under the form "sb-X-auth-token" or custom keys.
  // In a unified client/server sync, we inspect the cookie.
  const allCookies = request.cookies.getAll();
  const authCookie = allCookies.find(c => c.name.includes('-auth-token'));
  const userRoleCookie = request.cookies.get('user-role')?.value;
  const userStatusCookie = request.cookies.get('user-status')?.value;

  const isAuthenticated = !!authCookie || !!userRoleCookie;

  // 3. Gating logic for unauthenticated users
  if (!isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Blocked Student Gate
  if (userStatusCookie === 'BLOCKED') {
    const blockedUrl = new URL('/blocked', request.url);
    return NextResponse.redirect(blockedUrl);
  }

  // 5. Admin Portal Protection (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (userRoleCookie && userRoleCookie !== 'admin') {
      // Redirect students or others to their cockpit dashboard
      const studentDashboard = new URL('/student/dashboard', request.url);
      return NextResponse.redirect(studentDashboard);
    }
  }

  // 6. Student Cockpit Protection (/student/*)
  if (pathname.startsWith('/student')) {
    if (userRoleCookie && userRoleCookie !== 'student' && userRoleCookie !== 'student_user') {
      // Redirect admins to their authorized dashboard
      const adminDashboard = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(adminDashboard);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
