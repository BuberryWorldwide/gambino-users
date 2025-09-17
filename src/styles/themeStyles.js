// src/app/styles/themeStyles.js

export const getThemeStyles = (isDark) => {
  return {
    // Layout & Backgrounds
    layout: {
      main: isDark 
        ? 'min-h-dvh relative overflow-hidden transition-colors duration-300 bg-black text-neutral-100'
        : 'min-h-dvh relative overflow-hidden transition-colors duration-300 bg-neutral-50 text-neutral-900',
      card: isDark 
        ? 'backdrop-blur-sm rounded-2xl p-8 border border-neutral-800 hover:border-yellow-500/30 bg-neutral-900/50 transition-all duration-300'
        : 'backdrop-blur-sm rounded-2xl p-8 border border-neutral-200 hover:border-yellow-600/50 bg-white/70 transition-all duration-300',
      cardLarge: isDark
        ? 'rounded-2xl p-8 border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-amber-500/10'
        : 'rounded-2xl p-8 border border-yellow-600/25 bg-gradient-to-r from-yellow-600/8 to-amber-600/8'
    },

    // Typography
    text: {
      primary: isDark ? 'text-white' : 'text-neutral-900',
      secondary: isDark ? 'text-neutral-300' : 'text-neutral-700',
      tertiary: isDark ? 'text-neutral-400' : 'text-neutral-600',
      accent: isDark ? 'text-yellow-400' : 'text-yellow-600',
      accentHover: isDark ? 'hover:text-yellow-300' : 'hover:text-yellow-700',
      gradient: isDark
        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent'
        : 'bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent'
    },

    // Interactive Elements - SOLID COLORS ONLY
    buttons: {
      primary: isDark 
        ? 'rounded-xl px-8 py-4 text-lg font-bold bg-yellow-500 text-black transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25'
        : 'rounded-xl px-8 py-4 text-lg font-bold bg-yellow-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-yellow-600/25',
      secondary: isDark 
        ? 'rounded-xl border border-yellow-500/50 bg-transparent px-8 py-4 text-lg font-semibold text-yellow-500 transition-all duration-300 hover:bg-yellow-500/10 hover:border-yellow-500'
        : 'rounded-xl border border-yellow-600/50 bg-transparent px-8 py-4 text-lg font-semibold text-yellow-600 transition-all duration-300 hover:bg-yellow-600/10 hover:border-yellow-600',
      small: isDark 
        ? 'rounded-lg px-6 py-3 font-semibold bg-yellow-500 text-black transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/25'
        : 'rounded-lg px-6 py-3 font-semibold bg-yellow-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-yellow-600/25'
    },

    // Badges & Indicators
    badges: {
      primary: isDark
        ? 'inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-4 py-2 text-sm text-yellow-400'
        : 'inline-flex items-center gap-2 rounded-full border border-yellow-600/40 bg-yellow-600/10 px-4 py-2 text-sm text-yellow-700',
      dot: isDark ? 'bg-yellow-500' : 'bg-yellow-600',
      success: isDark ? 'bg-green-500/20' : 'bg-green-500/10',
      info: isDark ? 'bg-blue-500/20' : 'bg-blue-500/10',
      warning: isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'
    },

    // List & Content Elements
    lists: {
      bullet: isDark ? 'bg-yellow-500' : 'bg-yellow-600'
    },

    // Icons & Graphics - SOLID COLORS ONLY
    icons: {
      primary: isDark 
        ? 'rounded-xl flex items-center justify-center bg-yellow-500'
        : 'rounded-xl flex items-center justify-center bg-yellow-600',
      secondary: isDark 
        ? 'rounded-xl flex items-center justify-center bg-amber-500'
        : 'rounded-xl flex items-center justify-center bg-amber-600'
    }
  };
};

