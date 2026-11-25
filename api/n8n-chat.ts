import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import net from 'node:net';

interface VercelRequest extends IncomingMessage {
  body?: unknown;
}

interface VercelResponse extends ServerResponse {
  status?: (code: number) => VercelResponse;
  json?: (body: unknown) => void;
}

const MAX_BODY_BYTES = 16 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function sendJson(res: VercelResponse, statusCode: number, payload: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode);
    res.json(payload);
    return;
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

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

async function readJsonBody(req: VercelRequest): Promise<Record<string, unknown> | null> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }

  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) return null;
    try {
      const parsed: unknown = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (totalBytes === 0) {
        resolve({});
        return;
      }
      try {
        const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null);
      } catch {
        resolve(null);
      }
    });

    req.on('error', () => resolve(null));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Metode tidak diizinkan.' });
    return;
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    sendJson(res, 429, {
      error: 'Terlalu banyak pesan dalam waktu singkat. Mohon tunggu sebentar.',
    });
    return;
  }

  const body = await readJsonBody(req);
  if (!body) {
    sendJson(res, 400, { error: 'Format permintaan tidak valid atau terlalu besar.' });
    return;
  }

  const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
  const rawSessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

  if (!rawMessage) {
    sendJson(res, 400, { error: 'Pesan tidak boleh kosong.' });
    return;
  }

  if (rawMessage.length > 1000) {
    sendJson(res, 400, { error: 'Pesan maksimal 1000 karakter.' });
    return;
  }

  const sessionId = /^[a-zA-Z0-9_-]{4,64}$/.test(rawSessionId)
    ? rawSessionId
    : `chat_${crypto.randomUUID().slice(0, 10)}`;

  const history = sanitizeHistory(body.history);
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
        sendJson(res, 502, {
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

      sendJson(res, 200, {
        reply: replyText || 'Pesan Anda sudah diterima dan sedang diproses.',
        timestamp,
      });
      return;
    } catch {
      sendJson(res, 502, {
        error: 'Koneksi ke asisten sedang terkendala. Mohon coba beberapa saat lagi.',
      });
      return;
    }
  }

  sendJson(res, 200, {
    reply: buildFallbackReply(rawMessage),
    timestamp,
  });
}
