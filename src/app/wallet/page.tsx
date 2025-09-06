'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

interface WalletInfo {
  name: string;
  description: string;
  icon: string;
  isInstalled?: boolean;
  downloadUrl?: string;
}

const supportedWallets: WalletInfo[] = [
  {
    name: 'MetaMask',
    description: 'Connect using browser extension',
    icon: '🦊',
    downloadUrl: 'https://metamask.io/download/'
  },
  {
    name: 'WalletConnect',
    description: 'Scan with mobile wallet',
    icon: '📱',
  },
  {
    name: 'Coinbase Wallet',
    description: 'Connect with Coinbase',
    icon: '🔵',
    downloadUrl: 'https://www.coinbase.com/wallet'
  },
  {
    name: 'Rainbow',
    description: 'Fun, simple, and secure',
    icon: '🌈',
    downloadUrl: 'https://rainbow.me/'
  }
];

export default function WalletPage() {
  const router = useRouter();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error, status  } = useConnect();
  const isPending = status == 'pending'
    const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Auto-redirect to home page after successful connection
    if (isConnected && mounted) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallet Connected!</h1>
          <p className="text-gray-600 mb-6">
            Successfully connected to your wallet
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Connected Address:</p>
            <p className="font-mono text-sm text-gray-900 break-all">
              {address}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue to App
            </button>
            <button
              onClick={() => disconnect()}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ElementPay</span>
            </Link>
            
            <nav className="flex space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                Docs
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your preferred wallet to start making secure cryptocurrency payments with ElementPay
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Primary Connection */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Quick Connect
            </h2>
            
            <div className="space-y-4">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted: rainbowMounted,
                }) => {
                  const ready = rainbowMounted && authenticationStatus !== 'loading';
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === 'authenticated');

                  return (
                    <div>
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              disabled={isConnecting || isPending}
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                              {isConnecting || isPending ? (
                                <>
                                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                  <span>Connecting...</span>
                                </>
                              ) : (
                                <>
                                  <span>🔗</span>
                                  <span>Connect Wallet</span>
                                </>
                              )}
                            </button>
                          );
                        }

                        return (
                          <div className="flex gap-3">
                            <button
                              onClick={openAccountModal}
                              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              {account.displayName}
                            </button>
                            {chain.unsupported && (
                              <button
                                onClick={openChainModal}
                                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Wrong network
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">
                    <strong>Connection Error:</strong> {error.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Options */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Supported Wallets
            </h2>
            
            <div className="space-y-3">
              {supportedWallets.map((wallet) => (
                <div
                  key={wallet.name}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{wallet.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                      <p className="text-sm text-gray-600">{wallet.description}</p>
                    </div>
                  </div>
                  
                  {wallet.downloadUrl && (
                    <a
                      href={wallet.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Install
                    </a>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full mt-6 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    // disabled={isPending && pendingConnector?.id === connector.id}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{connector.name}</span>
                      {/* {isPending && pendingConnector?.id === connector.id && (
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      )} */}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-600 text-xl">🔒</span>
            <div>
              <h3 className="font-medium text-yellow-900 mb-2">Security Notice</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Only connect wallets you trust and control</li>
                <li>• Never share your private keys or seed phrases</li>
                <li>• Always verify the website URL before connecting</li>
                <li>• ElementPay will never ask for your private keys</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Need help setting up a wallet?</p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://metamask.io/faqs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              MetaMask Guide
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="https://docs.walletconnect.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              WalletConnect Docs
            </a>
            <span className="text-gray-400">•</span>
            <Link href="/docs" className="text-blue-600 hover:text-blue-700 font-medium">
              ElementPay Docs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}