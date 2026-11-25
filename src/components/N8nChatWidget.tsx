import { useEffect, useRef, useState } from 'react';
import { MessageSquare, RotateCcw, Send, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  'Tanya layanan otomasi n8n',
  'Cek proyek chatbot emas & kurs',
  'Diskusi produksi video iklan AI',
];

function formatWibShortTime(): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `chat_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
  }
  return `chat_${Math.random().toString(36).slice(2, 12)}`;
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: 'Halo! Saya asisten Beureune. Silakan tanyakan seputar otomasi n8n, proyek portofolio, atau kebutuhan alur kerja bisnis Anda.',
    time: formatWibShortTime(),
  };
}

export function N8nChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => createSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(),
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    setErrorText(null);

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
      time: formatWibShortTime(),
    };

    const nextHistory = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/n8n-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          history: nextHistory,
        }),
      });

      const payload = (await res.json()) as {
        reply?: string;
        error?: string;
      };

      if (!res.ok) {
        setErrorText(
          payload.error || 'Pesan gagal dikirim. Coba beberapa saat lagi.',
        );
        return;
      }

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        text: payload.reply || 'Pesan Anda sudah diterima.',
        time: formatWibShortTime(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setErrorText('Koneksi terputus. Silakan coba kirim ulang.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleReset = () => {
    if (isSending) return;
    setSessionId(createSessionId());
    setMessages([createWelcomeMessage()]);
    setErrorText(null);
    setInput('');
  };

  return (
    <>
      {/* Bottom-Right Editorial Launcher */}
      <div className="fixed right-5 bottom-5 z-40 sm:right-8 sm:bottom-8">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="n8n-chat-widget"
          className={`inline-flex min-h-[46px] cursor-pointer items-center gap-2.5 border px-4 py-2.5 text-sm font-medium whitespace-nowrap shadow-[0_14px_34px_rgba(20,20,19,0.14)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#002FA7] ${
            isOpen
              ? 'border-[#141413] bg-[#141413] text-[#F6F5F1]'
              : 'border-[#141413] bg-[#F6F5F1] text-[#141413] hover:border-[#002FA7] hover:bg-[#002FA7] hover:text-[#F6F5F1]'
          }`}
        >
          {isOpen ? (
            <>
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tutup Chat</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tanya Asisten</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom-Right Slide-Up Chat Drawer */}
      {isOpen && (
        <section
          id="n8n-chat-widget"
          aria-label="Asisten Chatbot Beureune"
          className="fixed right-4 bottom-20 z-40 flex h-[min(540px,calc(100vh-7rem))] w-[calc(100vw-2rem)] flex-col border border-[#141413] bg-[#F6F5F1] text-[#141413] shadow-[0_24px_60px_rgba(20,20,19,0.18)] sm:right-8 sm:bottom-24 sm:w-[396px]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[#D8D6CE] bg-[#ECEAE4]/85 px-5 py-4">
            <div className="min-w-0">
              <h2 className="font-display truncate text-base font-semibold tracking-[-0.02em] text-[#141413]">
                Asisten Beureune
              </h2>
              <p className="font-mono-meta mt-0.5 truncate text-[11px] text-[#5C5B57]">
                Didukung alur kerja n8n
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSending}
                aria-label="Mulai ulang percakapan"
                title="Mulai ulang"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-[#5C5B57] transition-colors hover:bg-[#F6F5F1] hover:text-[#141413] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7] disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup jendela chat"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-[#5C5B57] transition-colors hover:bg-[#F6F5F1] hover:text-[#141413] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Message Feed */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#002FA7] text-[#F6F5F1]'
                        : 'border border-[#D8D6CE] bg-[#ECEAE4]/70 text-[#141413]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <span className="font-mono-meta mt-1 text-[10px] text-[#5C5B57]">
                    {msg.time} WIB
                  </span>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start">
                <div className="border border-[#D8D6CE] bg-[#ECEAE4]/70 px-3.5 py-2.5">
                  <span className="font-mono-meta text-xs text-[#5C5B57]">
                    Sedang mengetik...
                  </span>
                </div>
              </div>
            )}

            {errorText && (
              <div
                role="alert"
                className="border border-[#141413] bg-[#ECEAE4] px-3.5 py-2.5 text-xs text-[#141413]"
              >
                {errorText}
              </div>
            )}

            {messages.length === 1 && !isSending && (
              <div className="pt-1">
                <p className="font-mono-meta mb-2 text-[11px] text-[#5C5B57]">
                  Topik cepat
                </p>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="cursor-pointer border border-[#D8D6CE] bg-[#F6F5F1] px-3 py-2 text-left text-xs text-[#141413] transition-colors hover:border-[#002FA7] hover:bg-[#ECEAE4] hover:text-[#002FA7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={listEndRef} />
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-[#D8D6CE] bg-[#F6F5F1] px-4 py-3"
          >
            <label htmlFor="n8n-chat-input" className="sr-only">
              Tulis pesan untuk asisten
            </label>
            <input
              ref={inputRef}
              id="n8n-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              disabled={isSending}
              placeholder="Tulis pesan..."
              className="min-h-[44px] flex-1 border border-[#D8D6CE] bg-[#ECEAE4]/45 px-3 py-2 text-sm text-[#141413] placeholder:text-[#5C5B57] focus:border-[#002FA7] focus:bg-[#F6F5F1] focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="Kirim pesan"
              className="inline-flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center bg-[#002FA7] text-[#F6F5F1] transition-colors hover:bg-[#00237D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7] disabled:cursor-not-allowed disabled:bg-[#D8D6CE] disabled:text-[#5C5B57]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
