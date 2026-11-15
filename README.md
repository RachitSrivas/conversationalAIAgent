# Minimy — Conversational Search Agent

> The conversational AI agent equipped with real-time web search, deterministic temporal grounding, and persistent episodic memory across sessions. 

![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)
![AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-v4-emerald.svg)

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Copy .env.example to .env and insert your API key(s)
cp .env.example .env

# 3. (Optional) Re-seed benchmark evaluation datasets
npm run seed

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Testing the Benchmark Questions

This repository comes pre-seeded with the exact conversational history required to test the benchmark evaluation queries:

### Query 1: Cross-Session Recall & Delta Verification
> *"On Monday we shortlisted 5 CRM tools for a 20-person sales team. Has any of them changed pricing or shipped something big since?"*
* **What happens**: The agent resolves "Monday" to the exact calendar date, retrieves the shortlisted tools (*HubSpot, Pipedrive, Close, Zoho, Salesforce*), executes targeted parallel web searches for their latest changelogs and pricing plans, and outputs a cited comparison showing what stayed the same and what changed.

### Query 2: Exact Date Retrieval & Freshness Check
> *"What did I ask you on 3 November? Is your answer still correct today?"*
* **What happens**: The agent filters episodic memory for November 3, identifies the question regarding *Anthropic Claude 3.5 Sonnet & Computer Use API*, executes a live web search to verify the current status, and answers with inline citations.

### Query 3: Weekday Resolution & Pricing Comparison
> *"Last Tuesday I asked you about Postgres hosting. Has any pricing changed since then?"*
* **What happens**: The agent anchors "Last Tuesday" relative to the current calendar, retrieves the Postgres hosting shortlist (*Neon, Supabase, Crunchy Bridge, AWS Aurora*), searches their current pricing documentation, and provides an itemized breakdown.

*(You can also click any of the benchmark test cards in the left sidebar to populate them instantly!)*

---

## 🏛️ Architecture Overview

For an in-depth explanation of design decisions, tradeoffs, and failure modes, read **[DESIGN.md](./DESIGN.md)**.

```
minimy/
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts       # Agent execution engine (streaming, tools, memory integration)
│   │   ├── api/sessions/route.ts   # Session persistence endpoints
│   │   ├── api/seed/route.ts       # Benchmark fixture reset endpoint
│   │   ├── page.tsx                # Main agent workspace & responsive layout
│   │   └── globals.css             # Modern dark typography & Tailwind styling
│   ├── components/
│   │   ├── ChatInterface.tsx       # Real-time streaming conversation container
│   │   ├── MessageItem.tsx         # Markdown rendering & citation badges
│   │   ├── SearchToolCall.tsx      # Collapsible live tool execution inspection
│   │   ├── SourceCard.tsx          # Rich web source preview pills
│   │   └── SessionSidebar.tsx      # Chat history & benchmark quick-launcher
│   └── lib/
│       ├── agent/
│       │   ├── system-prompt.ts    # Temporal grounding & diffing protocol
│       │   └── model-provider.ts   # Multi-LLM provider abstraction
│       ├── memory/
│       │   ├── temporal-resolver.ts# Deterministic calendar mapping
│       │   ├── memory-store.ts     # Persistent atomic episodic store
│       │   └── types.ts            # Type definitions
│       └── search/
│           ├── web-search-tool.ts  # Core single tool definition for AI SDK
│           └── providers/          # Tavily, Brave, and DuckDuckGo fallback
├── scripts/
│   └── seed-fixtures.ts            # CLI database seeder
├── DESIGN.md                       # 1-page architecture rationale document
└── .env.example                    # Environment configuration template
```

---

## 🔑 Environment Variables

Configure in `.env`:

| Variable | Description | Required |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | OpenAI API key (e.g. `gpt-4o`, `gpt-4o-mini`) | **Yes** (or Anthropic/Gemini) |
| `ANTHROPIC_API_KEY` | Anthropic API key (e.g. `claude-3-5-sonnet-latest`) | Optional |
| `GEMINI_API_KEY` | Google Gemini API key (e.g. `gemini-2.0-flash`) | Optional |
| `TAVILY_API_KEY` | Tavily Search API key (Recommended for web search) | Recommended |
| `BRAVE_API_KEY` | Brave Search API key | Optional |
| `SEARCH_PROVIDER` | `tavily` \| `brave` \| `duckduckgo` | Defaults to `tavily` with fallback |
| `SIMULATED_DATE` | Override calendar anchor date (e.g. `2026-11-15`) | Optional |

> **Zero-Key Search Fallback**: If `TAVILY_API_KEY` is not provided, the search tool gracefully falls back to DuckDuckGo, ensuring the app works out of the box with only an LLM key.

---

## 🧪 Verification & Commands

```bash
# Run TypeScript type check
npx tsc --noEmit

# Run production build
npm run build

# Seed or reset benchmark test cases
npm run seed
```

---

