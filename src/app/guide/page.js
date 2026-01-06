// src/app/guide/page.js - Interactive Getting Started Guide
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  LayoutDashboard,
  Wallet,
  Download,
  KeyRound,
  Trophy,
  SendHorizontal,
  Rocket,
  ChevronDown,
  Check,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  CircleHelp,
  Home,
  ArrowLeft,
  Mail
} from 'lucide-react';

// Icon component mapping
const StepIcon = ({ name, className = "w-6 h-6" }) => {
  const icons = {
    userPlus: UserPlus,
    dashboard: LayoutDashboard,
    wallet: Wallet,
    download: Download,
    key: KeyRound,
    trophy: Trophy,
    send: SendHorizontal,
  };
  const Icon = icons[name];
  return Icon ? <Icon className={className} /> : null;
};

// Step data with all content
const STEPS = [
  {
    id: 1,
    title: 'Create Your Account',
    description: 'Sign up for Gambino Gold in just a few minutes',
    icon: 'userPlus',
    content: {
      intro: 'Getting started is easy. Create your account to access your personal dashboard and wallet.',
      steps: [
        'Open your browser and go to <strong>app.gambino.gold</strong>',
        'Tap <strong>"Get Started"</strong> or <strong>"Create Account"</strong>',
        'Enter your <strong>First Name</strong> and <strong>Last Name</strong>',
        'Enter your <strong>Email Address</strong> (you\'ll need to verify this)',
        'Enter your <strong>Date of Birth</strong> (must be 18+)',
        'Create a <strong>Password</strong> (at least 12 characters with a special character)',
        'Review and accept the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>',
        'Confirm you are <strong>18 years or older</strong>',
        'Tap <strong>"Create Account"</strong>',
        'Check your email inbox for the <strong>verification link</strong>',
        'Click the link to <strong>verify your email</strong> and activate your account'
      ],
      tip: 'Use a strong, unique password you don\'t use anywhere else. Consider using a password manager.',
      links: [
        { text: 'Create Account Now', href: '/onboard', primary: true }
      ]
    }
  },
  {
    id: 2,
    title: 'Explore Your Dashboard',
    description: 'Learn what you can see and do on your personal dashboard',
    icon: 'dashboard',
    content: {
      intro: 'Once logged in, your dashboard is your home base. Here\'s what you\'ll find.',
      steps: [
        'After logging in, you\'ll land on your <strong>Dashboard</strong>',
        'The <strong>Balance Section</strong> shows your token holdings (SOL, GAMBINO, USDC)',
        'Your <strong>Glück Score</strong> shows your contribution rating from mining',
        'The <strong>Tier</strong> display shows your current reward level',
        'Your <strong>Wallet Address</strong> is displayed (tap to copy)',
        'The <strong>Session</strong> section shows if you\'re checked in at a location',
        'Use the <strong>tabs</strong> to switch between Overview, Wallet, and Account'
      ],
      tip: 'Your dashboard updates automatically every 30 seconds, but you can also pull down to refresh.',
      links: [
        { text: 'Go to Dashboard', href: '/dashboard', primary: true }
      ]
    }
  },
  {
    id: 3,
    title: 'Understand Your Wallet',
    description: 'Learn the basics of crypto wallets in simple terms',
    icon: 'wallet',
    content: {
      intro: 'When you signed up, we automatically created a crypto wallet for you. Here\'s what that means.',
      steps: [
        '<strong>What is a wallet?</strong> Think of it like a digital bank account for cryptocurrency',
        '<strong>Wallet Address</strong> = Your account number. It\'s safe to share with others to receive tokens',
        '<strong>Private Key</strong> = Your secret password. NEVER share this with anyone!',
        '<strong>Recovery Phrase</strong> = A backup of your private key (12-24 words). Keep it safe!',
        'Your wallet holds <strong>GAMBINO tokens</strong>, <strong>SOL</strong> (for fees), and other tokens',
        'You can view your wallet address on the <strong>Dashboard → Wallet tab</strong>',
        'Tokens you earn will automatically appear in your wallet'
      ],
      warning: 'Never share your private key or recovery phrase with anyone. Gambino staff will NEVER ask for these. Anyone who has your private key can take all your tokens.',
      tip: 'Write down your recovery phrase and store it somewhere safe offline, like a safe or lockbox.',
      links: [
        { text: 'View Your Wallet', href: '/dashboard?tab=wallet', primary: true }
      ]
    }
  },
  {
    id: 4,
    title: 'Install Phantom Wallet',
    description: 'Set up Phantom to manage your tokens on other apps',
    icon: 'download',
    content: {
      intro: 'Phantom is a popular wallet app that lets you manage your crypto across different apps and websites. This step is optional but recommended.',
      steps: [
        '<strong>Why Phantom?</strong> It lets you use your GAMBINO tokens outside our app',
        'Download Phantom from the <strong>App Store</strong> (iPhone) or <strong>Google Play</strong> (Android)',
        'You can also use the <strong>browser extension</strong> on Chrome, Firefox, or Brave',
        'Open Phantom and tap <strong>"I already have a wallet"</strong>',
        'Choose <strong>"Import Private Key"</strong> (we\'ll do this in the next step)',
        'Alternatively, you can create a new Phantom wallet and transfer tokens to it later'
      ],
      tip: 'Only download Phantom from the official app stores or phantom.app. There are fake copies that will steal your tokens!',
      links: [
        { text: 'Phantom for iPhone', href: 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977', external: true },
        { text: 'Phantom for Android', href: 'https://play.google.com/store/apps/details?id=app.phantom', external: true },
        { text: 'Phantom Browser Extension', href: 'https://phantom.app/download', external: true }
      ]
    }
  },
  {
    id: 5,
    title: 'Import Your Wallet to Phantom',
    description: 'Connect your Gambino wallet to Phantom for full control',
    icon: 'key',
    content: {
      intro: 'Import your Gambino wallet into Phantom so you can manage your tokens anywhere.',
      steps: [
        'In the Gambino app, go to <strong>Dashboard → Wallet tab</strong>',
        'Tap <strong>"Show Private Key"</strong> (you may need to enter your password)',
        'Carefully <strong>copy the private key</strong> (it\'s a long string of characters)',
        'Open <strong>Phantom</strong> on your device',
        'Tap the <strong>menu icon</strong> (three lines or your profile)',
        'Go to <strong>Settings → Add/Connect Wallet</strong>',
        'Choose <strong>"Import Private Key"</strong>',
        '<strong>Paste</strong> your private key and tap <strong>Import</strong>',
        'Your Gambino wallet is now accessible in Phantom!'
      ],
      warning: 'Only import your private key into apps you trust. Never paste it into websites or send it to anyone.',
      tip: 'After importing, you\'ll see the same wallet address and balances in both the Gambino app and Phantom.',
      links: [
        { text: 'Go to Wallet Settings', href: '/dashboard?tab=wallet', primary: true }
      ]
    }
  },
  {
    id: 6,
    title: 'Start Earning Tokens',
    description: 'Visit partner locations to earn GAMBINO and build your Glück Score',
    icon: 'trophy',
    content: {
      intro: 'Now for the fun part! Here\'s how you earn GAMBINO tokens and climb the ranks.',
      steps: [
        'Visit a <strong>Gambino partner location</strong>',
        'Use machines connected to the <strong>Gambino network</strong>',
        'Your activity earns you <strong>Glück Score</strong> (contribution points)',
        'Your <strong>Tier</strong> is determined by your Glück Score',
        '<strong>Tier progression:</strong> None → Tier 3 → Tier 2 → Tier 1',
        'Higher tiers earn <strong>better mining rewards</strong> and distributions',
        'Check the <strong>Leaderboard</strong> to see how you rank against others'
      ],
      tip: 'Visiting different locations can help boost your Glück Score faster!',
      links: [
        { text: 'View Leaderboard', href: '/leaderboard', primary: true },
        { text: 'Check Network Status', href: '/network' }
      ]
    }
  },
  {
    id: 7,
    title: 'Withdraw & Use Your Tokens',
    description: 'Learn how to send, trade, and use your GAMBINO tokens',
    icon: 'send',
    content: {
      intro: 'Your earned tokens are yours to keep. Here\'s what you can do with them.',
      steps: [
        'Your tokens appear in your <strong>Dashboard balance</strong> automatically',
        'To send tokens to another wallet, you\'ll need <strong>Phantom</strong> set up (Step 5)',
        'In Phantom, tap <strong>Send</strong> and enter the recipient\'s wallet address',
        'You\'ll need a small amount of <strong>SOL</strong> to pay transaction fees',
        'GAMBINO tokens can be held, sent, or traded',
        '<strong>Coming soon:</strong> More ways to use GAMBINO in the ecosystem'
      ],
      tip: 'Always double-check wallet addresses before sending. Crypto transactions cannot be reversed!',
      warning: 'Keep some SOL in your wallet for transaction fees. Without SOL, you won\'t be able to send tokens.',
      links: [
        { text: 'View Your Balance', href: '/dashboard', primary: true },
        { text: 'Get Help', href: '/help' }
      ]
    }
  }
];

export default function GuidePage() {
  const [expandedStep, setExpandedStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Load progress from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gambino_guide_progress');
      if (saved) {
        try {
          setCompletedSteps(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse guide progress:', e);
        }
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && completedSteps.length > 0) {
      localStorage.setItem('gambino_guide_progress', JSON.stringify(completedSteps));
    }
  }, [completedSteps]);

  const toggleStep = (stepId) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const toggleComplete = (stepId, e) => {
    e.stopPropagation();
    setCompletedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const progressPercent = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <div className="min-h-screen relative">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 relative z-10">

        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl">
                <Rocket className="w-10 h-10 text-black" />
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-3xl blur-xl"></div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Getting Started
            </span>
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Your complete guide from signup to earning rewards. Follow these steps to get the most out of Gambino Gold.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-300">Your Progress</span>
            <span className="text-sm font-bold text-yellow-400">{completedSteps.length} of {STEPS.length} completed</span>
          </div>
          <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent === 100 && (
            <p className="text-green-400 text-sm mt-2 text-center font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Congratulations! You've completed the guide!
            </p>
          )}
        </div>

        {/* Step Cards */}
        <div className="space-y-4">
          {STEPS.map((step) => {
            const isExpanded = expandedStep === step.id;
            const isCompleted = completedSteps.includes(step.id);

            return (
              <div
                key={step.id}
                className={`bg-neutral-900/50 border rounded-xl overflow-hidden transition-all duration-300 ${
                  isCompleted ? 'border-green-500/50' : 'border-neutral-800'
                }`}
              >
                {/* Step Header */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full p-4 md:p-5 flex items-center gap-4 hover:bg-neutral-800/30 transition-colors text-left"
                >
                  {/* Completion Checkbox */}
                  <div
                    onClick={(e) => toggleComplete(step.id, e)}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-neutral-600 hover:border-yellow-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-neutral-500 font-bold text-sm">{step.id}</span>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-yellow-400">
                    <StepIcon name={step.icon} className="w-5 h-5" />
                  </div>

                  {/* Title & Description */}
                  <div className="flex-grow min-w-0">
                    <h3 className={`font-bold text-lg ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    <p className="text-neutral-400 text-sm truncate">{step.description}</p>
                  </div>

                  {/* Expand Arrow */}
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 md:px-5 pb-5 border-t border-neutral-800">
                    <div className="pt-4">
                      {/* Intro */}
                      <p className="text-neutral-300 mb-4">{step.content.intro}</p>

                      {/* Steps List */}
                      <div className="space-y-3 mb-4">
                        {step.content.steps.map((instruction, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                              {idx + 1}
                            </div>
                            <p
                              className="text-neutral-300 text-sm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: instruction }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Warning Box */}
                      {step.content.warning && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm">{step.content.warning}</p>
                          </div>
                        </div>
                      )}

                      {/* Tip Box */}
                      {step.content.tip && (
                        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-yellow-200 text-sm">{step.content.tip}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Links */}
                      {step.content.links && step.content.links.length > 0 && (
                        <div className="flex flex-wrap gap-3 mt-4">
                          {step.content.links.map((link, idx) => (
                            link.external ? (
                              <a
                                key={idx}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                  link.primary
                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-500 hover:to-amber-600'
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }`}
                              >
                                {link.text}
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <Link
                                key={idx}
                                href={link.href}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                  link.primary
                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-500 hover:to-amber-600'
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }`}
                              >
                                {link.text}
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            )
                          ))}
                        </div>
                      )}

                      {/* Mark Complete Button */}
                      <div className="mt-5 pt-4 border-t border-neutral-800">
                        <button
                          onClick={(e) => toggleComplete(step.id, e)}
                          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                            isCompleted
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          }`}
                        >
                          {isCompleted ? <><Check className="w-4 h-4" /> Completed</> : 'Mark as Complete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Section */}
        <div className="mt-10 text-center">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Need More Help?</h3>
            <p className="text-neutral-400 text-sm mb-4">
              Check out our Help Center for answers to common questions, or reach out to support.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/help"
                className="px-5 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg font-medium hover:bg-neutral-700 transition-colors inline-flex items-center gap-2"
              >
                <CircleHelp className="w-4 h-4" />
                Help Center
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-lg font-medium hover:from-yellow-500 hover:to-amber-600 transition-all inline-flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Dashboard
              </Link>
              <a
                href="mailto:support@gambino.gold"
                className="px-5 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg font-medium hover:bg-neutral-700 transition-colors inline-flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-yellow-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
