// src/app/help/page.js - Enhanced to match home page styling
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Welcome to Gambino Gold
              </h2>
              <p className="mb-4 text-neutral-300 text-lg">
                Get started with our cryptocurrency mining infrastructure platform in just a few simple steps.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm hover:bg-neutral-800/70 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">1</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white text-lg group-hover:text-yellow-400 transition-colors">Create Your Account</h3>
                    <p className="text-neutral-300 group-hover:text-neutral-200 transition-colors">Sign up with your email and create a secure password. This gives you access to the mining network.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm hover:bg-neutral-800/70 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">2</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white text-lg group-hover:text-yellow-400 transition-colors">Access Your Dashboard</h3>
                    <p className="text-neutral-300 group-hover:text-neutral-200 transition-colors">View your account status, balance, and network activity from your personalized dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm hover:bg-neutral-800/70 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">3</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white text-lg group-hover:text-yellow-400 transition-colors">Generate a Wallet</h3>
                    <p className="text-neutral-300 group-hover:text-neutral-200 transition-colors">Create a secure cryptocurrency wallet to receive tokens and participate in network governance.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm hover:bg-neutral-800/70 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300">4</div>
                  <div>
                    <h3 className="font-bold mb-2 text-white text-lg group-hover:text-yellow-400 transition-colors">Explore the Network</h3>
                    <p className="text-neutral-300 group-hover:text-neutral-200 transition-colors">Check network status, monitor your activity, and participate in community governance.</p>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Account Management
              </h2>
              <p className="mb-4 text-neutral-300 text-lg">
                Learn how to manage your Gambino Gold account, security settings, and profile information.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Profile Settings
                </h3>
                <p className="mb-4 text-neutral-300">
                  Update your personal information, contact details, and preferences from the Account page.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Change your name and contact information</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Update your password regularly for security</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Manage notification preferences</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  Security Best Practices
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Use a strong, unique password</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Keep your wallet private key secure</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Never share your login credentials</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Log out from shared devices</span>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Mining & Tokens
              </h2>
              <p className="mb-4 text-neutral-300 text-lg">
                Understand how the Gambino Gold mining infrastructure works and how to participate.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  How Mining Works
                </h3>
                <p className="text-neutral-300">
                  Gambino Gold operates a licensed mining infrastructure that creates utility tokens for network participants and implementation partners.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  Token Utility
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Access to mining infrastructure features</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Participation in community governance</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Network utility and transaction fees</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  Wallet Management
                </h3>
                <p className="mb-4 text-neutral-300">
                  Your Gambino Gold account can generate a secure cryptocurrency wallet for token storage and transfers.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Generate wallet from your dashboard</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Backup your private key securely</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Monitor your balance and transactions</span>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Technical Support
              </h2>
              <p className="mb-4 text-neutral-300 text-lg">
                Troubleshooting guides and technical information for common issues.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  Common Issues
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-neutral-700/30 border border-neutral-600/30">
                    <h4 className="font-semibold mb-2 text-white">Can't log in</h4>
                    <p className="text-neutral-300">Use the "Reset Password" link or clear your browser cache and try again.</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-neutral-700/30 border border-neutral-600/30">
                    <h4 className="font-semibold mb-2 text-white">Wallet not generating</h4>
                    <p className="text-neutral-300">Ensure you're connected to the internet and try refreshing the page. Contact support if the issue persists.</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-neutral-700/30 border border-neutral-600/30">
                    <h4 className="font-semibold mb-2 text-white">Page loading slowly</h4>
                    <p className="text-neutral-300">Check the network status page for any ongoing issues or try a different internet connection.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Browser Requirements
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Modern browser (Chrome, Firefox, Safari, Edge)</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">JavaScript enabled</span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                    <span className="text-neutral-300">Stable internet connection</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-600/10 border border-yellow-500/20 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Contact Support
                </h3>
                <p className="mb-4 text-neutral-300">
                  If you can't find the answer to your question, our support team is here to help.
                </p>
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="font-semibold mb-2 text-white">Email Support</p>
                  <p className="text-yellow-400 font-mono text-lg">support@gambino.gold</p>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="mb-4 text-neutral-300 text-lg">
                Quick answers to the most common questions about Gambino Gold.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="border rounded-xl border-neutral-700/50 bg-neutral-800/50 backdrop-blur-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full text-left p-6 flex items-center justify-between hover:bg-neutral-700/30 transition-all duration-300 group"
                  >
                    <span className="font-semibold text-white text-lg group-hover:text-yellow-400 transition-colors">{item.question}</span>
                    <svg
                      className={`w-6 h-6 transform transition-all duration-300 flex-shrink-0 ml-4 ${
                        expandedFaq === index 
                          ? 'rotate-180 text-yellow-400' 
                          : 'text-neutral-400 group-hover:text-yellow-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6 border-t border-neutral-700/30">
                      <div className="pt-4">
                        <p className="text-neutral-300 leading-relaxed">{item.answer}</p>
                      </div>
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
      
      {/* Enhanced background effects - matching home page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Mobile-optimized floating particles */}
        <div className="absolute top-16 left-[8%] w-2 h-2 md:w-3 md:h-3 bg-yellow-400/30 md:bg-yellow-400/50 rounded-full animate-pulse delay-0"></div>
        <div className="absolute top-32 right-[12%] w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-300/40 md:bg-amber-300/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-[25%] left-[15%] w-2.5 h-2.5 md:w-4 md:h-4 bg-yellow-500/25 md:bg-yellow-500/40 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-[45%] right-[20%] w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-300/30 md:bg-yellow-300/50 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-[65%] left-[25%] w-2 h-2 md:w-3 md:h-3 bg-amber-400/35 md:bg-amber-400/55 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-32 right-[10%] w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-500/30 md:bg-yellow-500/45 rounded-full animate-pulse delay-2500"></div>
        <div className="absolute bottom-16 left-[18%] w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-amber-500/30 md:bg-amber-500/40 rounded-full animate-pulse delay-4000"></div>
        
        {/* Micro sparkles */}
        <div className="absolute top-[20%] left-[50%] w-1 h-1 bg-yellow-200/50 md:bg-yellow-200/70 rounded-full animate-ping" style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
        <div className="absolute top-[60%] right-[40%] w-1 h-1 bg-amber-200/50 md:bg-amber-200/70 rounded-full animate-ping" style={{animationDuration: '2.5s', animationDelay: '1.2s'}}></div>
        <div className="absolute bottom-[25%] left-[60%] w-1 h-1 bg-yellow-100/60 md:bg-yellow-100/80 rounded-full animate-ping" style={{animationDuration: '3.5s', animationDelay: '2.1s'}}></div>
      </div>

      {/* Enhanced gradient backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-br from-yellow-500/15 md:from-yellow-500/20 to-amber-600/8 md:to-amber-600/12 rounded-full blur-2xl md:blur-3xl transform translate-x-20 -translate-y-20 md:translate-x-32 md:-translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-80 md:h-80 bg-gradient-to-tr from-amber-600/18 md:from-amber-600/25 to-yellow-500/10 md:to-yellow-500/15 rounded-full blur-2xl md:blur-3xl transform -translate-x-16 translate-y-16 md:-translate-x-24 md:translate-y-24"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-yellow-400/12 md:from-yellow-400/18 to-transparent rounded-full blur-xl md:blur-2xl"></div>
        <div className="absolute top-1/4 left-1/4 w-40 h-40 md:w-48 md:h-48 bg-gradient-to-tr from-amber-500/15 md:from-amber-500/20 to-transparent rounded-full blur-lg md:blur-xl"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.08] md:opacity-[0.15]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(234, 179, 8, 0.3) 1px, transparent 0)',
            backgroundSize: '50px 50px md:80px 80px'
          }}></div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-24 h-24 md:w-32 md:h-32 border border-yellow-500/15 md:border-yellow-500/25 rounded-lg rotate-45 animate-spin" style={{animationDuration: '25s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-20 h-20 md:w-24 md:h-24 border border-amber-400/20 md:border-amber-400/30 rounded-full animate-ping" style={{animationDuration: '5s'}}></div>
        <div className="absolute top-3/4 left-2/3 w-16 h-16 md:w-20 md:h-20 border-2 border-yellow-300/18 md:border-yellow-300/25 rounded-lg rotate-12 animate-pulse" style={{animationDuration: '6s'}}></div>
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:py-16">
        
        {/* Header with logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl p-2">
                <span className="text-2xl md:text-3xl font-bold text-black">G</span>
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl"></div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Help & <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Documentation</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Everything you need to know about using Gambino Gold mining infrastructure platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-8 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-neutral-800 bg-neutral-900/50 shadow-2xl">
              <h3 className="font-bold mb-6 text-white text-lg">Topics</h3>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                        activeSection === section.id
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-700/30 border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span className="font-medium">{section.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-neutral-800 bg-neutral-900/50 shadow-2xl">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Navigation back to home */}
        <div className="text-center mt-12">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-yellow-400 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </section>
    </div>
  );
}