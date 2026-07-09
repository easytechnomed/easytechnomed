import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "d60155b93198cdce275efee6b4a242c75a4dc372e9a2be74cfd34208a546ccf9"
);

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get("admin_session_token")?.value;
  const superAdminToken = request.cookies.get("super_admin_session_token")?.value;

  // 1. Workspace Admin & Dashboard Pages protection (excludes superadmin routes starting with /adminstration)
  if ((pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) && !pathname.startsWith("/auth") && !pathname.startsWith("/api") && !pathname.startsWith("/adminstration")) {
    if (!adminToken) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    try {
      await jwtVerify(adminToken, JWT_SECRET);
      // Admin session is verified
    } catch (e) {
      const res = NextResponse.redirect(new URL("/auth/login", request.url));
      res.cookies.delete("admin_session_token");
      return res;
    }
  }

  // 2. SuperAdmin Pages protection
  if (pathname.startsWith("/adminstration") && !pathname.startsWith("/adminstration/login") && !pathname.startsWith("/adminstration/api")) {
    if (!superAdminToken) {
      return NextResponse.redirect(new URL("/adminstration/login", request.url));
    }
    try {
      await jwtVerify(superAdminToken, JWT_SECRET);
      // SuperAdmin session is verified
    } catch (e) {
      const res = NextResponse.redirect(new URL("/adminstration/login", request.url));
      res.cookies.delete("super_admin_session_token");
      return res;
    }
  }

  // 3. Prevent logged-in admins from visiting login/register pages
  if ((pathname === "/auth/login" || pathname === "/auth/register") && adminToken) {
    const errorParam = request.nextUrl.searchParams.get("error");
    if (errorParam) {
      return NextResponse.next();
    }
    try {
      await jwtVerify(adminToken, JWT_SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (e) {
      const res = NextResponse.next();
      res.cookies.delete("admin_session_token");
      return res;
    }
  }

  // 4. Prevent logged-in superadmins from visiting superadmin login page
  if (pathname === "/adminstration/login" && superAdminToken) {
    try {
      await jwtVerify(superAdminToken, JWT_SECRET);
      return NextResponse.redirect(new URL("/adminstration/dashboard", request.url));
    } catch (e) {
      const res = NextResponse.next();
      res.cookies.delete("super_admin_session_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin", "/:path*", "/adminstration", "/adminstration/:path*", "/auth/login", "/auth/register"],
};
