// src/app/onboard/page.js - Enhanced to match home page styling
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1: Personal info
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    password: '',
    // Step 2: Legal agreements
    agreedToTerms: false,
    agreedToPrivacy: false,
    agreedToMarketing: false,
    readWhitepaper: false
  });

  const router = useRouter();

  const nextStep = async () => {
    setError('');
    try {
      if (step === 1) {
        // STEP 1: Validate form first
        if (!form.firstName.trim() || !form.lastName.trim() || 
            !form.email.trim() || !form.password) {
          setError('Please fill in all required fields');
          return;
        }
        
        if (form.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        
        setStep(2);

      } else if (step === 2) {
        // STEP 2: Terms & Privacy validation
        if (!form.agreedToTerms) { 
          setError('You must agree to the Terms of Service'); 
          return; 
        }
        if (!form.agreedToPrivacy) { 
          setError('You must agree to the Privacy Policy'); 
          return; 
        }

        setLoading(true);
        
        // REGISTER USER (using existing backend endpoint)
        try {
          const { data } = await api.post('/api/users/register', {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            password: form.password
          });
          
          // Registration successful, set token and redirect
          if (data.accessToken) {
            setToken(data.accessToken);
            setStep(3);
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setError('Registration completed but no access token received');
          }
        } catch (registerError) {
          console.error('Registration failed:', registerError);
          setError(registerError.response?.data?.error || 'Registration failed. Please try again.');
        }
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to continue');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

      <div className="mx-auto max-w-2xl px-4 py-8 relative z-10">
        
        {/* Header with logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-2xl p-2">
                <span className="text-2xl md:text-3xl font-bold text-black">G</span>
              </div>
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl"></div>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Welcome to GAMBINO
            </span>
          </h1>
          <p className="text-lg text-neutral-300">Join the mining network</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-3">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  step >= i 
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/25' 
                    : 'bg-neutral-600'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-900/20 backdrop-blur-sm">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* STEP 1: Personal Information */}
        {step === 1 && (
          <div className="backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-6">
              Personal Information
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => updateForm('firstName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => updateForm('lastName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 backdrop-blur-sm"
                  placeholder="Password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={loading || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password}
              className="w-full mt-8 inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </div>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Legal Agreements */}
        {step === 2 && (
          <div className="backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-6">
              Legal Agreements
            </h2>
            
            <div className="space-y-6">
              {/* Required agreements */}
              <div className="p-6 bg-neutral-800/30 rounded-xl border border-neutral-700/50 backdrop-blur-sm">
                <h3 className="font-semibold text-neutral-200 mb-4 flex items-center gap-2">
                  <span className="text-red-400">*</span>
                  Required
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.agreedToTerms}
                      onChange={e => updateForm('agreedToTerms', e.target.checked)}
                      className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50 focus:ring-2"
                    />
                    <span className="text-sm text-neutral-300 group-hover:text-neutral-200 transition-colors">
                      I agree to the <a href="https://gambino.gold/legal/terms" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline">Terms of Service</a>
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.agreedToPrivacy}
                      onChange={e => updateForm('agreedToPrivacy', e.target.checked)}
                      className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50 focus:ring-2"
                    />
                    <span className="text-sm text-neutral-300 group-hover:text-neutral-200 transition-colors">
                      I agree to the <a href="https://gambino.gold/legal/privacy" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline">Privacy Policy</a>
                    </span>
                  </label>
                </div>
              </div>

              {/* Optional agreements */}
              <div className="p-6 bg-neutral-800/20 rounded-xl border border-neutral-700/30 backdrop-blur-sm">
                <h3 className="font-semibold text-neutral-200 mb-4">Optional</h3>
                
                <div className="space-y-4">
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.agreedToMarketing}
                      onChange={e => updateForm('agreedToMarketing', e.target.checked)}
                      className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50 focus:ring-2"
                    />
                    <span className="text-sm text-neutral-300 group-hover:text-neutral-200 transition-colors">
                      I want to receive updates and marketing communications
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.readWhitepaper}
                      onChange={e => updateForm('readWhitepaper', e.target.checked)}
                      className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50 focus:ring-2"
                    />
                    <span className="text-sm text-neutral-300 group-hover:text-neutral-200 transition-colors">
                      I have read the whitepaper and understand the tokenomics
                    </span>
                  </label>
                </div>
              </div>

              {/* Info Links */}
              <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20 backdrop-blur-sm">
                <p className="text-sm text-neutral-400 mb-2">For complete documentation:</p>
                <a 
                  href="/info" 
                  target="_blank" 
                  className="text-yellow-400 hover:text-yellow-300 text-sm underline transition-colors"
                >
                  View Whitepaper, Terms & Regulatory Info →
                </a>
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={loading || !form.agreedToTerms || !form.agreedToPrivacy}
              className="w-full mt-8 inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:from-yellow-500 hover:to-amber-600 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
          <div className="text-center backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
              Account Created!
            </div>
            <p className="text-neutral-400 mb-6">Welcome to the Gambino mining network</p>
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto animate-spin"></div>
            <p className="text-sm text-neutral-500 mt-4">Redirecting to dashboard...</p>
          </div>
        )}

        {/* Back to home link */}
        <div className="text-center mt-8">
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
      </div>
    </div>
  );
}