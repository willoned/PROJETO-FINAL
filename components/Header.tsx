import React from 'react';
import { Clock, Settings } from 'lucide-react';
import { useLayoutContext } from '../context/LayoutContext';
import { useDataContext } from '../context/DataContext';
import ConnectionBadge from './ConnectionBadge';

const Header = () => {
  const { toggleSettings, layout } = useLayoutContext();
  const { connectionStatus, isStale } = useDataContext();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { title, subtitle, textColor, backgroundColor, alignment } = layout.header || { 
      title: 'Industrial Viewport', 
      subtitle: '', 
      textColor: '#ffffff', 
      backgroundColor: '#1a110d', 
      alignment: 'LEFT' 
  };

  const watermarkPositionClass = alignment === 'CENTER' 
      ? "left-6 top-1/2 -translate-y-1/2 items-start text-left" 
      : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center text-center";

  return (
    <header 
        className="flex justify-between items-center p-4 border-b sticky top-0 z-50 h-20 shrink-0 select-none transition-colors duration-500 relative border-brewery-border"
        style={{
            backgroundColor: layout.isPartyMode ? '#3b0764' : backgroundColor,
        }}
    >
      <div className={`absolute ${watermarkPositionClass} flex flex-col justify-center pointer-events-none select-none z-[60] opacity-40 transition-all duration-500 mix-blend-screen`}>
          <span className="font-mono font-black text-lg text-white tracking-widest leading-none drop-shadow-lg">&lt;ITF-TEch/&gt;</span>
          <span className="text-[9px] text-white uppercase tracking-[0.2em] font-medium mt-0.5 leading-none drop-shadow-md">Produced by Willon Eduardo</span>
      </div>

      <div className={`flex items-center gap-4 flex-1 ${alignment === 'CENTER' ? 'justify-center' : 'justify-start'} z-10 relative`}>
        <div className={alignment === 'CENTER' ? 'text-center' : 'text-left'}>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: textColor }}>
              {layout.isPartyMode ? (
                  <span className="text-purple-300 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)] uppercase">
                      {layout.partyMessage || 'FESTA NA CERVEJARIA'}
                  </span>
              ) : (
                  <span>{title}</span>
              )}
            </h1>
            {!layout.isPartyMode && subtitle && (
                <p className="text-xs font-mono uppercase tracking-widest opacity-60" style={{ color: textColor }}>{subtitle}</p>
            )}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6 absolute right-4 z-10">
        <ConnectionBadge status={connectionStatus} isStale={isStale} />
        
        <div className="text-right hidden lg:block">
            <div className="flex items-center justify-end text-brewery-text font-mono text-lg font-bold">
                <Clock size={16} className={`mr-2 ${layout.isPartyMode ? 'text-purple-400' : 'text-brewery-accent'}`} />
                {time.toLocaleTimeString()}
            </div>
        </div>

        <button 
        onClick={toggleSettings}
        className="p-2 bg-black/30 hover:bg-black/50 rounded-lg text-brewery-muted hover:text-white transition border border-brewery-border hover:border-brewery-accent"
        title="Configurações"
        >
        <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;