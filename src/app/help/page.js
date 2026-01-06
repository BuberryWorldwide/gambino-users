'use client';

import { useState } from 'react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  const helpItems = [
    {
      id: 'connect-wallet',
      title: 'How do I connect my wallet?',
      category: 'Wallet',
      content: (
        <div className="space-y-4">
          <p>Go to <strong>Dashboard → Wallet</strong> and click <strong>Connect Wallet</strong>.</p>
          <p>You'll need the Phantom browser extension or mobile app installed. When prompted, approve the connection in Phantom.</p>
          <p className="text-sm text-neutral-500">Don't have Phantom? Download it at <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">phantom.app</a></p>
        </div>
      )
    },
    {
      id: 'create-wallet',
      title: 'How do I create a new wallet?',
      category: 'Wallet',
      content: (
        <div className="space-y-4">
          <p>Go to <strong>Dashboard → Wallet</strong> and click <strong>Create New Wallet</strong>.</p>
          <p>You'll get a 12-word recovery phrase. <strong>Write it down on paper</strong> and store it somewhere safe. This is the only way to recover your wallet.</p>
          <p>After creating, import the recovery phrase into Phantom to manage your wallet.</p>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
            Never share your recovery phrase with anyone. We will never ask for it.
          </div>
        </div>
      )
    },
    {
      id: 'send-tokens',
      title: 'How do I send tokens?',
      category: 'Wallet',
      content: (
        <div className="space-y-4">
          <p>To send tokens, use the <strong>Phantom app</strong> directly. We display your balances but don't handle transactions.</p>
          <ol className="list-decimal list-inside space-y-2 text-neutral-300">
            <li>Open Phantom</li>
            <li>Select the token you want to send</li>
            <li>Tap Send and enter the recipient's address</li>
            <li>Confirm the transaction</li>
          </ol>
        </div>
      )
    },
    {
      id: 'lost-phrase',
      title: 'I lost my recovery phrase / private key',
      category: 'Wallet',
      content: (
        <div className="space-y-4">
          <p>If you've lost access to your wallet credentials and don't have it in Phantom, <strong>there is no way to recover it</strong>.</p>
          <p>We do not store private keys or recovery phrases. Your wallet and any tokens in it are permanently inaccessible.</p>
          <p>You can link a different wallet to your account from the Wallet tab.</p>
        </div>
      )
    },
    {
      id: 'change-wallet',
      title: 'Can I change my linked wallet?',
      category: 'Wallet',
      content: (
        <div className="space-y-4">
          <p>Yes. Go to <strong>Dashboard → Wallet</strong> and click <strong>Link Different Wallet</strong>.</p>
          <p>Note: Any tokens in your previous wallet stay there. We only link your wallet address to your account — we don't move funds.</p>
        </div>
      )
    },
    {
      id: 'reset-password',
      title: 'How do I reset my password?',
      category: 'Account',
      content: (
        <div className="space-y-4">
          <p>Click <strong>Forgot Password</strong> on the login page and enter your email.</p>
          <p>You'll receive a link to set a new password. The link expires after 1 hour.</p>
        </div>
      )
    },
    {
      id: 'update-profile',
      title: 'How do I update my profile?',
      category: 'Account',
      content: (
        <div className="space-y-4">
          <p>Go to <strong>Dashboard → Account</strong> and click <strong>Edit</strong> next to your profile information.</p>
          <p>You can update your name and phone number. Email cannot be changed.</p>
        </div>
      )
    },
    {
      id: 'gluck-score',
      title: 'What is Glück Score?',
      category: 'Platform',
      content: (
        <div className="space-y-4">
          <p>Glück Score is your activity rating on the platform. It increases based on your participation and mining contributions.</p>
          <p>Higher scores unlock better tiers with additional benefits.</p>
        </div>
      )
    },
    {
      id: 'session',
      title: 'What does "Active Session" mean?',
      category: 'Platform',
      content: (
        <div className="space-y-4">
          <p>An active session means you're currently mining at one of our partner locations.</p>
          <p>You can end your session anytime from the Dashboard. Sessions also end automatically when you leave.</p>
        </div>
      )
    },
    {
      id: 'contact',
      title: 'How do I contact support?',
      category: 'Support',
      content: (
        <div className="space-y-4">
          <p>Email us at <a href="mailto:support@gambino.gold" className="text-yellow-500 hover:underline">support@gambino.gold</a></p>
          <p className="text-sm text-neutral-500">We typically respond within 24 hours.</p>
        </div>
      )
    }
  ];

  const categories = [...new Set(helpItems.map(item => item.category))];

  const filteredItems = searchQuery
    ? helpItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : helpItems;

  const groupedItems = categories.reduce((acc, category) => {
    const items = filteredItems.filter(item => item.category === category);
    if (items.length > 0) {
      acc[category] = items;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen text-white relative">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-10">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </a>

          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-neutral-400">Find answers to common questions</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Help Items */}
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No results found for "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-yellow-500 hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-3">{category}</h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                      >
                        <span className="font-medium">{item.title}</span>
                        <svg
                          className={`w-5 h-5 text-neutral-500 transition-transform ${expandedItem === item.id ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedItem === item.id && (
                        <div className="px-5 pb-5 text-neutral-300 border-t border-neutral-800">
                          <div className="pt-4">
                            {item.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-800">
          <div className="text-center">
            <p className="text-neutral-400 mb-2">Can't find what you're looking for?</p>
            <a
              href="mailto:support@gambino.gold"
              className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
