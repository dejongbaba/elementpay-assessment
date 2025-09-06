import { createHmac, timingSafeEqual } from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const WEBHOOK_TOLERANCE = 300; // 5 minutes in seconds

export interface WebhookSignature {
  timestamp: number;
  signature: string;
}

export function parseSignatureHeader(signatureHeader: string): WebhookSignature | null {
  try {
    const parts = signatureHeader.split(',');
    let timestamp: number | null = null;
    let signature: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signature = value;
      }
    }

    if (timestamp === null || signature === null) {
      return null;
    }

    return { timestamp, signature };
  } catch {
    return null;
  }
}

export function computeSignature(timestamp: number, payload: string): string {
  const data = `${timestamp}.${payload}`;
  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(data, 'utf8');
  return hmac.digest('base64');
}

export function verifySignature(
  receivedSignature: string,
  timestamp: number,
  payload: string
): boolean {
  const expectedSignature = computeSignature(timestamp, payload);
  
  // Convert strings to buffers for constant-time comparison
  const receivedBuffer = Buffer.from(receivedSignature, 'base64');
  const expectedBuffer = Buffer.from(expectedSignature, 'base64');
  
  // Ensure buffers are the same length
  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function isTimestampFresh(timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - timestamp) <= WEBHOOK_TOLERANCE;
}

export function verifyWebhook(
  signatureHeader: string,
  payload: string
): { valid: boolean; error?: string } {
  const parsedSignature = parseSignatureHeader(signatureHeader);
  
  if (!parsedSignature) {
    return { valid: false, error: 'Invalid signature format' };
  }

  const { timestamp, signature } = parsedSignature;

  // Check timestamp freshness
  if (!isTimestampFresh(timestamp)) {
    return { valid: false, error: 'Timestamp too old or too far in the future' };
  }

  // Verify signature
  if (!verifySignature(signature, timestamp, payload)) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}