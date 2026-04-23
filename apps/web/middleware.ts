import { NextRequest, NextResponse } from "next/server";

// Protege /dashboard/** e evita que usuários logados acessem /login e /cadastro

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  const { pathname } = req.nextUrl;

  const isProtected = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/login" || pathname === "/cadastro";

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/cadastro"],
};
