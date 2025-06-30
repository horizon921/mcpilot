"use client";

import React, { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * This component handles client-side initialization logic for the application.
 * It should be placed in the root layout to run on app startup.
 */
export default function AppInitializer() {
  const refreshMCPServerStatuses = useSettingsStore(state => state.refreshMCPServerStatuses);
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    // Mark that the component has hydrated
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Only run the effect after the store has been hydrated from localStorage
    if (hydrated) {
      console.log("App Initializer: Refreshing MCP server statuses...");
      refreshMCPServerStatuses().catch(error => {
        console.error("Failed to refresh MCP server statuses on initial load:", error);
      });
    }
  }, [hydrated, refreshMCPServerStatuses]);

  // This component does not render anything
  return null;
}