// src/app/onboard/page.js - Enhanced to match home page styling
'use client';

import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  );
}

// Email Verification Pending Component
function VerificationPendingStep({ email, setError, referralApplied, referralBonus }) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await api.post('/api/users/resend-verification', { email });
      setResendSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center backdrop-blur-sm border border-neutral-800 bg-neutral-900/50 rounded-2xl p-8 shadow-2xl">
      {/* Email icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 flex items-center justify-center border border-yellow-500/30">
        <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3">
        Check Your Email
      </h2>

      <p className="text-neutral-300 mb-2">
        We've sent a verification link to:
      </p>
      <p className="text-yellow-400 font-medium mb-6 break-all">
        {email}
      </p>

      <div className="bg-neutral-800/50 rounded-xl p-4 mb-6 border border-neutral-700/50">
        <p className="text-neutral-400 text-sm">
          Click the link in your email to verify your account and get started. The link expires in 24 hours.
        </p>
      </div>

      {referralApplied && referralBonus > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-green-500/30 bg-green-900/20">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <span className="text-green-300 font-medium">Referral Bonus Applied!</span>
          </div>
          <p className="text-green-200/80 text-sm">
            You'll receive <span className="font-bold text-green-300">{referralBonus} GG</span> after your first mining session.
          </p>
        </div>
      )}

      {resendSuccess && (
        <div className="mb-4 p-3 rounded-xl border border-green-500/30 bg-green-900/20">
          <p className="text-green-300 text-sm">Verification email sent! Check your inbox.</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full px-6 py-3 rounded-xl border border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resending ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </span>
          ) : (
            "Didn't receive it? Resend Email"
          )}
        </button>

        <a
          href="/login"
          className="block w-full px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold hover:from-yellow-500 hover:to-amber-600 transition-all duration-300"
        >
          Go to Login
        </a>
      </div>

      <p className="text-neutral-500 text-xs mt-6">
        Make sure to check your spam folder if you don't see the email.
      </p>
    </div>
  );
}

function OnboardPageContent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Referral state
  const [referralValidation, setReferralValidation] = useState({ checking: false, valid: null, referrer: null });
  const [referralResult, setReferralResult] = useState({ applied: false, bonus: 0 });

  const [form, setForm] = useState({
    // Step 1: Personal info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    referralCode: '',
    // Step 2: Legal agreements
    agreedToTerms: false,
    agreedToPrivacy: false,
    agreedToMarketing: false,
    readWhitepaper: false,
    confirmedAge18: false
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  // Read referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('referral');
    if (refCode) {
      updateForm('referralCode', refCode.toUpperCase());
      // Validate the code from URL
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  // Validate referral code
  const validateReferralCode = async (code) => {
    if (!code || code.length < 6) {
      setReferralValidation({ checking: false, valid: null, referrer: null });
      return;
    }

    setReferralValidation({ checking: true, valid: null, referrer: null });

    try {
      const { data } = await api.post('/api/referral/validate', { code: code.toUpperCase() });
      setReferralValidation({
        checking: false,
        valid: data.valid,
        referrer: data.referrer,
        rewards: data.rewards
      });
    } catch (err) {
      setReferralValidation({
        checking: false,
        valid: false,
        referrer: null,
        error: err.response?.data?.error || 'Invalid code'
      });
    }
  };

  // Debounced referral code validation
  const handleReferralCodeChange = (value) => {
    const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    updateForm('referralCode', code);

    // Clear validation if empty
    if (!code) {
      setReferralValidation({ checking: false, valid: null, referrer: null });
      return;
    }

    // Validate after user stops typing
    if (code.length >= 6) {
      setTimeout(() => validateReferralCode(code), 500);
    }
  };

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
        
        if (form.password.length < 12) {
          setError('Password must be at least 12 characters');
          return;
        }

        // Check for special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
          setError('Password must contain at least one special character');
          return;
        }

        // Validate date of birth
        if (!form.dateOfBirth) {
          setError('Date of birth is required');
          return;
        }

        // Check if 21+
        const dob = new Date(form.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18) {
          setError('You must be 18 years or older to register');
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
        if (!form.confirmedAge18) {
          setError('You must confirm that you are 18 years or older');
          return;
        }

        setLoading(true);

        // REGISTER USER (using existing backend endpoint)
        try {
          const registerPayload = {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            password: form.password,
            dateOfBirth: form.dateOfBirth
          };

          // Include referral code if provided and valid
          if (form.referralCode && referralValidation.valid) {
            registerPayload.referralCode = form.referralCode;
          }

          const { data } = await api.post('/api/users/register', registerPayload);

          // Store referral result if applied
          if (data.user?.referralApplied) {
            setReferralResult({
              applied: true,
              bonus: data.user?.referralBonus || 0
            });
          }

          // Check if email verification is required
          if (data.requiresVerification) {
            // Store email for resend functionality
            sessionStorage.setItem('pendingVerificationEmail', form.email);
            setStep(3); // Show verification pending screen
          } else if (data.accessToken) {
            // Legacy flow: immediate login (for backwards compatibility)
            setToken(data.accessToken);
            setStep(4);
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
            {[1, 2, 3, 4].map(i => (
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
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={e => updateForm('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300 backdrop-blur-sm"
                  required
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                />
                <p className="text-xs text-neutral-500 mt-1">You must be 18 years or older</p>
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
                  placeholder="Min 12 chars, include special character"
                  required
                  minLength={12}
                />
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Referral Code
                  <span className="text-neutral-500 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.referralCode}
                    onChange={e => handleReferralCodeChange(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-neutral-800/50 border text-white placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm uppercase tracking-wider ${
                      referralValidation.valid === true
                        ? 'border-green-500/50 focus:ring-green-500/50 focus:border-green-500/50'
                        : referralValidation.valid === false
                          ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                          : 'border-neutral-700 focus:ring-yellow-500/50 focus:border-yellow-500/50'
                    }`}
                    placeholder="Enter code (e.g., ABC123)"
                    maxLength={20}
                  />
                  {/* Validation indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {referralValidation.checking && (
                      <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {referralValidation.valid === true && (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {referralValidation.valid === false && (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                {/* Referral validation feedback */}
                {referralValidation.valid === true && referralValidation.referrer && (
                  <div className="mt-2 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
                    <p className="text-green-300 text-sm">
                      Referred by <span className="font-semibold">{referralValidation.referrer.firstName}</span>
                    </p>
                    {referralValidation.rewards && (
                      <p className="text-green-200/70 text-xs mt-1">
                        You'll receive {referralValidation.rewards.newUser} GG bonus after your first session!
                      </p>
                    )}
                  </div>
                )}
                {referralValidation.valid === false && referralValidation.error && (
                  <p className="mt-2 text-red-400 text-sm">{referralValidation.error}</p>
                )}
              </div>
            </div>

            <button
              onClick={nextStep}
              disabled={loading || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password || !form.dateOfBirth}
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
                      I agree to the <a href="https://gambino.gold/legal/vdv-terms" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline">VDV Terms of Service</a>
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
                      I agree to the <a href="https://gambino.gold/legal/vdv-privacy" target="_blank" className="text-yellow-400 hover:text-yellow-300 underline">VDV Privacy Policy</a>
                    </span>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.confirmedAge18}
                      onChange={e => updateForm('confirmedAge18', e.target.checked)}
                      className="mt-1 w-4 h-4 text-yellow-500 bg-neutral-800 border-neutral-600 rounded focus:ring-yellow-500/50 focus:ring-2"
                    />
                    <span className="text-sm text-neutral-300 group-hover:text-neutral-200 transition-colors">
                      I confirm that I am <span className="text-yellow-400 font-semibold">18 years of age or older</span> and eligible to participate
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
              disabled={loading || !form.agreedToTerms || !form.agreedToPrivacy || !form.confirmedAge18}
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

        {/* STEP 3: Email Verification Pending */}
        {step === 3 && (
          <VerificationPendingStep
            email={form.email}
            setError={setError}
            referralApplied={referralResult.applied}
            referralBonus={referralResult.bonus}
          />
        )}

        {/* STEP 4: Success (after email verification or legacy flow) */}
        {step === 4 && (
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

// Export with Suspense wrapper for useSearchParams
export default function OnboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <LoadingSpinner />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <OnboardPageContent />
    </Suspense>
  );
}