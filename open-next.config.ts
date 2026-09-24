import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override: this game has no ISR/data cache, so we don't
// wire up R2/KV (which would also need extra token permissions).
export default defineCloudflareConfig();
