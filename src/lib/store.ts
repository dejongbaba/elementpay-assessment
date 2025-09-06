import { Order, OrderStatus } from '@/types/order';

// In-memory store for orders
class OrderStore {
  private orders: Map<string, Order> = new Map();

  createOrder(order: Order): void {
    this.orders.set(order.order_id, order);
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      this.orders.set(orderId, order);
      return true;
    }
    return false;
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  // Calculate status based on creation time
  getTimeBasedStatus(createdAt: string): OrderStatus {
    const now = new Date();
    const created = new Date(createdAt);
    const secondsElapsed = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (secondsElapsed <= 7) {
      return 'created';
    } else if (secondsElapsed <= 17) {
      return 'processing';
    } else {
      // 80% chance of settled, 20% chance of failed
      return Math.random() < 0.8 ? 'settled' : 'failed';
    }
  }
}

// Export singleton instance
export const orderStore = new OrderStore();