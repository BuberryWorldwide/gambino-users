// src/app/onboard/page.js - Fixed to use existing backend endpoints
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
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gold">Welcome to Gambino</h1>
        <p className="text-zinc-400">Join the mining network</p>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full ${
                step >= i ? 'bg-gold' : 'bg-zinc-600'
              }`} 
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-800/30 border border-red-500/50 rounded p-3 mb-6 text-center">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* STEP 1: Personal Information */}
      {step === 1 && (
        <div className="bg-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gold mb-4">Personal Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => updateForm('firstName', e.target.value)}
                  className="input w-full"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => updateForm('lastName', e.target.value)}
                  className="input w-full"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                className="input w-full"
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => updateForm('phone', e.target.value)}
                className="input w-full"
                placeholder="Enter phone number (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => updateForm('password', e.target.value)}
                className="input w-full"
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            onClick={nextStep}
            disabled={loading || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      )}

      {/* STEP 2: Legal Agreements */}
      {step === 2 && (
        <div className="bg-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gold mb-4">Legal Agreements</h2>
          
          <div className="space-y-4">
            {/* Required agreements */}
            <div className="p-4 bg-zinc-700 rounded-lg">
              <h3 className="font-semibold text-zinc-200 mb-3">Required *</h3>
              
              <label className="flex items-start space-x-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={e => updateForm('agreedToTerms', e.target.checked)}
                  className="mt-1 w-4 h-4 text-gold bg-zinc-800 border-zinc-600 rounded focus:ring-gold focus:ring-2"
                />
                <span className="text-sm text-zinc-300">
                  I agree to the <a href="https://gambino.gold/legal/terms" target="_blank" className="text-gold underline">Terms of Service</a>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToPrivacy}
                  onChange={e => updateForm('agreedToPrivacy', e.target.checked)}
                  className="mt-1 w-4 h-4 text-gold bg-zinc-800 border-zinc-600 rounded focus:ring-gold focus:ring-2"
                />
                <span className="text-sm text-zinc-300">
                  I agree to the <a href="https://gambino.gold/legal/privacy" target="_blank" className="text-gold underline">Privacy Policy</a>
                </span>
              </label>
            </div>

            {/* Optional agreements */}
            <div className="p-4 bg-zinc-700 rounded-lg">
              <h3 className="font-semibold text-zinc-200 mb-3">Optional</h3>
              
              <label className="flex items-start space-x-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={form.agreedToMarketing}
                  onChange={e => updateForm('agreedToMarketing', e.target.checked)}
                  className="mt-1 w-4 h-4 text-gold bg-zinc-800 border-zinc-600 rounded focus:ring-gold focus:ring-2"
                />
                <span className="text-sm text-zinc-300">
                  I want to receive updates and marketing communications
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.readWhitepaper}
                  onChange={e => updateForm('readWhitepaper', e.target.checked)}
                  className="mt-1 w-4 h-4 text-gold bg-zinc-800 border-zinc-600 rounded focus:ring-gold focus:ring-2"
                />
                <span className="text-sm text-zinc-300">
                  I have read the whitepaper and understand the tokenomics
                </span>
              </label>
            </div>

            {/* Info Links */}
            <div className="text-center p-4 bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-400 mb-2">For complete documentation:</p>
              <a 
                href="/info" 
                target="_blank" 
                className="text-gold hover:text-yellow-400 text-sm underline"
              >
                View Whitepaper, Terms & Regulatory Info →
              </a>
            </div>
          </div>

          <button
            onClick={nextStep}
            disabled={loading || !form.agreedToTerms || !form.agreedToPrivacy}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      )}

      {/* STEP 3: Success */}
      {step === 3 && (
        <div className="text-center">
          <div className="text-emerald-400 text-2xl font-bold mb-2">Account Created!</div>
          <p className="text-zinc-400 mb-4">Welcome to the Gambino mining network</p>
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-zinc-500 mt-2">Redirecting to dashboard...</p>
        </div>
      )}
    </div>
  );
}