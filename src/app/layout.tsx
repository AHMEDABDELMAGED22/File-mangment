import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingContactButton } from "@/components/developer/floating-contact-button";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AntiDrive — Secure File Management",
  description: "A secure multi-tenant file management platform. AntiDrive helps you upload, organize, and manage your files with confidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {children}
            <FloatingContactButton />
          </TooltipProvider>
          <Toaster position="bottom-right" richColors closeButton theme="dark" />
        </ThemeProvider>
      </body>
    </html>
  );
}
