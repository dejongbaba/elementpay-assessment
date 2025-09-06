'use client';

import { Order } from '@/types/order';

interface ReceiptCardProps {
  order: Order;
  onCreateAnother: () => void;
}

export function ReceiptCard({ order, onCreateAnother }: ReceiptCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'settled':
        return '✅';
      case 'failed':
        return '❌';
      case 'processing':
        return '⏳';
      case 'pending':
        return '⏸️';
      default:
        return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{getStatusIcon(order.status)}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Receipt</h2>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Details</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Order ID:</span>
              <div className="font-mono text-gray-900 flex items-center gap-2">
                {order.order_id}
                <button
                  onClick={() => copyToClipboard(order.order_id)}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
            
            <div>
              <span className="text-gray-500">Amount:</span>
              <div className="font-semibold text-gray-900">
                {order.amount} {order.currency}
              </div>
            </div>
            
            <div>
              <span className="text-gray-500">Token:</span>
              <div className="font-semibold text-gray-900">{order.token}</div>
            </div>
            
            <div>
              <span className="text-gray-500">Created:</span>
              <div className="text-gray-900">{formatDate(order.created_at)}</div>
            </div>
          </div>
          
          {order.note && (
            <div className="mt-4">
              <span className="text-gray-500 text-sm">Note:</span>
              <div className="text-gray-900 text-sm mt-1 p-2 bg-gray-50 rounded">
                {order.note}
              </div>
            </div>
          )}
        </div>

        {order.status === 'settled' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-500 text-xl mr-3">🎉</div>
              <div>
                <h4 className="text-green-800 font-semibold">Payment Successful!</h4>
                <p className="text-green-700 text-sm">
                  Your order has been processed successfully.
                </p>
              </div>
            </div>
          </div>
        )}

        {order.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">⚠️</div>
              <div>
                <h4 className="text-red-800 font-semibold">Payment Failed</h4>
                <p className="text-red-700 text-sm">
                  There was an issue processing your order. Please try again.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onCreateAnother}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Another Order
          </button>
        </div>
      </div>
    </div>
  );
}