import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MachineProvider, useMachineContext } from './context/MachineContext';
import MachineCard from './components/MachineCard';
import ConnectionBadge from './components/ConnectionBadge';
import AnnouncementsTicker from './components/AnnouncementsTicker';
import MediaPanel from './components/MediaPanel';
import SettingsPanel from './components/SettingsPanel';
import PartyOverlay from './components/PartyOverlay';
import AlertOverlay from './components/AlertOverlay';
import { LayoutDashboard, Clock, Settings, Grid3X3, Beer, PartyPopper, Move, Scaling, GripHorizontal, XCircle } from 'lucide-react';
import { LineConfig } from './types';

// Error Toast Component
const ErrorToast = () => {
    const { globalError, clearError } = useMachineContext();

    if (!globalError) return null;

    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300 w-full max-w-md px-4">
            <div className="bg-rose-950/90 border border-rose-500 text-white rounded-lg shadow-2xl p-4 flex items-start gap-3 backdrop-blur-md">
                <XCircle className="text-rose-400 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                    <h4 className="font-bold text-sm">Erro de Conexão</h4>
                    <p className="text-xs text-rose-200 mt-1">{globalError}</p>
                </div>
                <button 
                    onClick={clearError}
                    className="text-rose-400 hover:text-white transition-colors"
                >
                    <span className="sr-only">Fechar</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    );
};

const Header = () => {
  const { connectionStatus, isStale, toggleSettings, layout } = useMachineContext();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { title, subtitle, textColor, backgroundColor, alignment } = layout.header;

  return (
    <header 
        className={`flex justify-between items-center p-4 border-b sticky top-0 z-50 h-20 shrink-0 select-none transition-colors duration-500`}
        style={{
            backgroundColor: layout.isPartyMode ? '#3b0764' : backgroundColor,
            borderColor: '#452c20'
        }}
    >
      {/* Left / Center Container Logic */}
      <div className={`flex items-center gap-4 flex-1 ${alignment === 'CENTER' ? 'justify-center' : 'justify-start'}`}>
        
        {/* TEXT AREA */}
        <div className={alignment === 'CENTER' ? 'text-center' : 'text-left'}>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: textColor }}>
              {layout.isPartyMode ? (
                  <span className="text-purple-300 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">FESTA NA CERVEJARIA</span>
              ) : (
                  <span>{title}</span>
              )}
            </h1>
            {!layout.isPartyMode && subtitle && (
                <p className="text-xs font-mono uppercase tracking-widest opacity-60" style={{ color: textColor }}>{subtitle}</p>
            )}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6 absolute right-4">
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

const TopMediaBanner = () => {
    const { layout, updateLayout } = useMachineContext();
    const [isResizing, setIsResizing] = useState(false);
    const startY = useRef(0);
    const startH = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        startY.current = e.clientY;
        startH.current = layout.header.topMediaHeight;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        requestAnimationFrame(() => {
            const deltaY = e.clientY - startY.current;
            const newHeight = Math.max(100, Math.min(600, startH.current + deltaY));
            updateLayout({ header: { ...layout.header, topMediaHeight: newHeight } });
        });
    }, [isResizing, layout.header, updateLayout]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    if (!layout.header.showTopMedia) return null;

    return (
        <div 
            style={{ height: layout.header.topMediaHeight }} 
            className="w-full relative shrink-0 border-b border-brewery-border bg-black group"
        >
            <MediaPanel playlistKey="banner" />
            
            {/* Resize Handle */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-3 cursor-row-resize bg-black/50 hover:bg-brewery-accent/50 flex items-center justify-center z-50 transition-colors opacity-0 group-hover:opacity-100"
                onMouseDown={handleMouseDown}
            >
                 <div className="w-16 h-1 bg-white/30 rounded-full" />
            </div>
        </div>
    );
};

