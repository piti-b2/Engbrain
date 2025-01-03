import { authMiddleware } from "@clerk/nextjs";
 
// See https://clerk.com/docs/references/nextjs/auth-middleware
// for more information about configuring your middleware
 
export default authMiddleware({
  publicRoutes: ["/", "/login", "/signup"],
  ignoredRoutes: ["/api/webhook/clerk"],
});
 
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
