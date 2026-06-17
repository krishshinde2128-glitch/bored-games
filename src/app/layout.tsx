import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

import { GlobalNotifications } from "@/components/notifications/GlobalNotifications";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MultiBoredGams Hub",
  description: "A premium 13-game multiplayer web hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-50 text-zinc-900 antialiased`}>
        <AuthProvider>
          <GlobalNotifications />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
