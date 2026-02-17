import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MachineProvider, useMachineContext } from './context/MachineContext';
import MachineCard from './components/MachineCard';
import AnnouncementsTicker from './components/AnnouncementsTicker';
import MediaPanel from './components/MediaPanel';
import SettingsPanel from './components/SettingsPanel';
import PartyOverlay from './components/PartyOverlay';
import AlertOverlay from './components/AlertOverlay';
import { Grid3X3, Beer, PartyPopper, Scaling, Settings, Clock, Wifi, WifiOff, RefreshCw, AlertTriangle, Lock, Unlock, Move } from 'lucide-react';

// --- Internal Header Component ---
const InternalHeader = () => {
    const { layout, toggleSettings, connectionStatus, isEditing, setEditing } = useMachineContext();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const { title, subtitle, textColor, backgroundColor } = layout.header;

    return (
        <header 
            className="flex justify-between items-center p-4 border-b h-20 shrink-0 select-none transition-colors duration-500 border-brewery-border"
            style={{ backgroundColor: layout.isPartyMode ? '#3b0764' : backgroundColor }}
        >
            <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                    {layout.isPartyMode ? (layout.partyMessage || 'FESTA!') : title}
                </h1>
                {!layout.isPartyMode && subtitle && <p className="text-xs uppercase opacity-60" style={{ color: textColor }}>{subtitle}</p>}
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                {connectionStatus === 'CONNECTED' ? 
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500"><Wifi size={16}/><span className="text-xs font-bold">ONLINE</span></div> :
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-500"><WifiOff size={16}/><span className="text-xs font-bold">OFFLINE</span></div>
                }
                
                <div className="hidden md:flex items-center font-mono text-lg font-bold text-brewery-text">
                    <Clock size={16} className="mr-2 text-brewery-accent" />
                    {time.toLocaleTimeString()}
                </div>

                <div className="h-8 w-px bg-white/10 mx-2"></div>

                <button 
                    onClick={() => setEditing(!isEditing)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isEditing ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-black/30 text-brewery-muted border-brewery-border hover:text-white hover:bg-black/50'}`}
                    title={isEditing ? "Salvar Layout (Bloquear)" : "Editar Layout (Mover Painéis)"}
                >
                    {isEditing ? <Unlock size={20} /> : <Lock size={20} />}
                    <span className="text-xs font-bold uppercase hidden md:inline">{isEditing ? 'Desbloqueado' : 'Bloqueado'}</span>
                </button>

                <button onClick={toggleSettings} className="p-2 bg-black/30 hover:bg-black/50 rounded-lg text-brewery-muted hover:text-white border border-brewery-border">
                    <Settings size={20} />
                </button>
            </div>
        </header>
    );
};

const CanvasLayout = () => {
  const { announcements, layout, lineConfigs, updateLine, updateLayout, updateWindow, isEditing, machines } = useMachineContext();
  
  const [dragState, setDragState] = useState<{ type: 'CARD' | 'MEDIA' | 'LOGO' | null; id: string | null; startX: number; startY: number; initialX: number; initialY: number; }>({ type: null, id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const [isResizing, setIsResizing] = useState<{ type: 'MEDIA' | 'LOGO' | null; id?: string }>({ type: null });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleDragStart = (e: React.MouseEvent, type: 'CARD' | 'MEDIA' | 'LOGO', id: string | null, initialX: number, initialY: number) => {
    if (!isEditing) return;
    e.stopPropagation();
    setDragState({ type, id, startX: e.clientX, startY: e.clientY, initialX, initialY });
  };

  const handleResizeStart = (e: React.MouseEvent, type: 'MEDIA' | 'LOGO', id?: string) => {
    if (!isEditing) return;
    e.stopPropagation();
    setIsResizing({ type, id });
    let initialW = 0, initialH = 0;
    if (type === 'LOGO') { initialW = layout.logoWidget.w; initialH = layout.logoWidget.h; }
    else if (type === 'MEDIA' && id) { const win = layout.floatingWindows.find(w => w.id === id); if (win) { initialW = win.w; initialH = win.h; } }
    resizeStart.current = { x: e.clientX, y: e.clientY, w: initialW, h: initialH };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragState.type) {
        requestAnimationFrame(() => {
            const deltaX = e.clientX - dragState.startX;
            const deltaY = e.clientY - dragState.startY;
            const snap = 10;
            const newX = Math.round((dragState.initialX + deltaX) / snap) * snap;
            const newY = Math.round((dragState.initialY + deltaY) / snap) * snap;

            if (dragState.type === 'CARD' && dragState.id) updateLine(dragState.id, { x: newX, y: newY });
            else if (dragState.type === 'MEDIA' && dragState.id) updateWindow(dragState.id, { x: newX, y: newY });
            else if (dragState.type === 'LOGO') updateLayout({ logoWidget: { ...layout.logoWidget, x: newX, y: newY } });
        });
    }
    if (isResizing.type) {
        requestAnimationFrame(() => {
            const deltaX = e.clientX - resizeStart.current.x;
            const deltaY = e.clientY - resizeStart.current.y;
            const newW = Math.max(50, resizeStart.current.w + deltaX);
            const newH = Math.max(50, resizeStart.current.h + deltaY);
            if (isResizing.type === 'MEDIA' && isResizing.id) updateWindow(isResizing.id, { w: newW, h: newH });
            else if (isResizing.type === 'LOGO') updateLayout({ logoWidget: { ...layout.logoWidget, w: newW, h: newH } });
        });
    }
  }, [dragState, updateLine, updateLayout, updateWindow, layout, isResizing]);

  const handleMouseUp = useCallback(() => {
    setDragState({ type: null, id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    setIsResizing({ type: null });
  }, []);

  useEffect(() => {
    if (dragState.type || isResizing.type) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing.type ? 'nwse-resize' : 'move';
    } else {
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.type, isResizing.type, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <AlertOverlay />
      {layout.showTicker && <div style={{ height: layout.tickerHeight }} className="shrink-0"><AnnouncementsTicker announcements={announcements} /></div>}

      <div className="flex-1 overflow-hidden p-4 relative bg-black/20">
        {layout.isPartyMode && <PartyOverlay effect={layout.partyEffect} />}

        {layout.logoWidget?.show && (
            <div
                style={{ position: 'absolute', left: layout.logoWidget.x, top: layout.logoWidget.y, width: layout.logoWidget.w, height: layout.logoWidget.h, zIndex: 90 }}
                className={`group flex items-center justify-center ${isEditing ? 'hover:ring-2 ring-brewery-accent/50 cursor-move bg-white/5' : ''}`}
                onMouseDown={(e) => handleDragStart(e, 'LOGO', null, layout.logoWidget.x, layout.logoWidget.y)}
            >
                {layout.logoWidget.url ? <img src={layout.logoWidget.url} className="w-full h-full object-contain pointer-events-none" /> : 
                <div className="flex items-center justify-center opacity-50"><Beer className="text-brewery-accent" size="50%" /></div>}
                {isEditing && <div className="absolute bottom-0 right-0 w-6 h-6 p-0.5 cursor-nwse-resize text-white/50 hover:text-white z-20 bg-black/20 rounded-tl" onMouseDown={(e) => handleResizeStart(e, 'LOGO')}><Scaling size={12} className="transform rotate-90" /></div>}
            </div>
        )}

        {layout.showMediaPanel && layout.floatingWindows.map(win => (
            <div key={win.id} style={{ position: 'absolute', left: win.x, top: win.y, width: win.w, height: win.h, zIndex: 100 }} className="rounded-xl shadow-2xl flex flex-col overflow-hidden border bg-brewery-card border-brewery-accent/50 group">
                {isEditing && <div className="h-8 bg-black/80 cursor-move absolute top-0 left-0 right-0 z-50 flex items-center justify-center text-xs text-zinc-400 font-bold uppercase tracking-widest border-b border-white/10 hover:bg-brewery-accent hover:text-black transition-colors" onMouseDown={(e) => handleDragStart(e, 'MEDIA', win.id, win.x, win.y)}><Move size={12} className="mr-2"/> Janela: {win.name}</div>}
                <MediaPanel playlistKey={win.id} />
                {isEditing && <div className="absolute bottom-0 right-0 w-6 h-6 p-0.5 cursor-nwse-resize text-white z-50 bg-black/40 rounded-tl" onMouseDown={(e) => handleResizeStart(e, 'MEDIA', win.id)}><Scaling size={14} className="transform rotate-90" /></div>}
            </div>
        ))}

        <div className="absolute inset-0 overflow-auto custom-scrollbar bg-black/5">
            {isEditing && <div className="absolute inset-0 z-0 opacity-10 pointer-events-none w-[3000px] h-[3000px]" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>}
            <div className="w-[3000px] h-[3000px] relative p-4"> 
                {lineConfigs.map((config) => (
                    <div key={config.id} style={{ position: 'absolute', left: config.x, top: config.y, width: config.w, height: config.h, zIndex: dragState.id === config.id ? 50 : 10 }} className={dragState.id === config.id ? 'z-50 shadow-2xl' : ''}>
                        <MachineCard config={config} data={machines[config.id]} dragHandleProps={{ onMouseDown: (e: React.MouseEvent) => handleDragStart(e, 'CARD', config.id, config.x, config.y), style: { cursor: isEditing ? 'move' : 'default', opacity: isEditing ? 1 : 0.5 } }} />
                    </div>
                ))}
            </div>
        </div>
      </div>
      <SettingsPanel />
    </div>
  );
};

const Main: React.FC = () => {
    return (
        <div className="flex flex-col h-screen bg-brewery-bg text-white font-sans overflow-hidden">
            <InternalHeader />
            <div className="flex-1 overflow-hidden relative"><CanvasLayout /></div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <MachineProvider>
        <Main />
    </MachineProvider>
  );
};

export default App;