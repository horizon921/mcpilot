"use client";

import * as React from "react";
import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { useSettingsStore } from "@/store/settingsStore";

export default function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const themeColor = useSettingsStore(state => state.appSettings.themeColor || "default");

  // 只切换主题色 class，不手动切换 .dark，交由 next-themes 控制
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("theme-default", "theme-green", "theme-orange", "theme-purple");
      root.classList.add(`theme-${themeColor}`);
    }
  }, [themeColor]);


  // 必须传递 attribute="class" 让 next-themes 控制 .dark class
  return (
    <NextThemesProvider attribute="class" {...props}>
      {children}
    </NextThemesProvider>
  );
}