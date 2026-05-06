# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a streaming automation pipeline with a backend API and React frontend for real-time chat and donation overlays. The system connects to Streamer.bot for live stream events and provides an overlay interface for streaming platforms.

## Tech Stack

- **Backend**: Hono (Node.js) with TypeScript, running on Bun
- **Database**: SQLite with Prisma ORM
- **Frontend**: React 19 with TypeScript, Vite
- **WebSockets**: Real-time chat functionality
- **Integrations**: Streamer.bot, ElevenLabs (TTS), OpenAI

## Common Commands

### Backend Development
```bash
# Start development server
bun run dev

# Build and start
bun run start

# Database operations
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema changes
bun run db:studio    # Open Prisma Studio
```

### Frontend Development
```bash
cd web
bun run dev          # Start dev server
bun run build        # Build for production
bun run lint         # Run ESLint
bun run preview      # Preview production build
```

## Architecture

### Backend Structure
- `src/routes/`: HTTP API endpoints (streams, users, streamerbot, saweria)
- `src/services/`: Business logic and external service integrations
- `src/lib/`: Shared utilities (WebSocket management, Prisma client)
- `prisma/`: Database schema and migrations

### Frontend Structure
- `web/src/pages/`: Main page components (Dashboard, Overlay)
- `web/src/components/`: Reusable UI components (chat, donations, alerts)
- `web/src/lib/`: Frontend utilities and type definitions

## Key Components

### Backend Services
- **Streamerbot Integration**: WebSocket connection for stream events
- **Donation Handling**: Saweria webhook processing for donations
- **Chat System**: Real-time WebSocket chat server
- **TTS Integration**: ElevenLabs for text-to-speech

### Frontend Features
- **Overlay Interface**: Full-screen overlay for stream content
- **Chat System**: Real-time message display with animations
- **Donation Alerts**: Visual notifications for donations
- **AI Dialogue Box**: AI-generated responses and interactions

## Development Notes

1. **Database**: Always use the existing Prisma client from `src/lib/prisma.ts`
2. **WebSocket**: Use `registerClient` and `removeClient` for connection management
3. **API Routes**: Keep handlers thin; move heavy logic to services
4. **Frontend**: Components use CSS modules for styling
5. **Environment**: API runs on port 3000 by default

## External Integrations

- **Streamer.bot**: Connected via WebSocket for live stream events
- **Saweria**: Donation webhook endpoint for Indonesian donations
- **OpenAI**: For AI dialogue generation
- **ElevenLabs**: For text-to-speech synthesis