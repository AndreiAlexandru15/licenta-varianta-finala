/**
 * Middleware pentru autentificare și autorizare
 * @fileoverview Verifică autentificarea utilizatorilor și direcționează către login
 */

import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getToken } from "next-auth/jwt";

/**
 * Rutele care nu necesită autentificare
 */
const PUBLIC_ROUTES = [
  '/login', 
  '/not-found',
  '/api/auth/login', 
  '/api/auth/logout',
  '/api/auth/session',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/csrf'
]

/**
 * Rutele API care necesită autentificare
 */
const PROTECTED_API_ROUTES = ['/api/utilizatori', '/api/documente', '/api/departamente', '/api/registru']

/**
 * Rutele existente în aplicație
 */
const EXISTING_ROUTES = [
  '/',
  '/dashboard',
  '/dashboard/e-registratura',
  '/dashboard/documente', 
  '/dashboard/admin',
  '/login',
  '/not-found'
]

/**
 * Verifică dacă o rută este validă
 */
function isValidRoute(pathname) {
  // Rute exacte
  if (EXISTING_ROUTES.includes(pathname)) return true
  
  // Rute dinamice pentru e-registratura
  if (pathname.startsWith('/dashboard/e-registratura/')) {
    const segments = pathname.split('/').filter(Boolean)
    // Permite: /dashboard/e-registratura/[departmentId] și /dashboard/e-registratura/[departmentId]/[registerId]
    return segments.length <= 4
  }
  
  // API routes - toate sunt considerate valide (vor fi gestionate de Next.js)
  if (pathname.startsWith('/api/')) return true
  
  // Rute statice
  if (pathname.startsWith('/_next/') || pathname.startsWith('/public/') || pathname.includes('.')) return true
  
  return false
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Verifică dacă este rută publică sau NextAuth
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Pentru rute statice, lasă să treacă
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/public/') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Verifică dacă ruta există
  if (!isValidRoute(pathname)) {
    // Pentru API routes inexistente, returnează 404 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }
    // Pentru alte rute inexistente, lasă Next.js să gestioneze 404-ul (nu returna nimic aici)
    return NextResponse.next();
  }

  // Folosește NextAuth pentru a verifica sesiunea JWT
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!session) {
    // Dacă este rută API protejată, returnează 401
    if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.json(
        { error: 'Nu ești autentificat' },
        { status: 401 }
      );
    }
    // Pentru alte rute, redirecționează la login
    return NextResponse.redirect(new URL('/login', request.url));
  }  // Adaugă informațiile utilizatorului în header-ele request-ului
  const requestHeaders = new Headers(request.headers);
  if (session.id) requestHeaders.set('x-user-id', session.id);
  if (session.email) requestHeaders.set('x-user-email', session.email);
  if (session.primariaId) requestHeaders.set('x-primaria-id', session.primariaId);

  // Adaugă permisiunile utilizatorului pentru API routes din JWT token
  if (pathname.startsWith('/api/') && session.permissions) {
    requestHeaders.set('x-user-permissions', JSON.stringify(session.permissions));
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
