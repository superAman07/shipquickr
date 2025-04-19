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

// import { NextRequest, NextResponse } from "next/server"
// import { jwtVerify } from "jose"
// import { prisma } from "@/lib/prisma"

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl

//   // 1) Security headers for all responses
//   const setSec = (res: NextResponse) => {
//     res.headers.set("Content-Security-Policy", "default-src 'self' https:; script-src 'self' https: 'unsafe-inline'; style-src 'self' https: 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'NONE'")
//     res.headers.set("X-Frame-Options", "DENY")
//     res.headers.set("X-Content-Type-Options", "nosniff")
//     res.headers.set("X-DNS-Prefetch-Control", "on")
//     res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
//     res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
//     res.headers.set("Permissions-Policy", "interest-cohort=()")
//     res.headers.set("X-Robots-Tag", "none")
//     res.headers.set("X-Download-Options", "noopen")
//     res.headers.set("X-Permitted-Cross-Domain-Policies", "none")
//     return res
//   }

//   // 2) If dashboard route, enforce token + existence check
//   if (pathname.startsWith("/user/dashboard")) {
//     const token = request.cookies.get("userToken")?.value
//     if (token) {
//       try {
//         const { payload } = await jwtVerify(
//           token,
//           new TextEncoder().encode(process.env.JWT_SECRET!)
//         )
//         const userId = payload.userId as number

//         const user = await prisma.user.findUnique({ where: { id: userId } })
//         if (!user || user.status === false) {
//           // deleted or deactivated
//           const res = NextResponse.redirect(new URL("/user/auth/login", request.url))
//           res.cookies.delete({ name: "userToken", path: "/" })
//           return setSec(res)
//         }
//       } catch {
//         // invalid/expired token
//         const res = NextResponse.redirect(new URL("/user/auth/login", request.url))
//         res.cookies.delete({ name: "userToken", path: "/" })
//         return setSec(res)
//       }
//     } else {
//       // no token
//       const res = NextResponse.redirect(new URL("/user/auth/login", request.url))
//       return setSec(res)
//     }
//   }

//   // 3) Default: just pass through with headers
//   return setSec(NextResponse.next())
// }

// export const config = {
//   // apply to both security and auth on these paths
//   matcher: ["/user/dashboard/:path*", "/blocked"]
// }
