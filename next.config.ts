import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't auto-generate AGENTS.md / CLAUDE.md; this project's agent rules live
  // in the global ~/.claude config, not a Next-scaffolded file in the repo.
  agentRules: false,
  // Local preview is opened on 127.0.0.1; allow its dev/HMR requests.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;

// Lets `next dev` integrate with the OpenNext Cloudflare adapter (and access
// local versions of any Cloudflare bindings during development).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
