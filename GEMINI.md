# Gemini System Prompt & Project Context

## Project Overview
This is a streaming-focused content automation pipeline and backend service. It acts as the backbone for an end-to-end AI video content generation and live stream management system.

## Tech Stack
- **Runtime:** Bun
- **Language:** TypeScript
- **Framework:** Hono (using `@hono/node-server` and `@hono/node-ws` for WebSocket support)
- **Database / ORM:** Prisma
- **Integrations:** `@streamerbot/client` for connecting to Streamer.bot (likely for Twitch/YouTube live event handling).

## Directory Structure
- `src/`
  - `routes/` - Hono route definitions (e.g., `streams.ts`, `users.ts`, `streamerbot.ts`).
  - `services/` - Core business logic and external integrations (e.g., `streamerbot.ts`).
  - `lib/` - Shared utilities and singletons (e.g., Prisma client setup).
- `prisma/` - Prisma schema definitions and migrations.
- `skills/` - Custom agent skills (e.g., `writing_skill.md`) for defining workflows like AI scriptwriting.
- `web/` - Likely contains the frontend application (if applicable).

## Core Workflows & Goals
1. **Automated Content Pipeline:** Generating scripts, mapping scenes, and integrating with Indonesian TTS systems (Omnivoice).
2. **Streaming Integration:** Managing messages, users, and stream metadata via Prisma, while communicating with Streamer.bot over WebSockets.

## Rules for AI Interaction
- **Language:** Write code in strict TypeScript. Prefer descriptive variable names over comments.
- **Database:** Always use the existing Prisma client instance from `src/lib/prisma.ts`.
- **API:** Use Hono best practices. Keep route handlers thin; move heavy logic to `src/services/`.
- **Skills:** Refer to the `.agent/skills/` directory when the user requests a specific workflow (like `grill-me`, `to-issues`, etc.).
- **Code Style:** Use modern ES modules syntax, `async/await`, and handle errors gracefully.

## Next Steps / Current Focus
- Developing a robust **Scriptwriter Skill** to automate the generation of highly engaging, TTS-friendly short-form scripts with scene markers.
- Solidifying the WebSocket and Streamer.bot event handling.
