'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Byoky, type ByokySession } from '@byoky/sdk';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: UploadedImage[];
}

type ProviderType = 'anthropic' | 'openai' | 'gemini';

interface ProviderConfig {
  name: string;
  type: ProviderType;
  url: string;
  model: string;
  supportsVision: boolean;
  streamUrl?: string;
}

// ─── Provider Configuration ──────────────────────────────────────────────────

const PROVIDERS: Record<string, ProviderConfig> = {
  anthropic: {
    name: 'Claude',
    type: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    supportsVision: true,
  },
  openai: {
    name: 'GPT-4o',
    type: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    supportsVision: true,
  },
  gemini: {
    name: 'Gemini',
    type: 'gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    model: 'gemini-2.0-flash',
    supportsVision: true,
    streamUrl:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse',
  },
  mistral: {
    name: 'Mistral',
    type: 'openai',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    supportsVision: false,
  },
  xai: {
    name: 'Grok',
    type: 'openai',
    url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-2-latest',
    supportsVision: true,
  },
  deepseek: {
    name: 'DeepSeek',
    type: 'openai',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    supportsVision: false,
  },
  groq: {
    name: 'Groq',
    type: 'openai',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    supportsVision: false,
  },
  together: {
    name: 'Together',
    type: 'openai',
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    supportsVision: false,
  },
  fireworks: {
    name: 'Fireworks',
    type: 'openai',
    url: 'https://api.fireworks.ai/inference/v1/chat/completions',
    model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
    supportsVision: false,
  },
  openrouter: {
    name: 'OpenRouter',
    type: 'openai',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'anthropic/claude-sonnet-4-20250514',
    supportsVision: true,
  },
  perplexity: {
    name: 'Perplexity',
    type: 'openai',
    url: 'https://api.perplexity.ai/chat/completions',
    model: 'sonar',
    supportsVision: false,
  },
};

// ─── Suggestions ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  {
    label: 'Invoice',
    prompt:
      'Create a professional invoice for a freelance web development project. Dark blue header with company name "Acme Studio", client details, itemized services table with hours and rates, subtotal, 10% tax, and total. Modern, clean design.',
  },
  {
    label: 'Resume',
    prompt:
      'Create a modern two-column resume for a senior software engineer. Left column (narrow, dark) with contact info, skills, and education. Right column (wide, white) with professional summary, work experience with bullet points, and key projects.',
  },
  {
    label: 'Certificate',
    prompt:
      'Create an elegant certificate of achievement with decorative gold borders, formal heading, recipient name placeholder, achievement description, date, and signature lines. Traditional, prestigious design.',
  },
  {
    label: 'Report',
    prompt:
      'Create a professional project status report with a cover section, executive summary, progress table with RAG status, key metrics, risks section, and next steps. Clean corporate design.',
  },
  {
    label: 'Letter',
    prompt:
      'Create a formal business letter with sender address, date, recipient address, subject line, body paragraphs about a partnership proposal, and signature block. Classic business formatting.',
  },
  {
    label: 'Meeting Notes',
    prompt:
      'Create structured meeting notes with title, date/time, attendees list, agenda items, discussion summaries, action items table with owners and deadlines, and next meeting date.',
  },
];

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(imageCount: number): string {
  const imageList =
    imageCount > 0
      ? `Available images: ${Array.from({ length: imageCount }, (_, i) => `{{IMAGE_${i + 1}}}`).join(', ')}. Reference them with <img src="{{IMAGE_N}}" style="max-width:100%;" />.`
      : 'No images uploaded.';

  return `You are a world-class document designer who creates stunning, professional PDF documents using HTML and CSS.

When the user describes a document, generate the COMPLETE HTML that will be rendered and converted to a PDF.

OUTPUT RULES:
- Output ONLY raw HTML. No markdown, no code fences, no explanations, no preamble.
- Start with <!DOCTYPE html> or <html>.
- If the user asks for modifications, output the ENTIRE updated document.

DESIGN RULES:
- Use a <style> tag in <head> for all CSS.
- Design for A4 paper: @page { size: A4; margin: 20mm; }
- Body: white background, color #1a1a1a.
- Professional fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif for modern docs; Georgia, 'Times New Roman', serif for formal docs.
- Body text: 11-12pt, line-height 1.6.
- Headings: clear hierarchy with proportional sizes.
- Tables: clean borders (#e5e7eb), padding 8-12px, alternating row backgrounds.
- Use page-break-before / page-break-after for multi-page content.
- All content must fit within page width — no horizontal overflow.

IMAGE RULES:
${imageList}

QUALITY: Every document should look professionally designed — clean spacing, visual hierarchy, subtle design touches.`;
}

