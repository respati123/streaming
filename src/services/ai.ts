import prisma from "../lib/prisma";

export async function generateAiReply(
  youtubeId: string,
  donatorName: string,
  donationMessage: string
): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[ai] Missing OPENROUTER_API_KEY");
    return null;
  }

  try {
    // Fetch last 20 messages for context
    const recentMessages = await prisma.message.findMany({
      take: 20,
      orderBy: { publishedAt: "desc" },
      include: { user: true },
    });

    // We get them in descending order, so reverse to chronological
    recentMessages.reverse();

    const systemPrompt = `Kamu adalah persona AI interaktif di live streaming milik Respati.
Tugas kamu adalah menjawab atau memberikan tanggapan terhadap donasi/pesan dari penonton.
Aturan:
1. Jawab dengan gaya bahasa asyik, singkat (maksimal 2 kalimat pendek), dan natural.
2. Di akhir jawaban, kamu HARUS memberikan satu pertanyaan lanjutan (follow-up question) terkait pesan user atau topik obrolan sebelumnya untuk memancing interaksi.
3. Jangan pakai emoji, jawaban ini akan dibacakan oleh Text-to-Speech.
4. Jawab dalam bahasa Indonesia.
5. SANGAT PENTING: Panjang keseluruhan jawabanmu MAKSIMAL 140 KARAKTER! Buat sesingkat mungkin.`;

    const messagesPayload: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of recentMessages) {
      messagesPayload.push({
        role: "user",
        content: `[User: ${msg.user.name}]: ${msg.content}`,
      });
    }

    // Add the current donation message
    messagesPayload.push({
      role: "user",
      content: `[Donasi dari ${donatorName}]: ${donationMessage}\n\nBerikan tanggapan untuk donasi di atas beserta pertanyaan balasan!`,
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messagesPayload,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai] OpenRouter API error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("[ai] Failed to generate AI reply:", error);
    return null;
  }
}
