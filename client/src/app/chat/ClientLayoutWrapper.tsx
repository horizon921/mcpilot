"use client";

import React, { useEffect } from "react"; // Added useEffect
import ChatSidebar from "@/components/Chat/ChatSidebar";
import { useUIStore } from "@/store/uiStore";
import { useSettingsStore } from "@/store/settingsStore"; // Added settingsStore
import { useTheme } from "next-themes"; // Added next-themes
import { Menu } from "lucide-react"; // For a toggle button
import { Button } from "@/components/Common/Button";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

const ClientLayoutWrapper: React.FC<ClientLayoutWrapperProps> = ({ children }) => {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const themeColor = useSettingsStore(state => state.appSettings.themeColor || "default");
  const { setTheme: setNextThemesTheme, theme: currentNextTheme } = useTheme();
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // Effect to apply themeColor class to documentElement and ensure next-themes re-applies theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      // Remove all existing theme- classes
      root.classList.remove("theme-default", "theme-green", "theme-orange", "theme-purple");
      // Add the current themeColor class
      root.classList.add(`theme-${themeColor}`);

      // Force next-themes to re-evaluate and apply the current theme
      // This is crucial to ensure next-themes re-renders and applies its internal logic
      // even if the dark/light mode itself hasn't changed, but the themeColor has.
      setNextThemesTheme(currentNextTheme || "system");

      // Force browser reflow to ensure immediate CSS application
      root.offsetHeight;
    }
  }, [themeColor, setNextThemesTheme, currentNextTheme]);

  // Optional: Close sidebar on small screens by default and when navigating
  React.useEffect(() => {
    if (!hasMounted) return; // Only run resize logic after mount

    const handleResize = () => {
      if (window.innerWidth < 768) { // Tailwind's 'md' breakpoint
        setSidebarOpen(false);
      } else {
        // On larger screens, you might want to restore a default or user preference
        // For now, let's keep it simple and set to true, or respect existing state if preferred.
        // Let's assume we want it open on larger screens if it was closed by resize.
         if (!isSidebarOpen && window.innerWidth >= 768) {
           setSidebarOpen(true);
         } else if (isSidebarOpen && window.innerWidth < 768) {
           setSidebarOpen(false);
         }
         // A more robust solution might involve storing user's explicit toggle preference.
      }
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen, hasMounted, isSidebarOpen]);

  if (!hasMounted) {
    // Render nothing or a placeholder that matches server output for the sidebar area
    // To ensure server and client initial render match for the overall structure.
    // The div structure should be consistent.
    return (
      <div className="flex h-screen w-screen overflow-hidden">
        {/* Placeholder for sidebar area or render it скрытым if that matches server logic better */}
        {/* <div className="w-64 md:w-72 shrink-0"></div> */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="p-2 border-b border-accent md:hidden sticky top-0 bg-background/80 backdrop-blur-md z-10">
            {/* Menu button might also need to be conditional on hasMounted if it depends on client state */}
          </header>
          <main className="flex-grow overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {isSidebarOpen && <ChatSidebar />}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Optional: Header bar with a sidebar toggle for mobile */}
        <header className="p-2 border-b border-accent md:hidden sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu size={24} />
          </Button>
        </header>
        <main className="flex-grow overflow-y-auto"> {/* Main content scrolls */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default ClientLayoutWrapper;