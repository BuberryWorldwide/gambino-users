// src/app/help/page.js - Simplified Help & Documentation (no theme provider required)
'use client';

import { useState } from 'react';

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'account', title: 'Account Management', icon: '👤' },
    { id: 'mining', title: 'Mining & Tokens', icon: '⛏️' },
    { id: 'technical', title: 'Technical Support', icon: '🔧' },
    { id: 'faq', title: 'FAQ', icon: '❓' }
  ];

  const faqItems = [
    {
      question: "What is Gambino Gold?",
      answer: "Gambino Gold is a community-powered cryptocurrency mining infrastructure platform that provides licensed technology to implementation partners while offering utility token access to participants."
    },
    {
      question: "How do I create an account?",
      answer: "Click 'Get Started' on the home page or visit /onboard. You'll need to provide basic information and agree to our terms of service. The process takes less than 2 minutes."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption and security practices. Your personal data is protected, and we never share sensitive information with third parties."
    },
    {
      question: "How do I generate a wallet?",
      answer: "Once logged in, visit your Dashboard and click 'Generate Wallet'. This creates a secure Solana wallet that you can use to receive tokens and participate in the network."
    },
    {
      question: "What if I lose access to my account?",
      answer: "Use the 'Reset Password' link on the login page. If you have other issues, contact our support team through the help section."
    },
    {
      question: "How can I contact support?",
      answer: "You can reach our support team through this help center or by emailing support@gambino.gold. We typically respond within 24 hours."
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Welcome to Gambino Gold</h2>
              <p className="mb-4 text-neutral-300">
                Get started with our cryptocurrency mining infrastructure platform in just a few simple steps.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black bg-yellow-500">1</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white">Create Your Account</h3>
                    <p className="text-neutral-300">Sign up with your email and create a secure password. This gives you access to the mining network.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black bg-yellow-500">2</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white">Access Your Dashboard</h3>
                    <p className="text-neutral-300">View your account status, balance, and network activity from your personalized dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black bg-yellow-500">3</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white">Generate a Wallet</h3>
                    <p className="text-neutral-300">Create a secure cryptocurrency wallet to receive tokens and participate in network governance.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black bg-yellow-500">4</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white">Explore the Network</h3>
                    <p className="text-neutral-300">Check network status, monitor your activity, and participate in community governance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Account Management</h2>
              <p className="mb-4 text-neutral-300">
                Learn how to manage your Gambino Gold account, security settings, and profile information.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Profile Settings</h3>
                <p className="mb-4 text-neutral-300">
                  Update your personal information, contact details, and preferences from the Account page.
                </p>
                <ul className="space-y-2 text-neutral-400">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Change your name and contact information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Update your password regularly for security</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Manage notification preferences</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Security Best Practices</h3>
                <ul className="space-y-2 text-neutral-400">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Use a strong, unique password</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Keep your wallet private key secure</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Never share your login credentials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Log out from shared devices</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'mining':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Mining & Tokens</h2>
              <p className="mb-4 text-neutral-300">
                Understand how the Gambino Gold mining infrastructure works and how to participate.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">How Mining Works</h3>
                <p className="mb-4 text-neutral-300">
                  Gambino Gold operates a licensed mining infrastructure that creates utility tokens for network participants and implementation partners.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Token Utility</h3>
                <ul className="space-y-2 text-neutral-400">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Access to mining infrastructure features</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Participation in community governance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Network utility and transaction fees</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Wallet Management</h3>
                <p className="mb-4 text-neutral-300">
                  Your Gambino Gold account can generate a secure cryptocurrency wallet for token storage and transfers.
                </p>
                <ul className="space-y-2 text-neutral-400">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Generate wallet from your dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Backup your private key securely</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Monitor your balance and transactions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Technical Support</h2>
              <p className="mb-4 text-neutral-300">
                Troubleshooting guides and technical information for common issues.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Common Issues</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-neutral-800/50">
                    <h4 className="font-semibold mb-2 text-white">Can't log in</h4>
                    <p className="text-neutral-300">Use the "Reset Password" link or clear your browser cache and try again.</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-neutral-800/50">
                    <h4 className="font-semibold mb-2 text-white">Wallet not generating</h4>
                    <p className="text-neutral-300">Ensure you're connected to the internet and try refreshing the page. Contact support if the issue persists.</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-neutral-800/50">
                    <h4 className="font-semibold mb-2 text-white">Page loading slowly</h4>
                    <p className="text-neutral-300">Check the network status page for any ongoing issues or try a different internet connection.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Browser Requirements</h3>
                <ul className="space-y-2 text-neutral-400">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Modern browser (Chrome, Firefox, Safari, Edge)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>JavaScript enabled</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-yellow-500"></div>
                    <span>Stable internet connection</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-white">Contact Support</h3>
                <p className="mb-4 text-neutral-300">
                  If you can't find the answer to your question, our support team is here to help.
                </p>
                <div className="p-4 rounded-xl border bg-yellow-500/10 border-yellow-500/20">
                  <p className="font-semibold mb-2 text-white">Email Support</p>
                  <p className="text-yellow-400 font-mono">support@gambino.gold</p>
                  <p className="text-sm mt-1 text-neutral-400">We typically respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
              <p className="mb-4 text-neutral-300">
                Quick answers to the most common questions about Gambino Gold.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="border rounded-xl border-neutral-700 bg-neutral-800/50">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full text-left p-4 flex items-center justify-between hover:bg-neutral-700/50 transition-colors rounded-xl"
                  >
                    <span className="font-semibold text-white">{item.question}</span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${expandedFaq === index ? 'rotate-180' : ''} text-yellow-400`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4">
                      <p className="text-neutral-300">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-neutral-100 relative overflow-hidden">
      
      {/* Your existing background effects */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 md:opacity-60">
        <div className="absolute top-10 left-[10%] w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-400/20 md:bg-yellow-400/30 rounded-full animate-pulse delay-0"></div>
        <div className="absolute top-20 right-[15%] w-1 h-1 md:w-1.5 md:h-1.5 bg-amber-300/25 md:bg-amber-300/40 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-[30%] left-[20%] w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-yellow-500/15 md:bg-yellow-500/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-[60%] left-[30%] w-1 h-1 md:w-1.5 md:h-1.5 bg-yellow-300/20 md:bg-yellow-300/30 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-[15%] w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-amber-500/20 md:bg-amber-500/30 rounded-full animate-pulse delay-2500"></div>
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Help & <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">Documentation</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-neutral-300">
            Everything you need to know about using Gambino Gold mining infrastructure platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 backdrop-blur-sm rounded-2xl p-8 border border-neutral-800 bg-neutral-900/50">
              <h3 className="font-bold mb-4 text-white">Topics</h3>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                        activeSection === section.id
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-700/50'
                      }`}
                    >
                      <span>{section.icon}</span>
                      <span className="font-medium">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-sm rounded-2xl p-8 border border-neutral-800 bg-neutral-900/50">
              {renderContent()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}