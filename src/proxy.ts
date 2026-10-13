import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "techstore_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET не найден в .env.local");
  }

  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Страница входа администратора доступна без авторизации
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Нет авторизации
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);

    loginUrl.searchParams.set("error", "login");

    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getSecretKey()
    );

    // Только ADMIN имеет доступ
    if (payload.role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", request.url);

      loginUrl.searchParams.set("error", "access");

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/admin/login", request.url);

    loginUrl.searchParams.set("error", "login");

    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};