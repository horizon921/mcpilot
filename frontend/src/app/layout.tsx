import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css"; // Global styles
import ThemeProvider from "@/components/Theme/ThemeProvider"; // Assuming ThemeProvider path
import { Toaster } from "@/components/Common/Toaster"; // Global Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCPilot - AI Assistant",
  description: "An AI assistant application with MCP support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground overflow-hidden flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster /> {/* Global Toaster can be here */}
        </ThemeProvider>
      </body>
    </html>
  );
}