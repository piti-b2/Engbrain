import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { rateLimitMiddleware } from './lib/rate-limit';

const publicPaths = ["/", "/errors/time-skew"]; // เพิ่ม path error เข้าไปใน public routes

const isPublic = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

export default authMiddleware({
  publicRoutes: ["/", "/errors/time-skew"], 
  ignoredRoutes: ["/api/webhook/clerk"],
  clockSkewInMs: 300000, // เพิ่มเป็น 5 นาที (300,000 มิลลิวินาที)
  debug: false,
  beforeAuth: async (req) => {
    // Check rate limit first
    const rateLimitResult = await rateLimitMiddleware(req, NextResponse.next());
    if (rateLimitResult) return rateLimitResult;

    const url = new URL(req.url);
    
    // ตรวจจับ Clock Skew Error และ Redirect ไปยังหน้า Error
    if (
      url.searchParams.get("error")?.includes("Clock skew detected") ||
      req.headers.get("x-clerk-error")?.includes("Clock skew detected")
    ) {
      return NextResponse.redirect(new URL("/errors/time-skew", req.url));
    }
  },
  async afterAuth(auth, req) {
    try {
      const url = new URL(req.url);

      // กรณีที่เกิด Clock Skew Error
      if (
        url.searchParams.get("error")?.includes("Clock skew detected") ||
        req.headers.get("x-clerk-error")?.includes("Clock skew detected")
      ) {
        return NextResponse.redirect(new URL("/errors/time-skew", req.url));
      }

      // If the user is logged in and trying to access the home page,
      // redirect them to the dashboard
      if (auth.userId && req.nextUrl.pathname === "/") {
        const dashboardUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // Prevent access to dashboard without login
      if (!auth.userId && req.nextUrl.pathname.startsWith('/dashboard')) {
        const signInUrl = new URL("/", req.url);
        return NextResponse.redirect(signInUrl);
      }

      // ตรวจสอบสิทธิ์ admin
      if (req.nextUrl.pathname.startsWith('/admin')) {
        if (!auth.userId) {
          return NextResponse.redirect(new URL('/', req.url));
        }

        const res = NextResponse.next();
        const supabase = createMiddlewareClient({ req, res });

        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', auth.userId)
          .single();

        if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      return NextResponse.next();
    } catch (error: any) {
      console.error('Middleware error:', error);
      if (error.message?.includes("Clock skew detected")) {
        return NextResponse.redirect(new URL("/errors/time-skew", req.url));
      }
      throw error;
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};