const CanvasLayout = () => {
  const { machines, announcements, layout, updateLayout, lineConfigs, updateLine, toggleSettings } = useMachineContext();
  
  // -- CANVAS DRAG STATE --
  const [dragState, setDragState] = useState<{
    type: 'CARD' | 'MEDIA' | 'LOGO' | null;
    id: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({ type: null, id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // -- RESIZE STATE (Generic) --
  const [isResizing, setIsResizing] = useState<{ type: 'MEDIA' | 'LOGO' | null }>({ type: null });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // -- CARD MOVE LOGIC --
  const handleDragStart = (e: React.MouseEvent, type: 'CARD' | 'MEDIA' | 'LOGO', id: string | null, initialX: number, initialY: number) => {
    e.stopPropagation();
    setDragState({
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX,
      initialY
    });
  };

  // -- RESIZE START LOGIC --
  const handleResizeStart = (e: React.MouseEvent, type: 'MEDIA' | 'LOGO') => {
    e.stopPropagation();
    setIsResizing({ type });
    resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: type === 'MEDIA' ? layout.mediaWindow.w : layout.logoWidget.w,
        h: type === 'MEDIA' ? layout.mediaWindow.h : layout.logoWidget.h
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // 1. Handling Drag (Move)
    if (dragState.type) {
        requestAnimationFrame(() => {
            const deltaX = e.clientX - dragState.startX;
            const deltaY = e.clientY - dragState.startY;
            
            // Snap to grid logic (e.g., 10px)
            const snap = 10;
            let newX = dragState.initialX + deltaX;
            let newY = dragState.initialY + deltaY;
            newX = Math.round(newX / snap) * snap;
            newY = Math.round(newY / snap) * snap;

            if (dragState.type === 'CARD' && dragState.id) {
                updateLine(dragState.id, { x: newX, y: newY });
            } else if (dragState.type === 'MEDIA') {
                updateLayout({ mediaWindow: { ...layout.mediaWindow, x: newX, y: newY } });
            } else if (dragState.type === 'LOGO') {
                updateLayout({ logoWidget: { ...layout.logoWidget, x: newX, y: newY } });
            }
        });
    }

    // 2. Handling Resize (Media Window / Logo)
    if (isResizing.type) {
        requestAnimationFrame(() => {
            const deltaX = e.clientX - resizeStart.current.x;
            const deltaY = e.clientY - resizeStart.current.y;
            
            // Min sizes
            const minW = isResizing.type === 'LOGO' ? 50 : 200;
            const minH = isResizing.type === 'LOGO' ? 50 : 150;

            const newW = Math.max(minW, resizeStart.current.w + deltaX);
            const newH = Math.max(minH, resizeStart.current.h + deltaY);

            if (isResizing.type === 'MEDIA') {
                updateLayout({ mediaWindow: { ...layout.mediaWindow, w: newW, h: newH } });
            } else if (isResizing.type === 'LOGO') {
                updateLayout({ logoWidget: { ...layout.logoWidget, w: newW, h: newH } });
            }
        });
    }

  }, [dragState, updateLine, updateLayout, layout.mediaWindow, layout.logoWidget, isResizing]);

  const handleMouseUp = useCallback(() => {
    setDragState({ type: null, id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    setIsResizing({ type: null });
  }, []);

  // -- GLOBAL EVENT LISTENERS --
  useEffect(() => {
    if (dragState.type || isResizing.type) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing.type ? 'nwse-resize' : 'move';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragState.type, isResizing.type, handleMouseMove, handleMouseUp]);


  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <ErrorToast />
      <AlertOverlay />

      {/* 1. TOP MEDIA BANNER (Full Width, Resizable Height) */}
      <TopMediaBanner />

      {/* 2. TICKER */}
      {layout.showTicker && <AnnouncementsTicker announcements={announcements} />}

      {/* 3. MAIN DASHBOARD AREA */}
      <div className="flex-1 overflow-hidden p-4 relative bg-black/20">
        {/* PARTY OVERLAY */}
        {layout.isPartyMode && <PartyOverlay effect={layout.partyEffect} />}

        {/* FLOATING LOGO WIDGET */}
        {layout.logoWidget.show && (
            <div
                style={{
                    position: 'absolute',
                    left: layout.logoWidget.x,
                    top: layout.logoWidget.y,
                    width: layout.logoWidget.w,
                    height: layout.logoWidget.h,
                    zIndex: 90 // High but below media panel drag handle
                }}
                className={`group flex items-center justify-center hover:ring-2 ring-brewery-accent/50 rounded-lg transition-all`}
            >
                {/* Drag Handle (Invisible but active on hover) */}
                <div 
                    className="absolute inset-0 cursor-move z-10"
                    onMouseDown={(e) => handleDragStart(e, 'LOGO', null, layout.logoWidget.x, layout.logoWidget.y)}
                />

                {layout.logoWidget.url ? (
                    <img 
                        src={layout.logoWidget.url} 
                        className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xl"
                        alt="Logo"
                    />
                ) : (
                    // Default Fallback
                    <div className="flex flex-col items-center justify-center opacity-50 pointer-events-none">
                       {layout.isPartyMode ? <PartyPopper className="text-purple-400" size="50%" /> : <Beer className="text-brewery-accent" size="50%" />}
                    </div>
                )}

                {/* Resize Handle */}
                <div 
                    className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-0.5 cursor-nwse-resize text-white/50 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-tl"
                    onMouseDown={(e) => handleResizeStart(e, 'LOGO')}
                >
                    <Scaling size={12} className="transform rotate-90" />
                </div>
            </div>
        )}

        {/* FLOATING MEDIA WINDOW */}
        {layout.showMediaPanel && (
            <div 
                style={{
                    position: 'absolute',
                    left: layout.mediaWindow.x,
                    top: layout.mediaWindow.y,
                    width: layout.mediaWindow.w,
                    height: layout.mediaWindow.h,
                    zIndex: 100 // Always on top
                }}
                className={`rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border transition-shadow duration-200 group ${layout.isPartyMode ? 'border-purple-500 shadow-purple-500/20' : 'bg-brewery-card border-brewery-accent/50'}`}
            >
                {/* Drag Handle Bar */}
                <div 
                    className="h-6 bg-black/60 flex items-center justify-center cursor-move opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 z-50 backdrop-blur-sm"
                    onMouseDown={(e) => handleDragStart(e, 'MEDIA', null, layout.mediaWindow.x, layout.mediaWindow.y)}
                >
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <MediaPanel playlistKey="floating" />

                {/* Resize Handle */}
                <div 
                    className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-0.5 cursor-nwse-resize text-white/50 hover:text-white z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart(e, 'MEDIA')}
                >
                    <Scaling size={14} className="transform rotate-90" />
                </div>
            </div>
        )}

        {/* DASHBOARD CANVAS */}
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none w-[3000px] h-[2000px]" 
                style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="w-[3000px] h-[2000px] relative p-4"> 
                {lineConfigs.map((config) => (
                    <div 
                        key={config.id}
                        style={{
                            position: 'absolute',
                            left: config.x,
                            top: config.y,
                            width: config.w,
                            height: config.h,
                            zIndex: dragState.id === config.id ? 50 : 10
                        }}
                        className={`transition-all duration-200 ${dragState.id === config.id ? 'shadow-[0_0_20px_rgba(245,158,11,0.5)]' : ''}`}
                    >
                        <MachineCard 
                            config={config} 
                            data={machines[config.id]} 
                            dragHandleProps={{
                                onMouseDown: (e: React.MouseEvent) => handleDragStart(e, 'CARD', config.id, config.x, config.y)
                            }}
                        />
                    </div>
                ))}
                
                {lineConfigs.length === 0 && (
                    <div className="absolute top-10 left-10 w-96 h-64 flex flex-col items-center justify-center text-brewery-muted border-2 border-dashed border-brewery-border rounded-xl bg-brewery-card/50 z-0">
                        <Grid3X3 size={48} className="mb-4 opacity-50" />
                        <p>Planta da Cervejaria (Modo Canvas)</p>
                        <p className="text-xs mt-2">Adicione tanques nas configurações.</p>
                        <button onClick={toggleSettings} className="mt-4 text-brewery-accent hover:underline">Abrir Configurações</button>
                    </div>
                )}
            </div>
        </div>
      </div>
      <SettingsPanel />
    </div>
  );
};

const App: React.FC = () => {
    return (
        <MachineProvider>
            <div className="flex flex-col h-screen w-full bg-[#0f0a08] text-zinc-100 overflow-hidden font-sans">
                <Header />
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    <CanvasLayout />
                </div>
            </div>
        </MachineProvider>
    );
};

export default App;