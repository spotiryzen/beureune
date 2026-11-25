import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Bounded in-memory per-IP rate limiter (20 requests / 60s)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetAt) rateLimitStore.delete(key);
    }
  }

  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// Validate outbound webhook URL to block loopback, private, and link-local addresses
function isSafeExternalWebhookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    const ipVersion = net.isIP(hostname);
    if (ipVersion === 4) {
      const [a, b] = hostname.split('.').map(Number);
      if (
        a === 10 ||
        a === 127 ||
        a === 0 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      ) {
        return false;
      }
    } else if (ipVersion === 6) {
      if (
        hostname.startsWith('fc') ||
        hostname.startsWith('fd') ||
        hostname.startsWith('fe80') ||
        hostname === '::1'
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

function extractReplyFromN8n(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (Array.isArray(data) && data.length > 0) {
    return extractReplyFromN8n(data[0]);
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    for (const key of ['reply', 'output', 'text', 'message', 'response', 'answer']) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    if (obj.data !== undefined) {
      return extractReplyFromN8n(obj.data);
    }
  }

  return null;
}

function sanitizeHistory(raw: unknown): Array<{ role: 'user' | 'assistant'; text: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(-6)
    .filter(
      (item): item is { role: 'user' | 'assistant'; text: string } =>
        Boolean(item) &&
        typeof item === 'object' &&
        ((item as Record<string, unknown>).role === 'user' ||
          (item as Record<string, unknown>).role === 'assistant') &&
        typeof (item as Record<string, unknown>).text === 'string',
    )
    .map((item) => ({
      role: item.role,
      text: item.text.trim().slice(0, 500),
    }))
    .filter((item) => item.text.length > 0);
}

function buildFallbackReply(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('emas') || lower.includes('kurs') || lower.includes('antam')) {
    return 'Proyek 01 (Chatbot Keuangan & Harga Emas) dirancang memakai n8n untuk mengecek harga emas Antam/UBS dan kurs USD/IDR secara otomatis dalam di bawah 2 detik. Anda dapat mendiskusikan kebutuhan serupa dengan Beureune lewat email spotiryzen@gmail.com.';
  }

  if (lower.includes('video') || lower.includes('iklan') || lower.includes('visual')) {
    return 'Untuk layanan Video Iklan Berbasis AI, Beureune mengerjakan alur dari konsep, keyframe, video generatif, sulih suara bahasa Indonesia, hingga hasil siap tayang dalam 48 jam per SKU.';
  }

  if (lower.includes('n8n') || lower.includes('otomasi') || lower.includes('workflow') || lower.includes('bisnis')) {
    return 'Beureune membantu merancang alur kerja otomatis berbasis n8n & AI untuk operasional harian—mulai dari chatbot layanan pelanggan, rekonsiliasi stok FMCG, hingga notifikasi laporan otomatis.';
  }

  return 'Terima kasih atas pesan Anda! Untuk diskusi lebih lanjut mengenai otomasi n8n, chatbot AI, atau produksi video iklan, Anda juga bisa menghubungi langsung ke spotiryzen@gmail.com atau Instagram @beureune.';
}

async function createServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));

  app.post('/api/n8n-chat', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        error: 'Terlalu banyak pesan dalam waktu singkat. Mohon tunggu sebentar.',
      });
      return;
    }

    const body = req.body as Record<string, unknown> | undefined;
    const rawMessage = typeof body?.message === 'string' ? body.message.trim() : '';
    const rawSessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';

    if (!rawMessage) {
      res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
      return;
    }

    if (rawMessage.length > 1000) {
      res.status(400).json({ error: 'Pesan maksimal 1000 karakter.' });
      return;
    }

    const sessionId = /^[a-zA-Z0-9_-]{4,64}$/.test(rawSessionId)
      ? rawSessionId
      : `chat_${crypto.randomUUID().slice(0, 10)}`;

    const history = sanitizeHistory(body?.history);
    const timestamp = new Date().toISOString();

    const webhookUrl = process.env.N8N_WEBHOOK_URL?.trim() ?? '';
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET?.trim() ?? '';

    if (webhookUrl && isSafeExternalWebhookUrl(webhookUrl)) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain',
        };
        if (webhookSecret) {
          headers['X-Webhook-Secret'] = webhookSecret;
        }

        const upstreamRes = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            chatInput: rawMessage,
            message: rawMessage,
            sessionId,
            history,
            source: 'beureune-portfolio',
            timestamp,
          }),
          signal: AbortSignal.timeout(15_000),
        });

        if (!upstreamRes.ok) {
          res.status(502).json({
            error: 'Asisten sedang sibuk. Silakan coba kirim pesan lagi sebentar lagi.',
          });
          return;
        }

        const contentType = upstreamRes.headers.get('content-type') || '';
        let replyText: string | null = null;

        if (contentType.includes('application/json')) {
          const data: unknown = await upstreamRes.json();
          replyText = extractReplyFromN8n(data);
        } else {
          const plain = (await upstreamRes.text()).trim();
          if (plain) replyText = plain.slice(0, 3000);
        }

        res.json({
          reply: replyText || 'Pesan Anda sudah diterima dan sedang diproses.',
          timestamp,
        });
        return;
      } catch {
        res.status(502).json({
          error: 'Koneksi ke asisten sedang terkendala. Mohon coba beberapa saat lagi.',
        });
        return;
      }
    }

    // Clean local response while webhook is not configured yet
    res.json({
      reply: buildFallbackReply(rawMessage),
      timestamp,
    });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
