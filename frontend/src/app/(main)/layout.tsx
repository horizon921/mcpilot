import type { Metadata } from "next";
// Inter font and globals.css are now handled by the root layout (app/layout.tsx)
// ThemeProvider is also handled by the root layout
// Toaster is also handled by the root layout
import ClientLayoutWrapper from "./ClientLayoutWrapper"; // To handle client-side store logic for this specific layout (e.g., sidebar)

// Metadata can still be defined here and will be merged with root metadata
export const metadata: Metadata = {
  title: "MCPilot - 主界面", // More specific title for this section
  description: "MCPilot AI 聊天与助手。",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout now assumes <html>, <body>, and ThemeProvider are provided by a higher-level layout (app/layout.tsx)
  // It only needs to return the specific structure for the (main) route group.
  return (
    <ClientLayoutWrapper>
      {children}
    </ClientLayoutWrapper>
  );
}