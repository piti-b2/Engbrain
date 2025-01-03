import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { rateLimitMiddleware } from './lib/rate-limit';
import { prismaClient } from './lib/prisma'; 

const publicPaths = ["/", "/errors/time-skew"]; 

const isPublic = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

export default authMiddleware({
  publicRoutes: ["/", "/errors/time-skew"], 
  ignoredRoutes: ["/api/webhook/clerk"],
  clockSkewInMs: 300000, 
  debug: true,
  beforeAuth: async (req) => {
    const rateLimitResult = await rateLimitMiddleware(req, NextResponse.next());
    if (rateLimitResult) return rateLimitResult;

    const url = new URL(req.url);
    
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

      if (
        url.searchParams.get("error")?.includes("Clock skew detected") ||
        req.headers.get("x-clerk-error")?.includes("Clock skew detected")
      ) {
        return NextResponse.redirect(new URL("/errors/time-skew", req.url));
      }

      if (auth.userId) {
        const user = await auth.user;
        if (user) {
          await prismaClient.user.upsert({
            where: { id: auth.userId },
            update: {
              email: user.emailAddresses[0]?.emailAddress,
              name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined
            },
            create: {
              id: auth.userId,
              clerkId: auth.userId,
              email: user.emailAddresses[0]?.emailAddress,
              name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
              coins: 0
            }
          });
        }
      }

      if (auth.userId && req.nextUrl.pathname === "/") {
        const dashboardUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(dashboardUrl);
      }

      if (!auth.userId && req.nextUrl.pathname.startsWith('/dashboard')) {
        const signInUrl = new URL("/", req.url);
        return NextResponse.redirect(signInUrl);
      }

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