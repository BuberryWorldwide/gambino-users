// src/app/legal/terms/page.js
'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <a href="/" className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-4">
            Gambino Platform Terms of Service
          </h1>
          <p className="text-neutral-400">Last Updated: January 12, 2025</p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-yellow-400 font-semibold mb-2">Important Notice</h2>
          <p className="text-neutral-300 text-sm">
            The Gambino platform connects you with services provided by licensed third-party operators
            ("<strong>Licensed Service Providers</strong>"). Your financial services relationship is
            with your Licensed Service Provider. Gambino Gold, Inc. provides the technical platform
            and infrastructure. By using this platform, you agree to these terms governing both relationships.
          </p>
        </div>

        <div className="prose prose-invert prose-yellow max-w-none space-y-8">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              1. Definitions
            </h2>
            <div className="space-y-3 text-neutral-300">
              <p><strong className="text-white">"Platform"</strong> means the Gambino Gold mobile application, web application, and related services operated by Gambino Gold, Inc.</p>
              <p><strong className="text-white">"Licensed Service Provider"</strong> means a third-party entity licensed to provide financial services in your jurisdiction, contracted to deliver customer services through the Gambino platform. Your current Licensed Service Provider is identified in your account settings and during registration.</p>
              <p><strong className="text-white">"Venue Partner"</strong> means a physical location hosting Gambino mining infrastructure where users access services.</p>
              <p><strong className="text-white">"GG" or "Gambino Gold tokens"</strong> means the digital utility tokens issued through the Gambino protocol on the Solana blockchain.</p>
              <p><strong className="text-white">"Mining Session"</strong> means the activity of interacting with mining infrastructure at a Venue Partner location to participate in token emissions.</p>
              <p><strong className="text-white">"User," "you," or "your"</strong> means the individual accessing or using the Platform.</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              2. Platform Access and Account
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">2.1 Eligibility</h3>
              <p>To use the Platform, you must be at least 18 years old and legally permitted to access gaming or entertainment services in your jurisdiction. By creating an account, you represent and warrant that you meet these eligibility requirements.</p>

              <h3 className="text-lg font-semibold text-white">2.2 Account Registration</h3>
              <p>You must provide accurate, complete information when creating your account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

              <h3 className="text-lg font-semibold text-white">2.3 Account Security</h3>
              <p>You must immediately notify us of any unauthorized access to your account. We are not liable for losses resulting from unauthorized access that occurs due to your failure to protect your credentials.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              3. Licensed Service Provider Relationship
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">3.1 Financial Services</h3>
              <p>Your Licensed Service Provider handles all financial transactions, including cash deposits, settlements, and payment processing. Gambino Gold, Inc. does not handle your funds directly.</p>

              <h3 className="text-lg font-semibold text-white">3.2 Customer Service</h3>
              <p>For questions about financial transactions, disputes, or account-related issues involving funds, contact your Licensed Service Provider. Contact information is available in your account settings.</p>

              <h3 className="text-lg font-semibold text-white">3.3 Current Licensed Service Providers</h3>
              <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                <p className="text-sm"><strong>Tennessee:</strong> Volunteer Digital Ventures, LLC</p>
                <p className="text-xs text-neutral-400 mt-2">Additional service providers may be listed as the network expands.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              4. Token Utility and Value
            </h2>
            <div className="space-y-4 text-neutral-300">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Important Disclaimers</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>GG tokens are utility tokens with <strong>no guaranteed monetary value</strong>.</li>
                  <li>GG tokens are <strong>NOT securities, investments, or financial instruments</strong>.</li>
                  <li>Past performance does not indicate future results.</li>
                  <li>You may lose the entire value of any tokens you acquire.</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-white">4.1 Token Purpose</h3>
              <p>GG tokens function as utility tokens within the Gambino ecosystem. They may be used to access platform features, participate in network activities, and interact with protocol functions.</p>

              <h3 className="text-lg font-semibold text-white">4.2 No Redemption Guarantee</h3>
              <p>While Licensed Service Providers may offer exchange services at their discretion, there is no guarantee of token redemption, exchange, or conversion to fiat currency.</p>

              <h3 className="text-lg font-semibold text-white">4.3 Protocol Emissions</h3>
              <p>Token emissions are governed by smart contracts on the Solana blockchain. Emission rates, schedules, and mechanisms may change according to protocol governance.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              5. Wallet Custody
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">5.1 Custodial Arrangement</h3>
              <p>When you create an account, Gambino creates and manages a Solana wallet on your behalf. Your wallet keys are encrypted and stored securely. This is a custodial arrangement—Gambino maintains operational control of wallet infrastructure.</p>

              <h3 className="text-lg font-semibold text-white">5.2 Self-Custody Option</h3>
              <p>You may request to export your wallet or transfer tokens to a self-custody wallet at any time, subject to applicable fees and processing times.</p>

              <h3 className="text-lg font-semibold text-white">5.3 Security</h3>
              <p>While we implement industry-standard security measures, you acknowledge that no system is completely secure. We are not liable for losses due to security breaches beyond our reasonable control.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              6. Referral Program
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">6.1 Program Overview</h3>
              <p>Users may earn GG token rewards by referring new users to the Platform. Referral rewards are subject to verification requirements and budget constraints.</p>

              <h3 className="text-lg font-semibold text-white">6.2 Eligibility Requirements</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Referred users must complete account verification</li>
                <li>Referred users must complete their first mining session within 14 days</li>
                <li>Self-referrals are prohibited</li>
                <li>Fraudulent or manipulated referrals will be rejected</li>
              </ul>

              <h3 className="text-lg font-semibold text-white">6.3 Reward Distribution</h3>
              <p>Referral rewards are distributed from the Community Pool and are subject to monthly budget caps. Rewards are distributed in GG tokens and carry no guaranteed monetary value.</p>

              <h3 className="text-lg font-semibold text-white">6.4 Program Modifications</h3>
              <p>We reserve the right to modify, suspend, or terminate the referral program at any time without prior notice.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              7. Venue Partner Services
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">7.1 Physical Locations</h3>
              <p>Venue Partners provide the physical locations where you access mining infrastructure. Each Venue Partner operates independently and may have additional terms, rules, or requirements.</p>

              <h3 className="text-lg font-semibold text-white">7.2 Venue Conduct</h3>
              <p>You agree to comply with all Venue Partner rules and applicable laws while at their locations. Violations may result in restriction from venues and/or Platform suspension.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              8. Entertainment Purpose
            </h2>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 text-neutral-300">
              <p className="font-semibold text-amber-400 mb-2">For Entertainment Purposes Only</p>
              <p className="text-sm">
                The Gambino platform and mining activities are provided for entertainment purposes.
                This is not a gambling service and does not involve wagering of money. Token emissions
                from mining activities are protocol rewards, not gambling winnings. If you experience
                difficulty controlling your platform usage, please seek appropriate assistance.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              9. Prohibited Activities
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Create multiple accounts or use false information</li>
                <li>Manipulate or exploit platform systems, including referral abuse</li>
                <li>Use automated systems, bots, or scripts</li>
                <li>Circumvent geographic or eligibility restrictions</li>
                <li>Engage in money laundering or other illegal activities</li>
                <li>Interfere with platform operations or other users</li>
                <li>Reverse engineer or attempt to access platform source code</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              10. Limitation of Liability
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
                <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
                <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE PAST 12 MONTHS</li>
                <li>WE ARE NOT LIABLE FOR ACTIONS OR OMISSIONS OF LICENSED SERVICE PROVIDERS OR VENUE PARTNERS</li>
              </ul>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              11. Dispute Resolution
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">11.1 Financial Disputes</h3>
              <p>Disputes involving financial transactions should be directed to your Licensed Service Provider first.</p>

              <h3 className="text-lg font-semibold text-white">11.2 Platform Disputes</h3>
              <p>Disputes regarding platform functionality or these terms should be directed to Gambino Gold, Inc. at support@gambino.gold.</p>

              <h3 className="text-lg font-semibold text-white">11.3 Governing Law</h3>
              <p>These terms are governed by the laws of the State of Tennessee, without regard to conflict of law provisions.</p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              12. Modifications
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>We may modify these terms at any time by posting updated terms on the Platform. Material changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance of the modified terms.</p>
            </div>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              13. Contact Information
            </h2>
            <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 text-neutral-300">
              <p className="mb-2"><strong className="text-white">Gambino Gold, Inc.</strong></p>
              <p>Email: support@gambino.gold</p>
              <p className="mt-4 text-sm text-neutral-400">
                For financial service inquiries, contact your Licensed Service Provider directly
                through your account settings.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Gambino Gold, Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
