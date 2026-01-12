// src/app/legal/privacy/page.js
'use client';

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-neutral-400">Last Updated: January 12, 2025</p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-yellow-400 font-semibold mb-2">Multi-Party Data Handling</h2>
          <p className="text-neutral-300 text-sm">
            The Gambino platform involves multiple parties handling your data. Your
            <strong> Licensed Service Provider</strong> (currently Volunteer Digital Ventures, LLC
            for Tennessee users) is the data controller for customer relationship data.
            <strong> Gambino Gold, Inc.</strong> acts as a data processor providing technical
            infrastructure. This policy covers data practices across both entities.
          </p>
        </div>

        <div className="prose prose-invert prose-yellow max-w-none space-y-8">

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">1.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, date of birth</li>
                <li><strong>Identity Verification:</strong> Government ID, proof of address (when required)</li>
                <li><strong>Financial Information:</strong> Transaction history, payment methods (processed by your Licensed Service Provider)</li>
                <li><strong>Communications:</strong> Support requests, feedback, correspondence</li>
              </ul>

              <h3 className="text-lg font-semibold text-white">1.2 Information Collected Automatically</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Device Information:</strong> Device type, operating system, browser type, unique device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, session duration, mining activity</li>
                <li><strong>Location Data:</strong> Approximate location based on IP address (precise location only with consent)</li>
                <li><strong>Blockchain Data:</strong> Wallet addresses, transaction history on Solana network</li>
              </ul>

              <h3 className="text-lg font-semibold text-white">1.3 Information from Third Parties</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Venue Partners:</strong> Session activity, check-in data</li>
                <li><strong>Identity Verification Services:</strong> Verification results</li>
                <li><strong>Payment Processors:</strong> Transaction confirmations</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              2. How We Use Your Information
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">2.1 Service Provision</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Create and manage your account</li>
                <li>Process mining sessions and token emissions</li>
                <li>Enable wallet functionality and transactions</li>
                <li>Verify your identity and eligibility</li>
                <li>Process referrals and reward distributions</li>
              </ul>

              <h3 className="text-lg font-semibold text-white">2.2 Platform Operations</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Maintain and improve platform functionality</li>
                <li>Detect and prevent fraud, abuse, and security threats</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Provide customer support</li>
              </ul>

              <h3 className="text-lg font-semibold text-white">2.3 Legal and Compliance</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Comply with legal obligations and regulatory requirements</li>
                <li>Respond to law enforcement requests</li>
                <li>Enforce our terms of service</li>
                <li>Protect rights and safety of users and third parties</li>
              </ul>

              <h3 className="text-lg font-semibold text-white">2.4 Communications</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Send account notifications and security alerts</li>
                <li>Provide transaction confirmations</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              3. Data Controllers and Processors
            </h2>
            <div className="space-y-4 text-neutral-300">
              <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                <h3 className="text-lg font-semibold text-white mb-3">Data Controller</h3>
                <p className="mb-2"><strong>Your Licensed Service Provider</strong></p>
                <p className="text-sm">Currently: Volunteer Digital Ventures, LLC (Tennessee)</p>
                <p className="text-sm text-neutral-400 mt-2">
                  The data controller determines the purposes and means of processing your personal data
                  related to customer service and financial transactions.
                </p>
              </div>

              <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                <h3 className="text-lg font-semibold text-white mb-3">Data Processor</h3>
                <p className="mb-2"><strong>Gambino Gold, Inc.</strong></p>
                <p className="text-sm text-neutral-400">
                  Provides technical infrastructure and processes data on behalf of Licensed Service
                  Providers according to documented instructions and contractual obligations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              4. Information Sharing
            </h2>
            <div className="space-y-4 text-neutral-300">
              <h3 className="text-lg font-semibold text-white">4.1 Service Providers (Sub-processors)</h3>
              <p>We share data with third-party service providers who assist in operating the platform:</p>
              <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-600">
                      <th className="text-left py-2 text-white">Provider</th>
                      <th className="text-left py-2 text-white">Purpose</th>
                      <th className="text-left py-2 text-white">Location</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-300">
                    <tr className="border-b border-neutral-700">
                      <td className="py-2">MongoDB Atlas</td>
                      <td className="py-2">Database hosting</td>
                      <td className="py-2">United States</td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2">Vercel</td>
                      <td className="py-2">Application hosting</td>
                      <td className="py-2">United States</td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2">Solana Network</td>
                      <td className="py-2">Blockchain transactions</td>
                      <td className="py-2">Decentralized</td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2">SendGrid/Email Provider</td>
                      <td className="py-2">Email communications</td>
                      <td className="py-2">United States</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-white">4.2 Licensed Service Providers</h3>
              <p>Your account data is shared with your Licensed Service Provider who manages your customer relationship and financial services.</p>

              <h3 className="text-lg font-semibold text-white">4.3 Venue Partners</h3>
              <p>Limited data (user ID, session status) is shared with Venue Partners to enable service delivery at their locations.</p>

              <h3 className="text-lg font-semibold text-white">4.4 Legal Requirements</h3>
              <p>We may disclose information when required by law, court order, or government request, or when necessary to protect our rights or the safety of users.</p>

              <h3 className="text-lg font-semibold text-white">4.5 Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of the transaction.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              5. Blockchain Data
            </h2>
            <div className="space-y-4 text-neutral-300">
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                <p className="text-amber-400 font-semibold mb-2">Public Blockchain Notice</p>
                <p className="text-sm">
                  Transactions on the Solana blockchain are public and permanent. Your wallet address
                  and transaction history are visible to anyone. While we do not publicly link your
                  wallet address to your identity, this information exists on a public ledger and
                  cannot be deleted or modified.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              6. Data Retention
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>We retain your personal data for as long as necessary to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide services to you</li>
                <li>Comply with legal obligations (typically 7 years for financial records)</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Prevent fraud and abuse</li>
              </ul>
              <p className="mt-4">After account deletion, we may retain certain data in anonymized or aggregated form for analytics purposes.</p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              7. Your Rights
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>Depending on your jurisdiction, you may have the following rights:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                  <h4 className="font-semibold text-white mb-2">Access</h4>
                  <p className="text-sm">Request a copy of the personal data we hold about you</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                  <h4 className="font-semibold text-white mb-2">Correction</h4>
                  <p className="text-sm">Request correction of inaccurate personal data</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                  <h4 className="font-semibold text-white mb-2">Deletion</h4>
                  <p className="text-sm">Request deletion of your personal data (subject to legal requirements)</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                  <h4 className="font-semibold text-white mb-2">Portability</h4>
                  <p className="text-sm">Request your data in a portable format</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                  <h4 className="font-semibold text-white mb-2">Restriction</h4>
                  <p className="text-sm">Request restriction of processing in certain circumstances</p>
                </div>
                <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
                  <h4 className="font-semibold text-white mb-2">Objection</h4>
                  <p className="text-sm">Object to processing based on legitimate interests</p>
                </div>
              </div>

              <p className="mt-4">To exercise these rights, contact us at privacy@gambino.gold or through your account settings.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              8. Security
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>We implement appropriate technical and organizational measures to protect your data, including:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication requirements</li>
                <li>Regular security assessments and monitoring</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
              <p className="mt-4">While we strive to protect your information, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.</p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              9. Children's Privacy
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn we have collected information from a child under 18, we will delete it promptly.</p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              10. Cookies and Tracking
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage</li>
                <li>Detect and prevent fraud</li>
              </ul>
              <p className="mt-4">You can control cookies through your browser settings, but disabling cookies may affect platform functionality.</p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              11. Changes to This Policy
            </h2>
            <div className="space-y-4 text-neutral-300">
              <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or in-app notification. Your continued use of the Platform after changes constitutes acceptance of the updated policy.</p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-white border-b border-neutral-700 pb-2 mb-4">
              12. Contact Us
            </h2>
            <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700 text-neutral-300">
              <p className="mb-4">For privacy-related questions or to exercise your data rights:</p>
              <p className="mb-2"><strong className="text-white">Gambino Gold, Inc.</strong></p>
              <p>Email: privacy@gambino.gold</p>
              <p className="mt-4 text-sm text-neutral-400">
                For questions about financial services data, contact your Licensed Service Provider
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
