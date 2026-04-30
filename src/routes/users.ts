import { Hono } from "hono";
import prisma from "../lib/prisma";

export const usersRoute = new Hono();

usersRoute.get("/", async (c) => {
  const users = await prisma.user.findMany({
    orderBy: { lastSeen: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return c.json({ users, total: users.length });
});

usersRoute.get("/:youtubeId", async (c) => {
  const user = await prisma.user.findUnique({
    where: { youtubeId: c.req.param("youtubeId") },
    include: { _count: { select: { messages: true } } },
  });
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ user });
});