// ─── HTML Processing ─────────────────────────────────────────────────────────

function cleanHtml(text: string): string {
  let html = text.trim();
  const fenced = html.match(/^```(?:html)?\s*\n?([\s\S]*?)```\s*$/);
  if (fenced) html = fenced[1].trim();
  if (!html.startsWith('<') && !html.startsWith('<!')) {
    const idx = html.indexOf('<');
    if (idx > 0) html = html.slice(idx);
  }
  return html;
}

function processHtml(text: string, images: UploadedImage[]): string {
  let html = cleanHtml(text);
  images.forEach((img, i) => {
    html = html.replaceAll(`{{IMAGE_${i + 1}}}`, img.dataUrl);
  });
  return html;
}

// ─── SSE Streaming ───────────────────────────────────────────────────────────

async function parseStream(
  response: Response,
  extractDelta: (data: string) => string | null,
  onChunk: (fullText: string) => void,
): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    onChunk(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]' || !data) continue;
      const delta = extractDelta(data);
      if (delta) {
        fullText += delta;
        onChunk(fullText);
      }
    }
  }

  return fullText;
}

function anthropicDelta(data: string): string | null {
  try {
    const p = JSON.parse(data);
    return p.type === 'content_block_delta' ? (p.delta?.text ?? null) : null;
  } catch {
    return null;
  }
}

function openaiDelta(data: string): string | null {
  try {
    return JSON.parse(data).choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

function geminiDelta(data: string): string | null {
  try {
    return JSON.parse(data).candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ─── Request Builders ────────────────────────────────────────────────────────

function textOnlyMessages(messages: Message[]): { role: string; content: string }[] {
  return messages.map((m) => {
    let text = m.content;
    if (m.role === 'user' && m.images?.length) {
      const names = m.images.map((img) => img.name).join(', ');
      text = `[Uploaded images: ${names}]\n\n${text}`;
    }
    return { role: m.role, content: text };
  });
}

function buildAnthropicRequest(
  systemPrompt: string,
  messages: Message[],
): [string, RequestInit] {
  const apiMessages = [
    { role: 'user' as const, content: systemPrompt },
    { role: 'assistant' as const, content: 'Understood. I will follow these instructions.' },
    ...textOnlyMessages(messages),
  ];

  return [
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: apiMessages,
        stream: true,
      }),
    },
  ];
}

function buildOpenAIRequest(
  systemPrompt: string,
  messages: Message[],
  config: ProviderConfig,
): [string, RequestInit] {
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...textOnlyMessages(messages),
  ];

  return [
    config.url,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: config.model, messages: apiMessages, max_tokens: 8192, stream: true }),
    },
  ];
}

function buildGeminiRequest(
  systemPrompt: string,
  messages: Message[],
): [string, RequestInit] {
  const contents = textOnlyMessages(messages).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents }),
    },
  ];
}

// ─── Non-streaming Fallback Extractors ───────────────────────────────────────

