import { env } from "cloudflare:workers";
export function getDb(): D1Database { if (!env.DB) throw new Error("Results storage unavailable"); return env.DB; }
