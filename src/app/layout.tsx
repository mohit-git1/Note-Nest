import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { NotificationBanner } from "@/components/NotificationBanner";
import { TopNav } from "@/components/TopNav";
import ActionSuggestionToast from "@/components/ActionSuggestionToast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoteNest — AI Meeting Assistant",
  description: "Real-time AI meeting assistant with live transcription and intelligent suggestions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-screen flex flex-col overflow-hidden" suppressHydrationWarning>
        <Providers>
          <TopNav />
          <NotificationBanner />
          <div className="flex flex-col flex-1 pt-14 min-h-0">
            {children}
          </div>
          <ActionSuggestionToast />
        </Providers>
      </body>
    </html>
  );
}
