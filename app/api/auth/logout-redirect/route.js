import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request) {
  const cookieStore = await cookies();
  const { searchParams } = new URL(request.url);
  const isSuper = searchParams.get("super") === "true";
  const errorType = searchParams.get("error");

  cookieStore.delete("admin_session_token");
  cookieStore.delete("session_token");

  let dest = "/auth/login";
  if (isSuper) {
    cookieStore.delete("super_admin_session_token");
    dest = "/adminstration/login";
  }

  if (errorType) {
    dest += `?error=${errorType}`;
  }

  return NextResponse.redirect(new URL(dest, request.url));
}
