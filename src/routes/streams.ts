import { Hono } from "hono";
import prisma from "../lib/prisma";
import { getTier } from "../lib/points";

export const streamsRoute = new Hono();

streamsRoute.get("/", async (c) => {
  const streams = await prisma.stream.findMany({
    orderBy: { startedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return c.json({ streams, total: streams.length });
});

streamsRoute.get("/current", async (c) => {
  const stream = await prisma.stream.findFirst({
    where: { status: "live" },
    orderBy: { startedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  if (!stream) return c.json({ error: "No active stream" }, 404);
  return c.json({ stream });
});

streamsRoute.get("/:id", async (c) => {
  const stream = await prisma.stream.findUnique({
    where: { id: Number(c.req.param("id")) },
    include: { _count: { select: { messages: true } } },
  });
  if (!stream) return c.json({ error: "Stream not found" }, 404);
  return c.json({ stream });
});

streamsRoute.get("/:id/messages", async (c) => {
  const id = Number(c.req.param("id"));
  const page = Number(c.req.query("page") || 1);
  const limit = Number(c.req.query("limit") || 50);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { streamId: id },
      include: { user: { select: { youtubeId: true, name: true, profileImageUrl: true } } },
      orderBy: { publishedAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { streamId: id } }),
  ]);

  return c.json({ messages, total, page, limit });
});

streamsRoute.get("/history/recent", async (c) => {
  const limit = Number(c.req.query("limit") || 50);

  const messages = await prisma.message.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      user: true,
      stream: true
    }
  });

  // Sort back to ascending for display
  const sortedMessages = messages.reverse();

  const formatted = sortedMessages.map(msg => {
    const tier = getTier(msg.user.points);
    return {
      type: "chat",
      user: {
        name: msg.user.name,
        color: tier.color,
        badge: tier.badge,
        points: msg.user.points,
        profileImageUrl: msg.user.profileImageUrl,
      },
      content: msg.content,
      publishedAt: msg.publishedAt.toISOString(),
    };
  });

  return c.json({ messages: formatted });
});