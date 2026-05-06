import { Hono } from "hono";
import prisma from "../lib/prisma";
import { broadcastChat } from "../lib/ws";
import { donationQueue } from "../services/donationQueue";
import { generateAiReply } from "../services/ai";
import { getTier } from "../lib/points";

export const testRoute = new Hono();

// POST /api/test/chat — Send a chat message via WebSocket
testRoute.post("/chat", async (c) => {
  const body = await c.req.json();
  const { userId, name, message, profileImageUrl, isOwner, isModerator } = body;

  if (!message) return c.json({ ok: false, error: "field 'message' wajib" }, 400);

  const displayName = name || "Anon";

  // Upsert user
  const fakeUserId = userId || `test-${Date.now()}`;
  const user = await prisma.user.upsert({
    where: { youtubeId: fakeUserId },
    update: { name: displayName, lastSeen: new Date() },
    create: { youtubeId: fakeUserId, name: displayName, lastSeen: new Date() },
  });

  // Find or create active stream
  let stream = await prisma.stream.findFirst({ where: { status: "live" } });
  if (!stream) {
    stream = await prisma.stream.create({
      data: { youtubeVideoId: `test-${Date.now()}`, title: "Test Stream", status: "live", startedAt: new Date() },
    });
  }

  // Save message
  const savedMessage = await prisma.message.create({
    data: { content: message, userId: user.id, streamId: stream.id, publishedAt: new Date() },
  });

  // Determine tier
  const tier = getTier(user.points);

  // Broadcast via WebSocket
  broadcastChat({
    type: "chat",
    user: {
      name: user.name,
      color: tier.color,
      badge: isModerator ? "shield_gold" : isOwner ? "shield_futuristic" : tier.badge,
      points: user.points,
      profileImageUrl: profileImageUrl || null,
    },
    content: message,
    publishedAt: savedMessage.publishedAt.toISOString(),
  });

  return c.json({ ok: true, user: user.name, tier: tier.name });
});

// POST /api/test/chat/burst — Send multiple chat messages with delay
testRoute.post("/chat/burst", async (c) => {
  const body = await c.req.json();
  const { delay = 300, messages } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return c.json({ ok: false, error: "field 'messages' harus array non-empty" }, 400);
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (i > 0) await new Promise((r) => setTimeout(r, delay));

    const displayName = msg.name || "Anon";
    const fakeUserId = msg.userId || `test-${Date.now()}-${i}`;

    const user = await prisma.user.upsert({
      where: { youtubeId: fakeUserId },
      update: { name: displayName, lastSeen: new Date() },
      create: { youtubeId: fakeUserId, name: displayName, lastSeen: new Date() },
    });

    let stream = await prisma.stream.findFirst({ where: { status: "live" } });
    if (!stream) {
      stream = await prisma.stream.create({
        data: { youtubeVideoId: `test-${Date.now()}`, title: "Test Stream", status: "live", startedAt: new Date() },
      });
    }

    const savedMessage = await prisma.message.create({
      data: { content: msg.message, userId: user.id, streamId: stream.id, publishedAt: new Date() },
    });

    const tier = getTier(user.points);
    broadcastChat({
      type: "chat",
      user: {
        name: user.name,
        color: tier.color,
        badge: msg.isModerator ? "shield_gold" : msg.isOwner ? "shield_futuristic" : tier.badge,
        points: user.points,
        profileImageUrl: msg.profileImageUrl || null,
      },
      content: msg.message,
      publishedAt: savedMessage.publishedAt.toISOString(),
    });
  }

  return c.json({
    ok: true,
    sent: messages.length,
    messages: messages.map((m: any) => `${m.name || "Anon"}: ${m.message}`),
  });
});

// POST /api/test/donation — Trigger donation alert via WebSocket
testRoute.post("/donation", async (c) => {
  const body = await c.req.json();
  const { donatorName = "TestDonator", amount = 10000, message = "", skipTts = false } = body;

  const donation = await prisma.donation.create({
    data: {
      saweriaId: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      donatorName,
      amountRaw: amount,
      message,
      type: "donation",
    },
  });

  donationQueue.push({
    id: donation.id,
    donatorName,
    amount,
    message,
    createdAt: donation.createdAt.toISOString(),
    skipTts,
  });

  return c.json({ ok: true, donation: { id: donation.id, donatorName, amountRaw: amount, message, saweriaId: donation.saweriaId, type: "donation", createdAt: donation.createdAt } });
});

