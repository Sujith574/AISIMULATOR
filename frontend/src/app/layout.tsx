import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "../components/Navbar";
import ChatBot from "../components/ChatBot";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
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
  title: "Future Self Simulator | AI Life Coach & Habit Forecaster",
  description: "An AI-powered life simulation platform to visualize how your habits, career choices, financial behaviors, and stress levels influence your future over 1, 5, and 10 years.",
  manifest: "/manifest.json",
  verification: {
    google: "0EVLmGdp_eXEsMqt160zziunDmj9JfuNI_gL01umSls",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased bg-slate-950 text-gray-200`}>
        {/* Ambient Glow background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] height-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-[30%] right-[-10%] w-[600px] height-[600px] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] left-[20%] w-[500px] height-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none z-0" />
        
        {/* Navbar */}
        <Navbar />

        {/* Content Panel */}
        <main className="flex-grow z-10 relative">
          {children}
        </main>

        {/* Footer */}
        <footer className="z-10 border-t border-white/5 py-8 text-center text-xs text-gray-500 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} Future Self Simulator. All rights reserved.</p>
            <p className="mt-1 text-gray-600">
              Disclaimer: Projections represent possible future scenarios based on current inputs, patterns, and behavioral trends, and do not constitute absolute certainty.
            </p>
          </div>
        </footer>
        {/* Floating AI Chat Assistant */}
        <ChatBot />
        {/* PWA Install Promotion Banner */}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
