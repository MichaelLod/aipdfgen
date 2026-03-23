import PDFApp from './components/PDFApp';

export default function Page() {
  return (
    <>
      <PDFApp />
      <footer className="bg-gray-50 border-t border-gray-200 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Free AI PDF Generator — Create Any PDF Instantly</h2>
          <div className="prose prose-gray max-w-none text-sm text-gray-600 space-y-4">
            <p>
              The <strong>Free AI PDF Generator</strong> lets you create professional PDF documents using AI — completely free, with no sign-up required. Generate invoices, resumes, certificates, reports, business letters, meeting notes, contracts, and any other document by simply describing what you need in plain language.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mt-8">What Can You Create?</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 list-disc list-inside">
              <li><strong>Invoices</strong> — professional freelance &amp; business invoices</li>
              <li><strong>Resumes &amp; CVs</strong> — modern, ATS-friendly resume designs</li>
              <li><strong>Certificates</strong> — achievement, completion, and award certificates</li>
              <li><strong>Reports</strong> — project status, annual, and financial reports</li>
              <li><strong>Letters</strong> — business letters, cover letters, recommendation letters</li>
              <li><strong>Meeting Notes</strong> — structured agendas and action item templates</li>
              <li><strong>Contracts</strong> — service agreements and proposal documents</li>
              <li><strong>Flyers &amp; Brochures</strong> — marketing materials and event flyers</li>
            </ul>
            <h3 className="text-lg font-semibold text-gray-800 mt-8">How It Works</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Connect your AI wallet with <a href="https://byoky.com" className="text-indigo-600 hover:underline">Byoky</a> — your API keys stay encrypted on your device</li>
              <li>Describe the PDF you want in plain language or choose a template</li>
              <li>Watch as AI generates a professional document in real-time</li>
              <li>Refine the design with follow-up instructions</li>
              <li>Download as PDF with one click — perfect quality using your browser&apos;s native renderer</li>
            </ol>
            <h3 className="text-lg font-semibold text-gray-800 mt-8">Supported AI Models</h3>
            <p>
              Works with <strong>ChatGPT (GPT-4o)</strong>, <strong>Claude (Anthropic)</strong>, <strong>Gemini (Google)</strong>, <strong>Grok (xAI)</strong>, <strong>DeepSeek</strong>, <strong>Mistral</strong>, <strong>Groq</strong>, <strong>Together AI</strong>, <strong>Fireworks</strong>, <strong>OpenRouter</strong>, <strong>Perplexity</strong>, and more — over 15 AI providers supported.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mt-8">Why It&apos;s Free</h3>
            <p>
              Unlike other AI PDF tools that charge subscriptions, this generator uses your own AI API keys through <a href="https://github.com/MichaelLod/byoky" className="text-indigo-600 hover:underline">Byoky</a> (an open-source AI key wallet). Everything runs in your browser — no data sent to our servers, no hidden costs, no limits.
            </p>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Open Source</h3>
            <p className="text-sm text-gray-600">
              This project is fully open source under the <strong>MIT License</strong>. Check out the code, open issues, or submit a pull request on{' '}
              <a href="https://github.com/MichaelLod/aipdfgen" className="text-indigo-600 hover:underline font-medium">GitHub</a>.
              Contributions are welcome — whether it&apos;s new features, bug fixes, or documentation improvements.
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>Powered by <a href="https://github.com/MichaelLod/byoky" className="text-gray-500 hover:underline">Byoky</a></span>
            <span>&middot;</span>
            <a href="https://github.com/MichaelLod/aipdfgen" className="text-gray-500 hover:underline">GitHub</a>
            <span>&middot;</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </>
  );
}
