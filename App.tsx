import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LayoutProvider, useLayoutContext } from './context/LayoutContext';
import { DataProvider, useDataContext } from './context/DataContext';
import MachineCard from './components/MachineCard';
import AnnouncementsTicker from './components/AnnouncementsTicker';
import MediaPanel from './components/MediaPanel';
import SettingsPanel from './components/SettingsPanel';
import PartyOverlay from './components/PartyOverlay';
import AlertOverlay from './components/AlertOverlay';
import Header from './components/Header';
import ErrorToast from './components/ErrorToast';
import TopMediaBanner from './components/TopMediaBanner';
import { Grid3X3, Beer, PartyPopper, Scaling } from 'lucide-react';

// Resizable Wrapper for the Ticker
const ResizableTicker = ({ children }: { children?: React.ReactNode }) => {
    const { layout, updateLayout } = useLayoutContext();
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
             <div 
                className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize hover:bg-brewery-accent/50 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={handleMouseDown}
            />
        </div>
    );
};

const CanvasLayout = () => {
  const { announcements, layout, updateLayout, lineConfigs, updateLine, toggleSettings, updateWindow } = useLayoutContext();
  const { machines } = useDataContext();
  
  const [dragState, setDragState] = useState<{
    type: 'CARD' | 'MEDIA' | 'LOGO' | null;
    id: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({ type: null, id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const [isResizing, setIsResizing] = useState<{ type: 'MEDIA' | 'LOGO' | null; id?: string }>({ type: null });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

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

  const handleResizeStart = (e: React.MouseEvent, type: 'MEDIA' | 'LOGO', id?: string) => {
    e.stopPropagation();
    setIsResizing({ type, id });
    
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
    if (dragState.type) {
        requestAnimationFrame(() => {
            const deltaX = e.clientX - dragState.startX;
            const deltaY = e.clientY - dragState.startY;
            const snap = 10;
            let newX = dragState.initialX + deltaX;
            let newY = dragState.initialY + deltaY;
            newX = Math.round(newX / snap) * snap;
            newY = Math.round(newY / snap) * snap;

            if (dragState.type === 'CARD' && dragState.id) {
                updateLine(dragState.id, { x: newX, y: newY });
            } else if (dragState.type === 'MEDIA' && dragState.id) {
                updateWindow(dragState.id, { x: newX, y: newY });
            } else if (dragState.type === 'LOGO') {
                updateLayout({ logoWidget: { ...layout.logoWidget, x: newX, y: newY } });
            }
        });
    }

    if (isResizing.type) {
        requestAnimationFrame(() => {
            const deltaX = e.clientX - resizeStart.current.x;
            const deltaY = e.clientY - resizeStart.current.y;
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

      <TopMediaBanner />

      <ResizableTicker>
         <AnnouncementsTicker announcements={announcements} />
      </ResizableTicker>

      <div className="flex-1 overflow-hidden p-4 relative bg-black/20">
        {layout.isPartyMode && <PartyOverlay effect={layout.partyEffect} />}

        {layout.logoWidget?.show && (
            <div
                style={{
                    position: 'absolute',
                    left: layout.logoWidget.x,
                    top: layout.logoWidget.y,
                    width: layout.logoWidget.w,
                    height: layout.logoWidget.h,
                    zIndex: 90
                }}
                className={`group flex items-center justify-center hover:ring-2 ring-brewery-accent/50 rounded-lg transition-all`}
            >
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
                    <div className="flex flex-col items-center justify-center opacity-50 pointer-events-none">
                       {layout.isPartyMode ? <PartyPopper className="text-purple-400" size="50%" /> : <Beer className="text-brewery-accent" size="50%" />}
                    </div>
                )}

                <div 
                    className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-0.5 cursor-nwse-resize text-white/50 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-tl"
                    onMouseDown={(e) => handleResizeStart(e, 'LOGO')}
                >
                    <Scaling size={12} className="transform rotate-90" />
                </div>
            </div>
        )}

        {layout.showMediaPanel && layout.floatingWindows.map(win => (
            <div 
                key={win.id}
                style={{
                    position: 'absolute',
                    left: win.x,
                    top: win.y,
                    width: win.w,
                    height: win.h,
                    zIndex: 100 + (dragState.id === win.id ? 10 : 0)
                }}
                className={`rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border transition-shadow duration-200 group ${layout.isPartyMode ? 'border-purple-500 shadow-purple-500/20' : 'bg-brewery-card border-brewery-accent/50'}`}
            >
                {!layout.areWindowsLocked && (
                    <div 
                        className="h-6 bg-black/60 flex items-center justify-center cursor-move opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 z-50 backdrop-blur-sm"
                        onMouseDown={(e) => handleDragStart(e, 'MEDIA', win.id, win.x, win.y)}
                    >
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>
                )}

                <MediaPanel playlistKey={win.id} />

                <div className="absolute top-1 left-2 pointer-events-none z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white/50 bg-black/50 px-1 rounded">{win.name}</span>
                </div>

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

        {/* DASHBOARD CANVAS */}
        <div className="absolute inset-0 overflow-auto custom-scrollbar">
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
  // BROWSER KIOSK PROTECTION
  useEffect(() => {
    // 1. Prevent Right Click
    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
    };

    // 2. Prevent Developer Tools Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
        // F12
        if (e.key === 'F12') {
            e.preventDefault();
        }
        // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
        }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <LayoutProvider>
      <DataProvider>
        <div className="flex flex-col h-screen bg-brewery-bg text-white font-sans overflow-hidden">
          <Header />
          <div className="flex-1 overflow-hidden relative">
            <CanvasLayout />
          </div>
        </div>
      </DataProvider>
    </LayoutProvider>
  );
};

export default App;