import { broadcastChat } from "../lib/ws";
import { generateDonationTts, generateDialogueTts, generateSimpleTts } from "./elevenlabs";

interface QueuedDonation {
  id: number;
  donatorName: string;
  amount: number;
  message: string;
  createdAt: string;
  isAiReply?: boolean;
  userMessage?: string;
  originalDonatorName?: string;
  skipTts?: boolean;
}

class DonationQueue {
  private queue: QueuedDonation[] = [];
  private isProcessing: boolean = false;

  public push(donation: QueuedDonation) {
    this.queue.push(donation);
    this.processNext();
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const donation = this.queue.shift()!;

    try {
      // 1. Generate TTS
      let tts;
      if (!donation.skipTts) {
        if (donation.isAiReply) {
          // Revert: Use simple single-speaker TTS for AI responses
          tts = await generateSimpleTts(donation.message);
        } else {
          tts = await generateDonationTts(
            donation.donatorName,
            donation.amount,
            donation.message
          );
        }
      }

      // 2. Broadcast to frontend
      broadcastChat({
        type: "donation",
        id: donation.id,
        donatorName: donation.donatorName,
        amount: donation.amount,
        message: donation.message,
        createdAt: donation.createdAt,
        audioBase64: tts?.audioBase64 ?? null,
        audioDurationMs: tts?.durationMs ?? null,
        isAiReply: donation.isAiReply,
        userMessage: donation.userMessage,
        originalDonatorName: donation.originalDonatorName,
      });

      // 3. Calculate delay (Audio duration + 3 seconds buffer)
      const bufferMs = 3000;
      let delayMs = 4000; // Base delay if no TTS
      if (tts?.durationMs) {
        delayMs = tts.durationMs + bufferMs;
      } else {
        // Fallback calculation for duration if TTS fails
        delayMs = 4000 + donation.message.length * 40 + bufferMs;
        delayMs = Math.min(delayMs, 10000 + bufferMs); // Max 10s + 3s buffer
      }

      // Wait before processing next
      await new Promise((resolve) => setTimeout(resolve, delayMs));

    } catch (error) {
      console.error("[donationQueue] Error processing donation:", error);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}

export const donationQueue = new DonationQueue();
