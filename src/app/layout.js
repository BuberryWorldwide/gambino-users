// src/app/layout.js (Server Component)
import './globals.css';
import ConditionalNavbar from '@/components/ConditionalNavbar';

export const metadata = {
  title: 'Gambino Gold | Network Access',
  description: 'Access your Gambino Gold mining infrastructure dashboard. Manage utility tokens, track participation, and monitor network activity.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-neutral-100 relative">
        {/* Abstract Gold Ambient Background - matching gambino-site */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Top right glow */}
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-full blur-3xl bg-yellow-500/10 md:bg-yellow-500/15"></div>
          {/* Bottom left glow */}
          <div className="absolute -bottom-48 -left-32 w-[500px] h-[500px] md:w-[600px] md:h-[600px] rounded-full blur-3xl bg-amber-600/8 md:bg-amber-600/12"></div>
          {/* Center subtle radial */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(234, 179, 8, 0.04) 0%, transparent 60%)'
          }}></div>

          {/* Floating abstract shapes - rings and circles */}
          <div className="absolute top-[15%] left-[10%] w-24 h-24 md:w-32 md:h-32 rounded-full border border-yellow-500/8 md:border-yellow-500/10"></div>
          <div className="absolute top-[45%] right-[8%] w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/4 md:bg-amber-500/5"></div>
          <div className="absolute top-[25%] right-[20%] w-12 h-12 md:w-16 md:h-16 rounded-full border border-amber-400/6 md:border-amber-400/8"></div>
          <div className="absolute bottom-[30%] left-[15%] w-20 h-20 md:w-24 md:h-24 rounded-full border border-yellow-400/5 md:border-yellow-400/8"></div>
          <div className="absolute bottom-[15%] right-[25%] w-10 h-10 md:w-14 md:h-14 rounded-full bg-yellow-500/3 md:bg-yellow-500/4"></div>
          <div className="hidden md:block absolute top-[60%] left-[40%] w-28 h-28 rounded-full border border-yellow-500/6"></div>

          {/* Vignette */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.4) 100%)'
          }}></div>
        </div>

        {/* App content with proper mobile handling */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Conditional Navbar - handled by client component */}
          <ConditionalNavbar />
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}