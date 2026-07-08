import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MekinaMarket — Premium Car Marketplace in Ethiopia",
  description: "Buy and sell verified, anti-middleman cars in Ethiopia with image-matching duplicate detection.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  let user = null;
  let dbUser = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, phone, email")
        .eq("auth_id", user.id)
        .maybeSingle();
      dbUser = profile;
    }
  } catch (error) {
    console.error("Auth status error:", error);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-[#f8fafc] selection:bg-amber-500/20 selection:text-amber-300">
        {/* Premium Glassmorphic Header */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-[#0b0f19]/80 backdrop-blur-md">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xl font-black tracking-tight text-white hover:opacity-90 transition"
            >
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">🚗 MekinaMarket</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link 
                href="/sell" 
                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold text-sm py-2 px-4 rounded-xl shadow-lg hover:shadow-orange-500/10 active:scale-95 transition duration-150"
              >
                Sell a car
              </Link>
              
              {user ? (
                <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-200">
                      {dbUser?.display_name || "Seller"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {dbUser?.email || user.email}
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-inner uppercase">
                    {(dbUser?.display_name || "S").slice(0, 1)}
                  </div>
                  <form action="/api/auth/logout" method="POST">
                    <button 
                      type="submit" 
                      className="text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/30 py-1.5 px-3 rounded-lg transition duration-150"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="text-sm font-semibold text-slate-300 hover:text-white py-2 px-3 hover:bg-slate-800/40 rounded-lg transition"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </header>

        <main className="flex-1 pb-16">{children}</main>

        <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 space-y-2">
            <p className="font-medium text-slate-400">MekinaMarket — Verified, middleman-free car deals</p>
            <p>© {new Date().getFullYear()} MekinaMarket. Built with Next.js & Supabase.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
