import { NextRequest, NextResponse } from 'next/server';
import { orderStore } from '@/lib/store';

interface RouteContext {
  params: Promise<{
    order_id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { order_id } = await params;
    
    // Get order from store
    const order = orderStore.getOrder(order_id);
    
    if (!order) {
      return NextResponse.json(
        { 
          error: 'order_not_found', 
          message: `No order with id ${order_id}` 
        },
        { status: 404 }
      );
    }

    // Calculate time-based status
    const timeBasedStatus = orderStore.getTimeBasedStatus(order.created_at);
    
    // Update order status if it has progressed
    if (timeBasedStatus !== order.status) {
      orderStore.updateOrderStatus(order_id, timeBasedStatus);
      order.status = timeBasedStatus;
    }

    // Return order with current status
    return NextResponse.json({
      order_id: order.order_id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      token: order.token,
      created_at: order.created_at,
    });
  } catch (error) {
    console.error('Error retrieving order:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}