// POST /api/test/ai-dialogue — Trigger AI dialogue box via WebSocket
testRoute.post("/ai-dialogue", async (c) => {
  const body = await c.req.json();
  const { name = "Test User", message = "Halo Respati!", skipTts = false } = body;

  const aiResponse = await generateAiReply("test-user", name, message);
  if (!aiResponse) {
    return c.json({ ok: false, error: "Gagal generate AI response" }, 500);
  }

  donationQueue.push({
    id: Date.now(),
    donatorName: "AI Respati",
    amount: 0,
    message: aiResponse,
    userMessage: message,
    originalDonatorName: name,
    createdAt: new Date().toISOString(),
    isAiReply: true,
    skipTts,
  });

  return c.json({ ok: true, userMessage: message, aiResponse });
});

// POST /api/test/transition — Trigger transition overlay
testRoute.post("/transition", async (c) => {
  const body = await c.req.json();
  const { phase } = body;

  if (phase !== "start" && phase !== "end") {
    return c.json({ ok: false, error: "phase harus 'start' atau 'end'" }, 400);
  }

  broadcastChat({ type: "transition", phase });
  return c.json({ ok: true, phase });
});

// POST /api/test/lightning — Trigger lightning flash overlay
testRoute.post("/lightning", async (c) => {
  const body = await c.req.json();
  const { amount = 100000, donatorName = "TestDonator", message = "Mega donation!" } = body;

  const donation = await prisma.donation.create({
    data: {
      saweriaId: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      donatorName,
      amountRaw: amount,
      message,
      type: "donation",
    },
  });

  donationQueue.push({
    id: donation.id,
    donatorName,
    amount,
    message,
    createdAt: donation.createdAt.toISOString(),
    skipTts: true,
  });

  return c.json({ ok: true, note: "Lightning triggers on amount >= 50,000", amount });
});

// POST /api/test/tiers — Send one message from each tier user to preview badges
testRoute.post("/tiers", async (c) => {
  const tierUsers = [
    { youtubeId: "test-pokeball",     name: "NovicePlayer",  points: 0,     tier: "Pokeball (0 pts)" },
    { youtubeId: "test-shield-blue",  name: "BlueKnight",    points: 500,   tier: "Shield Blue (500 pts)" },
    { youtubeId: "test-shield-gold",  name: "GoldGuardian",  points: 2000,  tier: "Shield Gold (2000 pts)" },
    { youtubeId: "test-viper",        name: "ViperStrike",   points: 5000,  tier: "Viper (5000 pts)" },
    { youtubeId: "test-futuristic",   name: "FuturistX",     points: 10000, tier: "Shield Futuristic (10k pts)" },
  ];

  let stream = await prisma.stream.findFirst({ where: { status: "live" } });
  if (!stream) {
    stream = await prisma.stream.create({
      data: { youtubeVideoId: `test-${Date.now()}`, title: "Test Stream", status: "live", startedAt: new Date() },
    });
  }

  const results = [];

  for (const tu of tierUsers) {
    const user = await prisma.user.upsert({
      where: { youtubeId: tu.youtubeId },
      update: { name: tu.name, points: tu.points, lastSeen: new Date() },
      create: { youtubeId: tu.youtubeId, name: tu.name, points: tu.points, lastSeen: new Date() },
    });

    await prisma.message.create({
      data: { content: `Hello! I'm tier ${tu.tier}`, userId: user.id, streamId: stream.id, publishedAt: new Date() },
    });

    const tier = getTier(user.points);
    broadcastChat({
      type: "chat",
      user: {
        name: user.name,
        color: tier.color,
        badge: tier.badge,
        points: user.points,
        profileImageUrl: null,
      },
      content: `Hello! I'm tier ${tu.tier}`,
      publishedAt: new Date().toISOString(),
    });

    results.push({ name: user.name, points: user.points, badge: tier.badge, color: tier.color });
    await new Promise((r) => setTimeout(r, 400));
  }

  return c.json({ ok: true, sent: results });
});

// POST /api/test/reset — Clear all test data
testRoute.post("/reset", async (c) => {
  await prisma.donation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.user.deleteMany();
  return c.json({ ok: true, message: "All test data cleared" });
});