// Background effects component with theme-aware yellows
export const BackgroundEffects = ({ isDark }) => {
  return (
    <>
      {/* Floating particles - all with theme-aware yellows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-20 left-10 w-3 h-3 rounded-full animate-pulse ${isDark ? 'bg-yellow-400/50' : 'bg-yellow-600/60'}`}></div>
        <div className={`absolute top-40 right-20 w-2 h-2 rounded-full animate-pulse delay-1000 ${isDark ? 'bg-yellow-300/60' : 'bg-yellow-700/50'}`}></div>
        <div className={`absolute top-60 left-1/3 w-4 h-4 rounded-full animate-pulse delay-2000 ${isDark ? 'bg-amber-400/40' : 'bg-amber-600/50'}`}></div>
        <div className={`absolute bottom-40 right-10 w-3 h-3 rounded-full animate-pulse delay-3000 ${isDark ? 'bg-yellow-500/50' : 'bg-yellow-700/40'}`}></div>
        <div className={`absolute bottom-20 left-20 w-2 h-2 rounded-full animate-pulse delay-500 ${isDark ? 'bg-yellow-400/60' : 'bg-yellow-600/60'}`}></div>
        <div className={`absolute top-1/3 right-1/4 w-2 h-2 rounded-full animate-pulse delay-1500 ${isDark ? 'bg-amber-300/50' : 'bg-amber-700/40'}`}></div>
        
        {/* Mid-section particles */}
        <div className={`absolute top-1/2 left-16 w-3 h-3 rounded-full animate-pulse delay-2500 ${isDark ? 'bg-yellow-500/45' : 'bg-yellow-600/45'}`}></div>
        <div className={`absolute top-3/4 right-32 w-2 h-2 rounded-full animate-pulse delay-4000 ${isDark ? 'bg-amber-400/55' : 'bg-amber-600/45'}`}></div>
        <div className={`absolute top-1/4 left-2/3 w-2.5 h-2.5 rounded-full animate-pulse delay-3500 ${isDark ? 'bg-yellow-300/50' : 'bg-yellow-700/40'}`}></div>
        <div className={`absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full animate-pulse delay-1200 ${isDark ? 'bg-yellow-400/60' : 'bg-yellow-600/60'}`}></div>
        <div className={`absolute top-2/3 right-16 w-3 h-3 rounded-full animate-pulse delay-2800 ${isDark ? 'bg-amber-500/45' : 'bg-amber-700/40'}`}></div>
        <div className={`absolute bottom-1/4 left-1/4 w-2 h-2 rounded-full animate-pulse delay-800 ${isDark ? 'bg-yellow-500/55' : 'bg-yellow-600/50'}`}></div>

        {/* Floating sparkles - theme aware */}
        <div className={`absolute top-16 left-1/2 w-1 h-1 rounded-full animate-ping ${isDark ? 'bg-yellow-200/70' : 'bg-yellow-800/60'}`} style={{animationDuration: '3s', animationDelay: '0.5s'}}></div>
        <div className={`absolute top-3/4 left-1/3 w-1 h-1 rounded-full animate-ping ${isDark ? 'bg-amber-200/70' : 'bg-amber-800/60'}`} style={{animationDuration: '2.5s', animationDelay: '1.2s'}}></div>
        <div className={`absolute bottom-16 right-1/2 w-1 h-1 rounded-full animate-ping ${isDark ? 'bg-yellow-100/80' : 'bg-yellow-900/70'}`} style={{animationDuration: '3.5s', animationDelay: '2.1s'}}></div>
      </div>

      {/* Background geometric shapes - theme aware gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl transform translate-x-32 -translate-y-32 ${isDark ? 'bg-gradient-to-br from-yellow-500/12 to-amber-600/8' : 'bg-gradient-to-br from-yellow-700/8 to-amber-800/6'}`}></div>
        <div className={`absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl transform -translate-x-24 translate-y-24 ${isDark ? 'bg-gradient-to-tr from-amber-600/15 to-yellow-500/8' : 'bg-gradient-to-tr from-amber-700/10 to-yellow-700/6'}`}></div>
        <div className={`absolute top-1/2 right-1/4 w-64 h-64 rounded-full blur-2xl ${isDark ? 'bg-gradient-to-br from-yellow-400/8 to-transparent' : 'bg-gradient-to-br from-yellow-600/6 to-transparent'}`}></div>
        <div className={`absolute top-1/4 left-1/4 w-48 h-48 rounded-full blur-xl ${isDark ? 'bg-gradient-to-tr from-amber-500/10 to-transparent' : 'bg-gradient-to-tr from-amber-700/8 to-transparent'}`}></div>
        
        {/* Grid pattern - theme aware opacity and color */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-[0.15]' : 'opacity-[0.08]'}`}>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(234, 179, 8, ${isDark ? '0.3' : '0.15'}) 1px, transparent 0)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
        
        {/* Animated geometric shapes - theme aware borders */}
        <div className={`absolute top-1/4 left-1/4 w-32 h-32 border rounded-lg rotate-45 animate-spin ${isDark ? 'border-yellow-500/20' : 'border-yellow-600/30'}`} style={{animationDuration: '25s'}}></div>
        <div className={`absolute bottom-1/3 right-1/3 w-24 h-24 border rounded-full animate-ping ${isDark ? 'border-amber-400/15' : 'border-amber-600/25'}`} style={{animationDuration: '5s'}}></div>
        <div className={`absolute top-3/4 left-2/3 w-20 h-20 border-2 rounded-lg rotate-12 animate-pulse ${isDark ? 'border-yellow-300/12' : 'border-yellow-700/20'}`} style={{animationDuration: '6s'}}></div>
        
        {/* Moving lines - theme aware */}
        <div className={`absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-yellow-500/20' : 'via-yellow-600/15'}`}></div>
        <div className={`absolute bottom-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-amber-400/15' : 'via-amber-600/12'}`}></div>
      </div>
    </>
  );
};