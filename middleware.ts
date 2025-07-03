import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function sets security headers on any response
function setSecurityHeaders(response: NextResponse) {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' https:; script-src 'self' https: 'unsafe-inline'; style-src 'self' https: 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'none'"
  )
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'interest-cohort=()')
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = request.cookies.get('userToken')?.value || ''

  // Define which paths are public (don't require a token)
  const isPublicPath = 
    path === '/user/auth/login' || 
    path === '/user/auth/signup' || 
    path === '/user/auth/verifyemail' ||
    path === '/';
   
  if (path === '/user/dashboard/wallet') {
    const response = NextResponse.next();
    setSecurityHeaders(response);
    return response;
  }
 
  if (!isPublicPath && !token) {
    const loginUrl = new URL('/user/auth/login', request.nextUrl)
    const redirectResponse = NextResponse.redirect(loginUrl)
    setSecurityHeaders(redirectResponse)  
    return redirectResponse
  }
 
  const response = NextResponse.next()
  setSecurityHeaders(response)  
  return response
}
 
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}







// import { NextRequest, NextResponse } from 'next/server'

// export function middleware(request: NextRequest) { 
//   if (request.nextUrl.pathname === '/blocked') {
//     const blockedResponse = new NextResponse(null, { status: 403 }) 
//     setSecurityHeaders(blockedResponse)
//     return blockedResponse
//   } 
//   const response = NextResponse.next()
//   setSecurityHeaders(response)
//   return response

// }

// function setSecurityHeaders(response: NextResponse) {
//   response.headers.set(
//     'Content-Security-Policy',
//     "default-src 'self' https:; script-src 'self' https: 'unsafe-inline'; style-src 'self' https: 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'NONE'"
//   )
//   response.headers.set('X-Frame-Options', 'DENY')
//   response.headers.set('X-Content-Type-Options', 'nosniff')
//   response.headers.set('X-DNS-Prefetch-Control', 'on')
//   response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
//   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
//   response.headers.set('Permissions-Policy', 'interest-cohort=()')
//   response.headers.set('X-Robots-Tag', 'none')
//   response.headers.set('X-Download-Options', 'noopen')
//   response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
//   response.headers.set('X-Content-Security-Policy', "default-src 'self'")
// }
 
// export const config = {
//   matcher: [
//     '/',
//     '/user/dashboard', // Keep this generic
//     '/user/dashboard/orders/:path*',
//     '/user/dashboard/remittance/:path*',
//     '/user/dashboard/settings/:path*',
//     // Do NOT include '/user/dashboard/wallet' here
//     '/admin/:path*',
//     '/user/auth/login',
//     '/user/auth/signup',
//     '/user/auth/verifyemail'
//   ]
// }