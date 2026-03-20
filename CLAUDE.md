# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**UIGen** is an AI-powered React component generator with live preview. Users describe components in a chat interface, and Claude generates React/JSX files in a virtual file system (no disk I/O), rendered in an iframe preview.

## Commands

```bash
npm run setup        # One-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all Vitest tests
npm run db:reset     # Reset SQLite database (destructive)
```

To run a single test file:
```bash
npx vitest run src/lib/__tests__/file-system.test.ts
```

## Environment Variables

`.env` at root:
- `ANTHROPIC_API_KEY` — Optional. If absent, a mock provider generates static components instead.
- `JWT_SECRET` — Session signing key (defaults to a dev value if unset).

## Architecture

### Core Data Flow

1. User types in `ChatInterface` → POST to `/api/chat/route.ts`
2. API route creates a `VirtualFileSystem` instance from the request payload, then calls `streamText()` with the Claude model and two tools: `str_replace_editor` and `file_manager`
3. The AI uses these tools to create/modify files in the virtual FS
4. Streamed file updates flow back to the client via the `FileSystemContext`, triggering live preview re-render in `PreviewFrame` (iframe with Babel standalone for JIT JSX compilation)
5. On stream completion, the project (messages + serialized FS) is saved to SQLite via Prisma

### Key Abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`) — In-memory tree of files/directories. Serializes to/from JSON for persistence and transport. All AI file operations go through this.
- **AI Tools** (`src/lib/tools/`) — `str_replace_editor` handles create/modify via string replacement; `file_manager` handles create-dir and delete operations.
- **Provider** (`src/lib/provider.ts`) — Returns the Claude Haiku 4.5 model or a mock provider if no API key is configured.
- **System Prompt** (`src/lib/prompts/generation.tsx`) — Instructs Claude to always produce `/App.jsx` as the entry point, style with Tailwind CSS, and use the `@/` import alias.

### UI Layout (`src/app/main-content.tsx`)

Three-panel resizable layout:
- **Left (35%)**: Chat interface
- **Right (65%)**: Tabs for live preview (`PreviewFrame`) or code view (file tree + Monaco editor)

Context providers wrapping the layout: `ChatProvider`, `FileSystemProvider`.

### Auth

Server actions in `src/actions/index.ts` (`signUp`, `signIn`, `signOut`, `getUser`). Sessions use JWT stored in `httpOnly` cookies (7-day expiry). Anonymous users can generate components without signing in; their work is tracked in localStorage but not persisted to the DB.

### Database

SQLite via Prisma. Two models: `User` and `Project`. `Project.messages` and `Project.data` are JSON strings. Projects have an optional `userId` to support anonymous creation. Refer to `prisma/schema.prisma` for the authoritative data structure.

## Code Style

Use comments sparingly. Only comment complex code.

## Testing

Tests live in `src/**/__tests__/`. Uses Vitest with jsdom environment and React Testing Library. Test coverage includes: file system operations, JSX transformer, chat context, file tree component.
