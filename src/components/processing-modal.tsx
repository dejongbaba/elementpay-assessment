'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Order } from '@/types/order';

interface PollingState {
  isActive: boolean;
  retryCount: number;
  lastPollTime: number;
}

interface ErrorState {
  hasError: boolean;
  message: string;
  isRetryable: boolean;
}

interface ProcessingModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderFinalized: (order: Order) => void;
}

export function ProcessingModal({ orderId, isOpen, onClose, onOrderFinalized }: ProcessingModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [pollingState, setPollingState] = useState<PollingState>({
    isActive: false,
    retryCount: 0,
    lastPollTime: 0
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: '',
    isRetryable: true
  });
  const [isWebhookReceived, setIsWebhookReceived] = useState(false);
  
  // Use refs to prevent race conditions
  const isFinalizedRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webhookCleanupRef = useRef<(() => void) | null>(null);

  const clearAllTimers = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (webhookCleanupRef.current) {
      webhookCleanupRef.current();
      webhookCleanupRef.current = null;
    }
  }, []);

  const finalizeOrder = useCallback((orderData: Order, source: 'polling' | 'webhook') => {
    if (isFinalizedRef.current) return;
    
    isFinalizedRef.current = true;
    setPollingState(prev => ({ ...prev, isActive: false }));
    clearAllTimers();
    
    console.log(`Order finalized via ${source}:`, orderData);
    onOrderFinalized(orderData);
  }, [onOrderFinalized, clearAllTimers]);

  const pollOrderStatus = useCallback(async () => {
    if (isFinalizedRef.current || isWebhookReceived) return;
    
    try {
      setErrorState({ hasError: false, message: '', isRetryable: true });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per request
      
      const response = await fetch(`/api/mock/orders/${orderId}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const orderData: Order = await response.json();
      setOrder(orderData);
      
      setPollingState(prev => ({
        ...prev,
        lastPollTime: Date.now(),
        retryCount: 0 // Reset retry count on successful poll
      }));

      // Check if order is finalized
      if (orderData.status === 'settled' || orderData.status === 'failed') {
        finalizeOrder(orderData, 'polling');
      }
    } catch (error) {
      if (isFinalizedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      
      setPollingState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1
      }));
      
      setErrorState({
        hasError: true,
        message: isAbortError ? 'Request timeout - retrying...' : errorMessage,
        isRetryable: true
      });
      
      console.error('Error polling order status:', error);
      
      // Stop polling after 5 consecutive failures
      if (pollingState.retryCount >= 5) {
        setErrorState({
          hasError: true,
          message: 'Multiple polling failures. Please check your connection.',
          isRetryable: true
        });
        setPollingState(prev => ({ ...prev, isActive: false }));
        clearAllTimers();
      }
    }
  }, [orderId, isWebhookReceived, pollingState.retryCount, finalizeOrder, clearAllTimers]);

  const setupWebhookListener = useCallback(() => {
    // Enhanced webhook listener with race condition handling
    const handleWebhookUpdate = (event: CustomEvent) => {
      const { order_id, status, timestamp } = event.detail;
      
      if (order_id !== orderId || isFinalizedRef.current) return;
      
      console.log('Webhook received:', { order_id, status, timestamp });
      setIsWebhookReceived(true);
      
      // Update order state immediately
      setOrder(prev => prev ? { ...prev, status, updatedAt: timestamp || new Date().toISOString() } : null);
      
      // Finalize if status indicates completion
      if (status === 'settled' || status === 'failed') {
        const updatedOrder: Order = {
          id: orderId,
          status,
          amount: order?.amount ? Number(order.amount) : 0,
          currency: order?.currency || 'ETH',
          // walletAddress: order?.walletAddress || '',
          created_at: order?.created_at || new Date().toISOString(),
          // updatedAt: timestamp || new Date().toISOString()
        };
        
        finalizeOrder(updatedOrder, 'webhook');
      }
    };

    // Listen for both custom events and potential SSE/WebSocket events
    window.addEventListener('webhook-update', handleWebhookUpdate as EventListener);
    
    // Simulate real-time connection status
    const connectionCheck = setInterval(() => {
      if (!isFinalizedRef.current) {
        // In a real app, you'd check WebSocket connection status here
        console.log('Webhook listener active, waiting for updates...');
      }
    }, 15000);
    
    return () => {
      window.removeEventListener('webhook-update', handleWebhookUpdate as EventListener);
      clearInterval(connectionCheck);
    };
  }, [orderId, order, finalizeOrder]);

  useEffect(() => {
    if (!isOpen || !orderId) {
      clearAllTimers();
      return;
    }

    // Reset state when modal opens
    isFinalizedRef.current = false;
    setTimeoutReached(false);
    setIsWebhookReceived(false);
    setErrorState({ hasError: false, message: '', isRetryable: true });
    setPollingState({ isActive: true, retryCount: 0, lastPollTime: Date.now() });

    // Start polling with exponential backoff on errors
    const startPolling = () => {
      pollOrderStatus(); // Initial poll
      pollIntervalRef.current = setInterval(() => {
        if (!isFinalizedRef.current && !isWebhookReceived) {
          pollOrderStatus();
        }
      }, 3000); // Poll every 3 seconds
    };

    startPolling();

    // Set up webhook listener
    webhookCleanupRef.current = setupWebhookListener();

    // Set timeout for 90 seconds (increased from 60 for better UX)
    timeoutTimerRef.current = setTimeout(() => {
      if (!isFinalizedRef.current) {
        setTimeoutReached(true);
        setPollingState(prev => ({ ...prev, isActive: false }));
        clearAllTimers();
      }
    }, 90000);

    return () => {
      clearAllTimers();
      setPollingState(prev => ({ ...prev, isActive: false }));
    };
  }, [isOpen, orderId, pollOrderStatus, setupWebhookListener, clearAllTimers, isWebhookReceived]);

  const handleRetry = useCallback(() => {
    // Reset all state for retry
    isFinalizedRef.current = false;
    setTimeoutReached(false);
    setOrder(null);
    setIsWebhookReceived(false);
    setErrorState({ hasError: false, message: '', isRetryable: true });
    setPollingState({ isActive: false, retryCount: 0, lastPollTime: 0 });
    
    // Clear existing timers
    clearAllTimers();
    
    // Restart the process
    setTimeout(() => {
      setPollingState({ isActive: true, retryCount: 0, lastPollTime: Date.now() });
    }, 100);
  }, [clearAllTimers]);

  const handleManualRefresh = useCallback(() => {
    if (!isFinalizedRef.current) {
      setErrorState({ hasError: false, message: '', isRetryable: true });
      pollOrderStatus();
    }
  }, [pollOrderStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          {timeoutReached ? (
            <>
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">Processing Timeout</h3>
                <p className="text-gray-600 mb-6">
                  The order processing has exceeded the maximum time limit of 90 seconds.
                  This might be due to network congestion or high transaction volume.
                </p>
                {errorState.hasError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-700 text-sm">
                      <strong>Last Error:</strong> {errorState.message}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Processing
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
              
              <h3 className="text-lg font-semibold mb-2">Processing Your Order</h3>
              <p className="text-gray-600 mb-4">Order ID: {orderId}</p>
              
              {order && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong> {order.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Amount:</strong> {order.amount} {order.currency}
                  </p>
                  {/* {order.created_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last updated: {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  )} */}
                </div>
              )}
              
              {/* Error State Display */}
              {errorState.hasError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-yellow-800 text-sm flex-1">
                      ⚠️ {errorState.message}
                    </p>
                    {errorState.isRetryable && (
                      <button
                        onClick={handleManualRefresh}
                        className="ml-2 px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                      >
                        Retry Now
                      </button>
                    )}
                  </div>
                  {pollingState.retryCount > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Retry attempt: {pollingState.retryCount}/5
                    </p>
                  )}
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {pollingState.isActive ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>🔄 Polling active (every 3s)</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span>⏸️ Polling paused</span>
                    </>
                  )}
                </div>
                
                {isWebhookReceived && (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>📡 Real-time updates active</span>
                  </div>
                )}
                
                <p>Maximum processing time: 90 seconds</p>
                
                {pollingState.lastPollTime > 0 && (
                  <p className="text-xs mt-1">
                    Last check: {new Date(pollingState.lastPollTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}