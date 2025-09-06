import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store';
import { CreateOrderRequest, Order } from '@/types/order';

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    
    // Validate required fields
    if (!body.amount || !body.currency || !body.token) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'Amount, currency, and token are required' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'invalid_amount', message: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `ord_0x${Math.random().toString(16).substr(2, 8)}`;
    const createdAt = new Date().toISOString();

    // Create order
    const order: Order = {
      order_id: orderId,
      status: 'created',
      amount: body.amount,
      currency: body.currency,
      token: body.token,
      note: body.note,
      created_at: createdAt,
    };

    // Store order
    orderStore.createOrder(order);

    // Return response
    return NextResponse.json({
      order_id: order.order_id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      token: order.token,
      created_at: order.created_at,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to create order' },
      { status: 500 }
    );
  }
}