function extractNonStreaming(type: ProviderType, data: string): string {
  try {
    const parsed = JSON.parse(data);
    if (type === 'anthropic') return parsed.content?.[0]?.text || '';
    if (type === 'gemini') return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parsed.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

// ─── PDF Download ────────────────────────────────────────────────────────────

async function downloadPdf(html: string, setDownloading?: (v: boolean) => void) {
  setDownloading?.(true);
  try {
    const html2pdf = (await import('html2pdf.js')).default;

    // Use an iframe so the HTML renders in its own document context
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-1';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Cannot access iframe');

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content + images to load
    await new Promise<void>((resolve) => {
      const imgs = iframeDoc.querySelectorAll('img');
      if (imgs.length === 0) {
        setTimeout(resolve, 200);
        return;
      }
      let loaded = 0;
      const check = () => { if (++loaded >= imgs.length) setTimeout(resolve, 100); };
      imgs.forEach((img) => {
        if (img.complete) check();
        else { img.onload = check; img.onerror = check; }
      });
      setTimeout(resolve, 3000);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (html2pdf as any)()
      .set({
        margin: 0,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 794,
          width: 794,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(iframeDoc.body)
      .save();

    document.body.removeChild(iframe);
  } catch {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(a.href);
  } finally {
    setDownloading?.(false);
  }
}

// ─── Byoky Instance ─────────────────────────────────────────────────────────

const byoky = new Byoky({ timeout: 120_000 });

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PDFApp() {
  const [session, setSession] = useState<ByokySession | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<UploadedImage[]>([]);
  const [allImages, setAllImages] = useState<UploadedImage[]>([]);
  const [html, setHtml] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableProviders = useMemo(() => {
    if (!session?.providers) return [];
    return Object.keys(session.providers).filter((id) => id in PROVIDERS);
  }, [session?.providers]);

  // Auto-reconnect
  useEffect(() => {
    byoky.tryReconnect().then((s) => {
      if (s) onConnected(s);
      setRestoring(false);
    });
  }, []);

  // Auto-select provider
  useEffect(() => {
    if (availableProviders.length > 0 && !selectedProvider) {
      const preferred = ['anthropic', 'openai', 'gemini'];
      const pick = preferred.find((p) => availableProviders.includes(p)) || availableProviders[0];
      setSelectedProvider(pick);
    }
  }, [availableProviders, selectedProvider]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  function onConnected(s: ByokySession) {
    s.onDisconnect(() => setSession(null));
    s.onProvidersUpdated(() => setSession({ ...s }));
    setSession(s);
  }

  async function handleConnect() {
    setError('');
    try {
      const s = await byoky.connect({
        providers: [
          { id: 'anthropic', required: false },
          { id: 'openai', required: false },
          { id: 'gemini', required: false },
          { id: 'mistral', required: false },
          { id: 'xai', required: false },
          { id: 'deepseek', required: false },
          { id: 'groq', required: false },
          { id: 'together', required: false },
          { id: 'fireworks', required: false },
          { id: 'openrouter', required: false },
          { id: 'perplexity', required: false },
        ],
        modal: true,
      });
      onConnected(s);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'User cancelled') return;
      setError(msg);
    }
  }

  function handleDisconnect() {
    session?.disconnect();
    setSession(null);
    setSelectedProvider('');
  }

  // ─── Image Handling ──────────────────────────────────────────────────────

  function addImages(files: File[]) {
    files
      .filter((f) => f.type.startsWith('image/'))
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPendingImages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              name: file.name || 'image.png',
              dataUrl: reader.result as string,
              mimeType: file.type,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    addImages(Array.from(e.target.files || []));
    e.target.value = '';
  }

  function handlePaste(e: React.ClipboardEvent) {
    const imageItems = Array.from(e.clipboardData.items).filter((i) => i.type.startsWith('image/'));
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map((i) => i.getAsFile()).filter(Boolean) as File[];
      addImages(files);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    addImages(Array.from(e.dataTransfer.files));
  }

  // ─── AI Generation ──────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!input.trim() || generating || !selectedProvider || !session) return;

    const provider = PROVIDERS[selectedProvider];
    if (!provider) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
    };

    const newMessages = [...messages, userMessage];
    const newAllImages = [...allImages, ...pendingImages];

    setMessages(newMessages);
    setAllImages(newAllImages);
    setInput('');
    setPendingImages([]);
    setGenerating(true);
    setError('');

    try {
      const systemPrompt = buildSystemPrompt(newAllImages.length);

      let url: string;
      let init: RequestInit;
      let extractor: (data: string) => string | null;

      if (provider.type === 'anthropic') {
        [url, init] = buildAnthropicRequest(systemPrompt, newMessages);
        extractor = anthropicDelta;
      } else if (provider.type === 'gemini') {
        [url, init] = buildGeminiRequest(systemPrompt, newMessages);
        extractor = geminiDelta;
      } else {
        [url, init] = buildOpenAIRequest(systemPrompt, newMessages, provider);
        extractor = openaiDelta;
      }

      const proxyFetch = session.createFetch(selectedProvider);
      const response = await proxyFetch(url, init);

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`API error (${response.status}): ${errBody.slice(0, 200)}`);
      }

      let fullText: string;

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') || response.body) {
        let lastUpdate = 0;
        fullText = await parseStream(response, extractor, (text) => {
          const now = Date.now();
          if (now - lastUpdate >= 80) {
            setHtml(processHtml(text, newAllImages));
            lastUpdate = now;
          }
        });
      } else {
        const body = await response.text();
        fullText = extractNonStreaming(provider.type, body);
      }

      const finalHtml = processHtml(fullText, newAllImages);
      setHtml(finalHtml);
      setMessages((prev) => [...prev, { role: 'assistant', content: fullText }]);
      setActiveTab('preview');
    } catch (err) {
      setError((err as Error).message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  }, [input, generating, selectedProvider, session, messages, pendingImages, allImages]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleNewDocument() {
    setMessages([]);
    setHtml('');
    setAllImages([]);
    setPendingImages([]);
    setInput('');
    setError('');
    setActiveTab('chat');
  }

  function handleDownload() {
    if (html) downloadPdf(html, setDownloading);
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 generating-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 generating-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 generating-dot" />
        </div>
      </div>
    );
  }

  // ─── Connect Screen ───────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                <svg width="64" height="64" viewBox="0 0 512 512" fill="none">
                  <rect width="512" height="512" rx="108" fill="#4f46e5"/>
                  <path d="M148 80h136l80 80v272a24 24 0 0 1-24 24H148a24 24 0 0 1-24-24V104a24 24 0 0 1 24-24z" fill="white" opacity="0.95"/>
                  <path d="M284 80v56a24 24 0 0 0 24 24h56z" fill="white" opacity="0.6"/>
                  <polygon points="390,200 400,230 430,240 400,250 390,280 380,250 350,240 380,230" fill="white"/>
                  <polygon points="420,300 426,316 442,322 426,328 420,344 414,328 398,322 414,316" fill="white" opacity="0.8"/>
                  <polygon points="370,150 374,160 384,164 374,168 370,178 366,168 356,164 366,160" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Free AI PDF Generator</h1>
              <p className="text-gray-500 mt-2">Create any PDF with AI. Your keys, zero cost.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-8">
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Connect your AI wallet</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Powered by Byoky — your keys never leave your device</p>

              <div className="space-y-3 mb-6">
                {[
                  'Works with 15+ AI providers',
                  'Keys stay encrypted on your device',
                  'No account or server costs',
                  'Upload images, create any document',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs shrink-0">&#10003;</span>
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={handleConnect}
                className="w-full py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand-dark transition cursor-pointer flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
                </svg>
                Connect Byoky Wallet
              </button>

              {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}

              <p className="text-center text-sm text-gray-400 mt-4">
                Don&apos;t have Byoky?{' '}
                <a href="https://byoky.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                  Get the app or extension
                </a>
              </p>
            </div>
          </div>
        </div>

        <footer className="py-4 text-center text-sm text-gray-400 flex items-center justify-center gap-4">
          <span>
            Powered by{' '}
            <a href="https://github.com/MichaelLod/byoky" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline">
              Byoky
            </a>
          </span>
          <a href="https://github.com/MichaelLod/aipdfgen" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:underline">
            GitHub
          </a>
        </footer>
      </div>
    );
  }

  // ─── Generator Screen ─────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center px-4 shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <svg width="22" height="22" viewBox="0 0 512 512" fill="none" className="shrink-0">
            <rect width="512" height="512" rx="108" fill="#4f46e5"/>
            <path d="M148 80h136l80 80v272a24 24 0 0 1-24 24H148a24 24 0 0 1-24-24V104a24 24 0 0 1 24-24z" fill="white" opacity="0.95"/>
            <path d="M284 80v56a24 24 0 0 0 24 24h56z" fill="white" opacity="0.6"/>
            <polygon points="390,200 400,230 430,240 400,250 390,280 380,250 350,240 380,230" fill="white"/>
            <polygon points="420,300 426,316 442,322 426,328 420,344 414,328 398,322 414,316" fill="white" opacity="0.8"/>
            <polygon points="370,150 374,160 384,164 374,168 370,178 366,168 356,164 366,160" fill="white" opacity="0.7"/>
          </svg>
          <span className="font-semibold text-gray-900 truncate hidden sm:inline">Free AI PDF Generator</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {availableProviders.length > 1 && (
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {availableProviders.map((id) => (
                <option key={id} value={id}>
                  {PROVIDERS[id]?.name || id}
                </option>
              ))}
            </select>
          )}
          {availableProviders.length === 1 && (
            <span className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {PROVIDERS[selectedProvider]?.name}
            </span>
          )}
          <button
            onClick={handleNewDocument}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
          >
            New
          </button>
          <button
            onClick={handleDisconnect}
            className="text-sm px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 transition cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 text-sm font-medium transition cursor-pointer ${activeTab === 'chat' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2.5 text-sm font-medium transition cursor-pointer ${activeTab === 'preview' ? 'text-brand border-b-2 border-brand' : 'text-gray-500'}`}
        >
          Preview
          {html && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div
          className={`w-full md:w-[420px] md:border-r border-gray-200 flex-col ${activeTab !== 'chat' ? 'hidden md:flex' : 'flex'}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && !generating ? (
              <div>
                <p className="text-sm text-gray-400 mb-3">Quick start — click a template or describe any PDF:</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setInput(s.prompt)}
                      className="text-left p-3 rounded-xl border border-gray-200 hover:border-brand/40 hover:bg-indigo-50/50 transition text-sm cursor-pointer"
                    >
                      <span className="font-medium text-gray-800">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-brand text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-700 rounded-bl-md'
                      }`}
                    >
                      {m.role === 'user' ? (
                        <>
                          {m.images && m.images.length > 0 && (
                            <div className="flex gap-1.5 mb-2 flex-wrap">
                              {m.images.map((img) => (
                                <img
                                  key={img.id}
                                  src={img.dataUrl}
                                  alt={img.name}
                                  className="h-12 w-12 object-cover rounded-lg border border-white/30"
                                />
                              ))}
                            </div>
                          )}
                          {m.content}
                        </>
                      ) : (
                        <span className="text-gray-500 italic">PDF generated — see preview</span>
                      )}
                    </div>
                  </div>
                ))}
                {generating && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-gray-400 generating-dot" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 generating-dot" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 generating-dot" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Pending images */}
          {pendingImages.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto">
              {pendingImages.map((img) => (
                <div key={img.id} className="relative shrink-0 group">
                  <img src={img.dataUrl} alt={img.name} className="h-14 w-14 object-cover rounded-lg border border-gray-200" />
                  <button
                    onClick={() => setPendingImages((prev) => prev.filter((i) => i.id !== img.id))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <span className="flex-1 break-all">{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 shrink-0 cursor-pointer">&times;</button>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition cursor-pointer"
                title="Upload images"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Describe the PDF you want to create..."
                rows={1}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 max-h-40"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || generating}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-dark transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </div>
        </div>

        {/* Right: Preview */}
        <div className={`flex-1 flex-col bg-gray-50 ${activeTab !== 'preview' ? 'hidden md:flex' : 'flex'}`}>
          {/* Preview header */}
          <div className="h-11 border-b border-gray-200 flex items-center px-4 bg-white shrink-0">
            <span className="text-sm text-gray-400">Preview</span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  if (html) navigator.clipboard.writeText(html);
                }}
                disabled={!html}
                className="text-xs px-2.5 py-1 rounded-md text-gray-500 hover:bg-gray-100 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                Copy HTML
              </button>
              <button
                onClick={handleDownload}
                disabled={!html || generating || downloading}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {downloading ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                      <circle cx="12" cy="12" r="10" strokeDasharray="50" strokeDashoffset="15" />
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center items-start">
            {html ? (
              <div className="bg-white shadow-lg shadow-gray-300/30 rounded-sm w-full" style={{ maxWidth: 794 }}>
                <iframe
                  srcDoc={html}
                  sandbox="allow-same-origin"
                  className="preview-iframe"
                  title="PDF Preview"
                  style={{ height: Math.max(1123, 600) }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-gray-300">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <p className="text-sm">Your PDF preview will appear here</p>
                  <p className="text-xs text-gray-300 mt-1">Describe a document to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
