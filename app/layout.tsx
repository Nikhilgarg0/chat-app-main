import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/SidebarContext";

export const metadata: Metadata = {
  title: "NEXUS — Enterprise Team Communication",
  description:
    "Nexus is a secure, real-time team communication platform with AI-powered features. Collaborate with your team through channels, direct messages, and intelligent AI assistants.",
  keywords: ["team chat", "real-time messaging", "AI assistant", "collaboration"],
  authors: [{ name: "Nexus Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
