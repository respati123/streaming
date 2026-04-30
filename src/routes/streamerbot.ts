import { Hono } from "hono";
import { client } from "../services/streamerbot";

export const streamerbotRoute = new Hono();

streamerbotRoute.get("/status", (c) => {
  return c.json({ connected: client.connected });
});

streamerbotRoute.get("/actions", async (c) => {
  try {
    const { actions } = await client.getActions();
    return c.json({ actions: actions || [] });
  } catch {
    return c.json({ error: "Failed to get actions", actions: [] }, 500);
  }
});

import { broadcastChat } from "../lib/ws";

streamerbotRoute.post("/actions/:id/execute", async (c) => {
  try {
    const id = c.req.param("id");
    const result = await client.doAction(id);
    
    // Check if this action should trigger a frontend transition
    try {
      const { actions } = await client.getActions();
      const action = actions.find(a => a.id === id);
      if (action && action.name.toLowerCase().includes("transition")) {
        broadcastChat({ type: "transition", phase: "start" });
      }
    } catch (e) {
      console.error("Failed to check action name for transition", e);
    }

    return c.json({ result });
  } catch {
    return c.json({ error: "Failed to execute action" }, 500);
  }
});
