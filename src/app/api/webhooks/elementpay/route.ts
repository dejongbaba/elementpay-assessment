import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/webhook-utils';
import { orderStore } from '@/lib/store';
import { WebhookPayload, OrderStatus } from '@/types/order';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    
    // Get the signature header
    const signatureHeader = request.headers.get('X-Webhook-Signature');
    
    if (!signatureHeader) {
      return NextResponse.json(
        { error: 'missing_signature', message: 'X-Webhook-Signature header is required' },
        { status: 401 }
      );
    }

    // Verify the webhook signature
    const verification = verifyWebhook(signatureHeader, rawBody);
    
    if (!verification.valid) {
      console.error('Webhook verification failed:', verification.error);
      return NextResponse.json(
        { error: 'invalid_signature', message: verification.error },
        { status: 403 }
      );
    }

    // Parse the JSON payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'invalid_json', message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate payload structure
    if (!payload.type || !payload.data || !payload.data.order_id || !payload.data.status) {
      return NextResponse.json(
        { error: 'invalid_payload', message: 'Invalid webhook payload structure' },
        { status: 400 }
      );
    }

    const { order_id, status } = payload.data;

    // Validate status
    const validStatuses: OrderStatus[] = ['created', 'processing', 'settled', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'invalid_status', message: 'Invalid order status' },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = orderStore.getOrder(order_id);
    if (!order) {
      return NextResponse.json(
        { error: 'order_not_found', message: `No order with id ${order_id}` },
        { status: 404 }
      );
    }

    // Update order status
    const updated = orderStore.updateOrderStatus(order_id, status);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'update_failed', message: 'Failed to update order status' },
        { status: 500 }
      );
    }

    console.log(`Webhook processed: Order ${order_id} status updated to ${status}`);

    // Return success response
    return NextResponse.json(
      { message: 'Webhook processed successfully', order_id, status },
      { status: 200 }
    );
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}