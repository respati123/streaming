import { Hono } from "hono";
import prisma from "../lib/prisma";
import { donationQueue } from "../services/donationQueue";
import { generateAiReply } from "../services/ai";

export const saweriaRoute = new Hono();

interface SaweriaPayload {
  version: string;
  created_at: string;
  id: string;
  type: string;
  amount_raw: number;
  cut: number;
  donator_name: string;
  donator_email: string;
  donator_is_user: boolean;
  message: string;
  etc: {
    amount_to_display: number;
  };
}

// POST /api/saweria/webhook — Saweria donation webhook
saweriaRoute.post("/webhook", async (c) => {
  const payload: SaweriaPayload = await c.req.json();

  const displayAmount = payload.etc?.amount_to_display || payload.amount_raw;

  let cleanMessage = payload.message || "";
  let extractedYoutubeId: string | null = null;

  const match = cleanMessage.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (match) {
    extractedYoutubeId = match[1];
    cleanMessage = match[2];
  }

  console.log(`[saweria] donation from ${payload.donator_name}: Rp${displayAmount} — ${cleanMessage}`);

  // Point system logic if youtubeId exists
  if (extractedYoutubeId) {
    const pointsToAdd = Math.floor(displayAmount / 10);
    await prisma.user.upsert({
      where: { youtubeId: extractedYoutubeId },
      update: {
        points: { increment: pointsToAdd },
        lastSeen: new Date(),
      },
      create: {
        youtubeId: extractedYoutubeId,
        name: payload.donator_name,
        points: pointsToAdd,
        lastSeen: new Date(),
      },
    });
    console.log(`[saweria] added ${pointsToAdd} points to user ${extractedYoutubeId}`);
  }

  // Persist to DB (deduplicate by saweria ID)
  const donation = await prisma.donation.upsert({
    where: { saweriaId: payload.id },
    update: {},
    create: {
      saweriaId: payload.id,
      donatorName: payload.donator_name,
      donatorEmail: payload.donator_email,
      amountRaw: displayAmount,
      message: cleanMessage,
      type: payload.type,
    },
  });

  // Push to backend queue (will handle TTS, broadcasting, and pacing)
  donationQueue.push({
    id: donation.id,
    donatorName: payload.donator_name,
    amount: displayAmount,
    message: cleanMessage,
    createdAt: new Date().toISOString()
  });

  // Trigger AI Reply if >= 10,000 and has YouTube ID context (or just >= 10000)
  if (displayAmount >= 10000 && cleanMessage.trim().length > 0) {
    // Non-blocking async IIFE
    (async () => {
      console.log(`[saweria] triggering AI reply for donation ${donation.id}...`);
      const aiResponse = await generateAiReply(
        extractedYoutubeId || "unknown", 
        payload.donator_name, 
        cleanMessage
      );

      if (aiResponse) {
        // Push the AI response into the donation queue as a special AI message
        donationQueue.push({
          id: donation.id + 1000000, // pseudo ID for AI reply
          donatorName: "AI Respati", // The AI's name
          amount: 0, // 0 amount indicates it's an AI reply
          message: aiResponse,
          userMessage: cleanMessage, // the original user's message
          originalDonatorName: payload.donator_name,
          createdAt: new Date().toISOString(),
          isAiReply: true, // we need to add this to the type
        });
      }
    })();
  }

  return c.json({ ok: true });
});

// GET /api/saweria/test-ai — Test endpoint for AI conversation
saweriaRoute.get("/test-ai", async (c) => {
  const name = c.req.query("name") || "Test User";
  const message = c.req.query("message") || "Halo Respati, lagi bikin project apa nih?";
  const skipTts = c.req.query("skipTts") === "true";
  
  console.log(`[test-ai] triggering test for ${name}: ${message} (skipTts: ${skipTts})`);
  
  const aiResponse = await generateAiReply(
    "testyoutubeid123", 
    name, 
    message
  );

  if (aiResponse) {
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
    return c.json({ ok: true, trigger: message, aiResponse, skipTts });
  }

  return c.json({ ok: false, error: "Failed to generate AI response" }, 500);
});

// GET /api/saweria/donations — List all donations
saweriaRoute.get("/donations", async (c) => {
  const donations = await prisma.donation.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const total = await prisma.donation.aggregate({
    _sum: { amountRaw: true },
  });
  return c.json({
    donations,
    totalAmount: total._sum.amountRaw || 0,
    count: donations.length,
  });
});

// GET /api/saweria/donations/top — Top donators
saweriaRoute.get("/donations/top", async (c) => {
  const top = await prisma.donation.groupBy({
    by: ["donatorName"],
    _sum: { amountRaw: true },
    _count: { id: true },
    orderBy: { _sum: { amountRaw: "desc" } },
    take: 10,
  });
  return c.json({
    top: top.map((t) => ({
      name: t.donatorName,
      totalAmount: t._sum.amountRaw || 0,
      donationCount: t._count,
    })),
  });
});
