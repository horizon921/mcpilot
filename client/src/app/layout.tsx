import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css"; // Global styles
import ThemeProvider from "@/components/Theme/ThemeProvider"; // Assuming ThemeProvider path
import { Toaster } from "@/components/Common/Toaster"; // Global Toaster
import AppInitializer from "@/components/App/AppInitializer";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialTheme() {
                  try {
                    const theme = localStorage.getItem('theme');
                    if (theme) return theme;
                    return 'system';
                  } catch (e) {
                    return 'system';
                  }
                }
                function getInitialThemeClass() {
                  try {
                    const themeClassName = localStorage.getItem('theme-class');
                    if (themeClassName) return themeClassName;
                    return ''; // Default theme has no class
                  } catch (e) {
                    return '';
                  }
                }
                const initialTheme = getInitialTheme();
                const initialThemeClass = getInitialThemeClass();
                const root = document.documentElement;
                if (initialTheme === 'dark' || (initialTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  root.classList.add('dark');
                }
                if (initialThemeClass) {
                  root.classList.add(initialThemeClass);
                }
              })();
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppInitializer />
          {children}
          <Toaster /> {/* Global Toaster can be here */}
        </ThemeProvider>
      </body>
    </html>
  );
}