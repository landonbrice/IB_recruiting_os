import { NextRequest, NextResponse } from "next/server";

const BETA_PASSWORD = process.env.BETA_PASSWORD;
const COOKIE_NAME = "ib_coach_beta";

const PROTECTED_PATHS = ["/app"];
const PROTECTED_API = ["/api/chat", "/api/parse-resume", "/api/suggest"];

export function proxy(req: NextRequest) {
  // If no BETA_PASSWORD is set, gate is disabled — let everything through
  if (!BETA_PASSWORD) return NextResponse.next();

  const { pathname } = req.nextUrl;

  const isProtectedPage = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isProtectedAPI = PROTECTED_API.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedAPI) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token === BETA_PASSWORD) return NextResponse.next();

  // Block API calls without valid token
  if (isProtectedAPI) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect page requests to landing with gate flag
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("gate", "1");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app/:path*", "/api/chat", "/api/parse-resume", "/api/suggest"],
};
