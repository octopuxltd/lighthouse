import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { World } from "@/lib/rooms";

// Read the rooms from D1 on every request (no caching).
export const dynamic = "force-dynamic";

interface RoomRow {
  x: number;
  y: number;
  name: string;
  description: string;
}

// Minimal shape of the D1 binding we use, typed locally so we don't depend on
// generated types (which reference the not-yet-built worker bundle).
interface Env {
  DB: {
    prepare(query: string): {
      all<T>(): Promise<{ results: T[] }>;
    };
  };
}

export async function GET() {
  const { env } = getCloudflareContext() as unknown as { env: Env };
  const { results } = await env.DB.prepare(
    "SELECT x, y, name, description FROM rooms",
  ).all<RoomRow>();

  // Key by "x,y"; exits are worked out from adjacency in the client/engine.
  const world: World = {};
  for (const row of results) {
    world[`${row.x},${row.y}`] = {
      name: row.name,
      description: row.description,
    };
  }

  return Response.json({ rooms: world });
}
