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
    <div className="min-h-screen relative">
      {/* Background is in layout.js */}

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
            <span className="text-white">Join </span>
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Gambino Gold
            </span>
          </h1>
          <p className="text-neutral-400">Access the mining infrastructure network</p>
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
            <p className="text-neutral-400 mb-6">Welcome to the Gambino Gold network</p>
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