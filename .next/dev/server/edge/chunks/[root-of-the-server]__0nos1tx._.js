(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__0nos1tx._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
function middleware(request) {
    const { pathname } = request.nextUrl;
    // 1. Skip static assets, APIs, and public pages
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.') || pathname === '/' || pathname.startsWith('/auth') || pathname === '/blocked' || pathname === '/about' || pathname === '/support' || pathname === '/hostel-guide' || pathname === '/rules' || pathname === '/faq' || pathname === '/terms' || pathname === '/privacy') {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // 2. Fetch local session storage/cookie simulation or Supabase Auth token
    // Supabase stores auth cookies under the form "sb-X-auth-token" or custom keys.
    // In a unified client/server sync, we inspect the cookie.
    const allCookies = request.cookies.getAll();
    const authCookie = allCookies.find((c)=>c.name.includes('-auth-token'));
    const userRoleCookie = request.cookies.get('user-role')?.value;
    const userStatusCookie = request.cookies.get('user-status')?.value;
    const isAuthenticated = !!authCookie || !!userRoleCookie;
    // 3. Gating logic for unauthenticated users
    if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
    }
    // 4. Blocked Student Gate
    if (userStatusCookie === 'BLOCKED') {
        const blockedUrl = new URL('/blocked', request.url);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(blockedUrl);
    }
    // 5. Admin Portal Protection (/admin/*)
    if (pathname.startsWith('/admin')) {
        if (userRoleCookie !== 'admin') {
            // Redirect students or others to their cockpit dashboard
            const studentDashboard = new URL('/student/dashboard', request.url);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(studentDashboard);
        }
    }
    // 6. Student Cockpit Protection (/student/*)
    if (pathname.startsWith('/student')) {
        if (userRoleCookie !== 'student' && userRoleCookie !== 'student_user') {
            // Redirect admins to their authorized dashboard
            const adminDashboard = new URL('/admin/dashboard', request.url);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(adminDashboard);
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
}
const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0nos1tx._.js.map