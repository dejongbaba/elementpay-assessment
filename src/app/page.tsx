'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { OrderForm } from '@/components/order-form';
import { ProcessingModal } from '@/components/processing-modal';
import { ReceiptCard } from '@/components/receipt-card';
import { Order } from '@/types/order';

type AppState = 'form' | 'processing' | 'receipt';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('form');
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [finalizedOrder, setFinalizedOrder] = useState<Order | null>(null);

  const handleOrderCreated = (orderId: string) => {
    setCurrentOrderId(orderId);
    setAppState('processing');
  };

  const handleOrderFinalized = (order: Order) => {
    setFinalizedOrder(order);
    setAppState('receipt');
  };

  const handleCreateAnother = () => {
    setCurrentOrderId('');
    setFinalizedOrder(null);
    setAppState('form');
  };

  const handleCloseProcessing = () => {
    setAppState('form');
    setCurrentOrderId('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ElementPay Demo</h1>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {appState === 'form' && (
          <OrderForm onOrderCreated={handleOrderCreated} />
        )}
        
        {appState === 'receipt' && finalizedOrder && (
          <ReceiptCard 
            order={finalizedOrder} 
            onCreateAnother={handleCreateAnother}
          />
        )}
      </main>

      {/* Processing Modal */}
      <ProcessingModal
        orderId={currentOrderId}
        isOpen={appState === 'processing'}
        onClose={handleCloseProcessing}
        onOrderFinalized={handleOrderFinalized}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>ElementPay Assessment - Crypto Payment Processing Demo</p>
        </div>
      </footer>
    </div>
  );
}
