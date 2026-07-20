"use client";

import { useEffect } from "react";

export function NgrokBypass() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        let [resource, config] = args;
        
        // Ensure config exists
        config = config || {};
        
        // Ensure headers exist
        const headers = new Headers(config.headers || {});
        
        // Add the magic ngrok header to bypass the warning screen
        headers.set("ngrok-skip-browser-warning", "true");
        
        config.headers = headers;
        
        return originalFetch(resource, config);
      };
    }
  }, []);

  return null;
}
