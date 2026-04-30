import { StreamerbotClient } from "@streamerbot/client";
import prisma from "../lib/prisma";
import { getOrCreateUser, addPoints } from "../lib/userCache";
import { broadcastChat } from "../lib/ws";

const client = new StreamerbotClient({
  host: process.env.STREAMERBOT_HOST || "127.0.0.1",
  port: Number(process.env.STREAMERBOT_PORT) || 8080,
});

client.on("YouTube.Message", async (data: any) => {
  if (!data?.data?.user || !data?.data?.broadcast) return;

  const { user, broadcast, message, publishedAt } = data.data;

  const cachedUser = await getOrCreateUser(
    user.id,
    user.name,
    user.profileImageUrl,
    user.isOwner,
    user.isModerator,
  );

  addPoints(user.id);

  broadcastChat({
    type: "chat",
    user: {
      name: cachedUser.name,
      color: cachedUser.tier.color,
      badge: cachedUser.tier.badge,
      points: cachedUser.points,
      profileImageUrl: cachedUser.profileImageUrl,
    },
    content: message,
    publishedAt,
  });

  persistMessage(broadcast, cachedUser.dbId, message, publishedAt).catch(console.error);

  console.log("[chat] " + cachedUser.tier.badge + " | " + user.name + ": " + message);
});

client.on("Obs.SceneChanged", (data: any) => {
  console.log("[obs] scene changed (lowercase):", data?.data?.name || "unknown");
  broadcastChat({ type: "transition", phase: "end" });
});

client.on("OBS.SceneChanged", (data: any) => {
  console.log("[obs] scene changed (uppercase):", data?.data?.name || "unknown");
  broadcastChat({ type: "transition", phase: "end" });
});

async function persistMessage(broadcast: any, userId: number, message: string, publishedAt: string) {
  const stream = await prisma.stream.upsert({
    where: { youtubeVideoId: broadcast.id },
    update: {
      title: broadcast.title,
      status: broadcast.status,
    },
    create: {
      youtubeVideoId: broadcast.id,
      title: broadcast.title,
      description: broadcast.description,
      status: broadcast.status,
      startedAt: new Date(broadcast.actualStartTime),
    },
  });

  await prisma.message.create({
    data: {
      content: message,
      streamId: stream.id,
      userId,
      publishedAt: new Date(publishedAt),
    },
  });
}

export { client };