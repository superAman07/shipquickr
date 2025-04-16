import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) { 
  if (request.nextUrl.pathname === '/blocked') {
    const blockedResponse = new NextResponse(null, { status: 403 }) 
    setSecurityHeaders(blockedResponse)
    return blockedResponse
  } 
  const response = NextResponse.next()
  setSecurityHeaders(response)
  return response
}

function setSecurityHeaders(response: NextResponse) {
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' https:; script-src 'self' https: 'unsafe-inline'; style-src 'self' https: 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'NONE'"
  )
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'interest-cohort=()')
  response.headers.set('X-Robots-Tag', 'none')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('X-Content-Security-Policy', "default-src 'self'")
}
