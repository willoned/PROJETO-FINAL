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

  // Safety check using default empty object if header is undefined during migrations
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
        className={`flex justify-between items-center p-4 border-b sticky top-0 z-50 h-20 shrink-0 select-none transition-colors duration-500 relative`}
        style={{
            backgroundColor: layout.isPartyMode ? '#3b0764' : backgroundColor,
            borderColor: '#452c20'
        }}
    >
      {/* BRANDING WATERMARK - OVERLAY EVERYTHING */}
      <div className={`absolute ${watermarkPositionClass} flex flex-col justify-center pointer-events-none select-none z-[60] opacity-40 transition-all duration-500 mix-blend-screen`}>
          <span className="font-mono font-black text-lg text-white tracking-widest leading-none drop-shadow-lg">&lt;ITF-TEch/&gt;</span>
          <span className="text-[9px] text-white uppercase tracking-[0.2em] font-medium mt-0.5 leading-none drop-shadow-md">Produced by Willon Eduardo</span>
      </div>

      {/* Left / Center Container Logic */}
      <div className={`flex items-center gap-4 flex-1 ${alignment === 'CENTER' ? 'justify-center' : 'justify-start'} z-10 relative`}>
        
        {/* TEXT AREA */}
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

const TopMediaBanner = () => {
    const { layout, updateLayout } = useMachineContext();
    const [isResizing, setIsResizing] = useState(false);
    const startY = useRef(0);
    const startH = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        startY.current = e.clientY;
        startH.current = layout.header?.topMediaHeight || 200;
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

    if (!layout.header?.showTopMedia) return null;

    const borderWidth = layout.header.topMediaBorderWidth ?? 1;

    return (
        <div 
            style={{ 
                height: layout.header.topMediaHeight,
                borderTopWidth: borderWidth,
                borderBottomWidth: borderWidth
            }} 
            className="w-full relative shrink-0 border-brewery-border bg-black group"
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

// Resizable Wrapper for the Ticker
const ResizableTicker = ({ children }: { children?: React.ReactNode }) => {
    const { layout, updateLayout } = useMachineContext();
    const [isResizing, setIsResizing] = useState(false);
    const startY = useRef(0);
    const startH = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        startY.current = e.clientY;
        startH.current = layout.tickerHeight || 60;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        requestAnimationFrame(() => {
            const deltaY = e.clientY - startY.current;
            const newHeight = Math.max(40, Math.min(200, startH.current + deltaY));
            updateLayout({ tickerHeight: newHeight });
        });
    }, [isResizing, updateLayout]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    if (!layout.showTicker) return null;

    return (
        <div className="relative group shrink-0">
             {children}
             {/* Resize Handle for Ticker (Bottom) */}
             <div 
                className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize hover:bg-brewery-accent/50 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={handleMouseDown}
            />
        </div>
    );
};

const CanvasLayout = () => {
  const { machines, announcements, layout, updateLayout, lineConfigs, updateLine, toggleSettings, updateWindow } = useMachineContext();
  
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
  // Updated to include ID for multiple media windows
  const [isResizing, setIsResizing] = useState<{ type: 'MEDIA' | 'LOGO' | null; id?: string }>({ type: null });
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
  const handleResizeStart = (e: React.MouseEvent, type: 'MEDIA' | 'LOGO', id?: string) => {
    e.stopPropagation();
    setIsResizing({ type, id });
    
    // Determine initial dimensions based on type and id
    let initialW = 0;
    let initialH = 0;

    if (type === 'LOGO') {
        initialW = layout.logoWidget.w;
        initialH = layout.logoWidget.h;
    } else if (type === 'MEDIA' && id) {
        const win = layout.floatingWindows.find(w => w.id === id);
        if (win) {
            initialW = win.w;
            initialH = win.h;
        }
    }

    resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: initialW,
        h: initialH
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
            } else if (dragState.type === 'MEDIA' && dragState.id) {
                // Update specific floating window
                updateWindow(dragState.id, { x: newX, y: newY });
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

            if (isResizing.type === 'MEDIA' && isResizing.id) {
                updateWindow(isResizing.id, { w: newW, h: newH });
            } else if (isResizing.type === 'LOGO') {
                updateLayout({ logoWidget: { ...layout.logoWidget, w: newW, h: newH } });
            }
        });
    }

  }, [dragState, updateLine, updateLayout, updateWindow, layout.logoWidget, isResizing]);

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

      {/* 2. TICKER (Resizable) */}
      <ResizableTicker>
         <AnnouncementsTicker announcements={announcements} />
      </ResizableTicker>

      {/* 3. MAIN DASHBOARD AREA */}
      <div className="flex-1 overflow-hidden p-4 relative bg-black/20">
        {/* PARTY OVERLAY */}
        {layout.isPartyMode && <PartyOverlay effect={layout.partyEffect} />}

        {/* FLOATING LOGO WIDGET */}
        {layout.logoWidget?.show && (
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

        {/* FLOATING MEDIA WINDOWS (Multiple) */}
        {layout.showMediaPanel && layout.floatingWindows.map(win => (
            <div 
                key={win.id}
                style={{
                    position: 'absolute',
                    left: win.x,
                    top: win.y,
                    width: win.w,
                    height: win.h,
                    zIndex: 100 + (dragState.id === win.id ? 10 : 0) // Bring to front when dragging
                }}
                className={`rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border transition-shadow duration-200 group ${layout.isPartyMode ? 'border-purple-500 shadow-purple-500/20' : 'bg-brewery-card border-brewery-accent/50'}`}
            >
                {/* Drag Handle Bar - Hides if windows are locked */}
                {!layout.areWindowsLocked && (
                    <div 
                        className="h-6 bg-black/60 flex items-center justify-center cursor-move opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 z-50 backdrop-blur-sm"
                        onMouseDown={(e) => handleDragStart(e, 'MEDIA', win.id, win.x, win.y)}
                    >
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>
                )}

                <MediaPanel playlistKey={win.id} />

                {/* Name Badge (Optional, mostly for Settings mode) */}
                <div className="absolute top-1 left-2 pointer-events-none z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white/50 bg-black/50 px-1 rounded">{win.name}</span>
                </div>

                {/* Resize Handle - Hides if windows are locked */}
                {!layout.areWindowsLocked && (
                    <div 
                        className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-0.5 cursor-nwse-resize text-white/50 hover:text-white z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleResizeStart(e, 'MEDIA', win.id)}
                    >
                        <Scaling size={14} className="transform rotate-90" />
                    </div>
                )}
            </div>
        ))}

        {/* DASHBOARD CANVAS - INCREASED SIZE FOR 50" SCREENS */}
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none w-[5000px] h-[3000px]" 
                style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="w-[5000px] h-[3000px] relative p-4"> 
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
                        className={`transition-all duration-75 ${dragState.id === config.id ? 'scale-[1.01] shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[60]' : ''}`}
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
      <div className="flex flex-col h-screen bg-brewery-bg text-white font-sans overflow-hidden">
        <Header />
        <div className="flex-1 overflow-hidden relative">
          <CanvasLayout />
        </div>
      </div>
    </MachineProvider>
  );
};

export default App;