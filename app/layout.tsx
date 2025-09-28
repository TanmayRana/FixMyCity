import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/app/providers";
import { AuthInitializer } from "@/app/auth/AuthInitializer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FixMyCity - Civic Grievance Redressal Platform",
  description:
    "A Unified Civic Grievance Redressal Platform for citizens and administrators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            <AuthInitializer />
            {children}
            <Toaster />
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
