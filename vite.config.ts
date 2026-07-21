import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: {
    // Avoid duplicate React/TanStack instances being pulled in by nested
    // dependencies, which shows up as "Invalid hook call" or context-mismatch
    // errors at runtime.
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/react-router"],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error wrapper). nitro/vite builds from this.
      server: { entry: "server" },
    }),
    viteReact(),
    // Cloudflare Workers is the deploy target (see src/server.ts's
    // (request, env, ctx) fetch signature). Switch the preset if you deploy
    // elsewhere — see https://nitro.build/deploy for the full list.
    nitro({
      preset: "cloudflare-module",
    }),
  ],
});
