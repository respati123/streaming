import type { WSContext } from "hono/ws";
import type { WebSocket } from "ws";

const clients = new Set<WSContext>();

export function registerClient(ws: WSContext) {
  clients.add(ws);
}

export function removeClient(ws: WSContext) {
  clients.delete(ws);
}

export function broadcastChat(data: Record<string, unknown>) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}