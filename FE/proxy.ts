import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EXACT_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/first-change-password",
];

const PREFIX_ROUTES = [
  "/posts",
  "/products",
  "/search",
  "/ai-studio",
  "/profile",
  "/admin",
  "/cart",
  "/checkout",
  "/notifications",
  "/chat",
  "/auth",
  "/seller",
  "/shop",
  "/explore",
  "/post",
  "/product",
  "/wishlist",
  "/order"
];

export default function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = req.nextUrl.pathname;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/api") || // nếu API không muốn bị chặn
    pathname.startsWith("/.well-known")
  ) {
    return NextResponse.next();
  }
  const firstLogin = req.cookies.get("first_login")?.value;

  // =============================================================
  // 1. First-change-password restriction
  // =============================================================
  if (pathname.startsWith("/first-change-password")) {
    if (firstLogin === "false") {
      url.pathname = "/403";
      return NextResponse.rewrite(url);
    }

    if (pathname !== "/first-change-password") {
      url.pathname = "/403";
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // =============================================================
  // 2. Exact routes validation
  // =============================================================

  if (EXACT_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const exactParent = EXACT_ROUTES.find((r) => pathname.startsWith(r + "/"));
  if (exactParent) {
    url.pathname = "/403";
    return NextResponse.rewrite(url);
  }

  // =============================================================
  // 3. Prefix routes validation
  // =============================================================

  const prefixAllowed = PREFIX_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (prefixAllowed) {
    return NextResponse.next();
  }

  // =============================================================
  // 4. All other routes → 403 UI
  // =============================================================

  url.pathname = "/403";
  return NextResponse.rewrite(url);
}
