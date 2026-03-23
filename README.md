<p align="center">
  <img src="public/icon.svg" width="80" height="80" alt="Free AI PDF Generator icon">
</p>

<h1 align="center">Free AI PDF Generator</h1>

<p align="center">Create any PDF with AI — invoices, resumes, certificates, reports, letters, and more.<br>Uses your own API keys so there are no server costs, no limits, and no account needed.</p>

**Live:** [rnrh.app](https://rnrh.app)

## How It Works

1. **Connect your [Byoky](https://byoky.com) wallet** — your API keys stay encrypted on your device
2. **Describe the PDF** you want in plain language (or pick a template)
3. **AI generates a professional HTML document** in real-time with streaming
4. **Preview and download** as PDF using your browser's built-in Save as PDF

Everything runs in the browser. AI calls go through your own keys via the [Byoky SDK](https://github.com/MichaelLod/byoky) — zero server costs.

## Features

- **15+ AI providers** — Claude, GPT-4o, Gemini, Grok, DeepSeek, Mistral, Groq, and more
- **Image support** — upload, paste, or drag-and-drop images; vision-capable models see the content
- **Streaming** — watch the document build in real-time
- **Iterative refinement** — ask the AI to modify, add sections, change styling
- **Perfect quality** — uses browser's native PDF renderer (not rasterized screenshots)
- **Privacy-first** — API keys never leave your device; no analytics, no tracking
- **Mobile friendly** — responsive layout with tab navigation on small screens

## Supported Providers

| Provider | Vision | Provider | Vision |
|----------|:------:|----------|:------:|
| Anthropic (Claude) | Yes | Groq | — |
| OpenAI (GPT-4o) | Yes | Together AI | — |
| Google Gemini | Yes | Fireworks | — |
| xAI (Grok) | Yes | OpenRouter | Yes |
| DeepSeek | — | Perplexity | — |
| Mistral | — | | |

## Development

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Stack

- [Next.js](https://nextjs.org) 15 + React 19
- [Byoky SDK](https://github.com/MichaelLod/byoky) for BYOK (Bring Your Own Key)
- [Tailwind CSS](https://tailwindcss.com) v4
- Zero backend — all AI calls and PDF rendering happen client-side

## License

MIT
