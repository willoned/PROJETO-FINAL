import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MachineProvider, useMachineContext } from './context/MachineContext';
import MachineCard from './components/MachineCard';
import ConnectionBadge from './components/ConnectionBadge';
import AnnouncementsTicker from './components/AnnouncementsTicker';
import MediaPanel from './components/MediaPanel';
import SettingsPanel from './components/SettingsPanel';
import PartyOverlay from './components/PartyOverlay';
import { LayoutDashboard, Clock, Settings, Grid3X3, Beer, PartyPopper } from 'lucide-react';
import { LineConfig } from './types';

const Header = () => {
  const { connectionStatus, isStale, toggleSettings, layout } = useMachineContext();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className={`flex justify-between items-center p-4 border-b sticky top-0 z-50 h-20 shrink-0 select-none transition-colors duration-500 ${layout.isPartyMode ? 'bg-purple-950/80 border-purple-500/50' : 'bg-brewery-bg border-brewery-border'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg shadow-lg hidden md:block transition-colors duration-500 ${layout.isPartyMode ? 'bg-purple-600 shadow-purple-500/50 animate-bounce' : 'bg-brewery-accent shadow-amber-500/20'}`}>
            {layout.isPartyMode ? <PartyPopper className="text-white" size={24} /> : <Beer className="text-black" size={24} />}
        </div>
        <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {layout.isPartyMode ? (
                  <span className="text-purple-300 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]">FESTA NA CERVEJARIA</span>
              ) : (
                  <>Cervejaria <span className="text-brewery-accent">MasterView</span></>
              )}
            </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
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

const ResizableSplitLayout = () => {
  const { machines, announcements, layout, updateLayout, lineConfigs, updateLine, toggleSettings } = useMachineContext();
  const [isResizingSplitter, setIsResizingSplitter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // -- CANVAS DRAG STATE --
  const [dragState, setDragState] = useState<{
    id: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({ id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // -- SPLITTER RESIZE LOGIC --
  const handleSplitterMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSplitter(true);
  };

  const handleSplitterMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingSplitter || !containerRef.current) return;
    
    requestAnimationFrame(() => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      let newPercent = 50;

      if (layout.splitDirection === 'HORIZONTAL') {
          const offsetX = e.clientX - containerRect.left;
          newPercent = (offsetX / containerRect.width) * 100;
      } else {
          const offsetY = e.clientY - containerRect.top;
          newPercent = (offsetY / containerRect.height) * 100;
      }
      
      if (layout.panelOrder === 'DASHBOARD_FIRST') newPercent = 100 - newPercent;
      newPercent = Math.max(20, Math.min(newPercent, 80));
      updateLayout({ mediaPanelSize: newPercent });
    });
  }, [isResizingSplitter, layout.splitDirection, layout.panelOrder, updateLayout]);

  const handleSplitterMouseUp = useCallback(() => {
    setIsResizingSplitter(false);
  }, []);

  // -- CANVAS CARD MOVE LOGIC --
  const handleCardDragStart = (e: React.MouseEvent, line: LineConfig) => {
    e.stopPropagation(); // Prevent bubbling
    setDragState({
      id: line.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: line.x,
      initialY: line.y
    });
  };

  const handleCardMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.id) return;

    requestAnimationFrame(() => {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        
        // Snap to grid logic (e.g., 10px)
        const snap = 10;
        let newX = dragState.initialX + deltaX;
        let newY = dragState.initialY + deltaY;
        
        newX = Math.round(newX / snap) * snap;
        newY = Math.round(newY / snap) * snap;

        updateLine(dragState.id!, { x: newX, y: newY });
    });
  }, [dragState, updateLine]);

  const handleCardMouseUp = useCallback(() => {
    setDragState({ id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });
  }, []);


  // -- GLOBAL EVENT LISTENERS --
  useEffect(() => {
    if (isResizingSplitter) {
      window.addEventListener('mousemove', handleSplitterMouseMove);
      window.addEventListener('mouseup', handleSplitterMouseUp);
      document.body.style.cursor = layout.splitDirection === 'HORIZONTAL' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    } else if (dragState.id) {
      window.addEventListener('mousemove', handleCardMouseMove);
      window.addEventListener('mouseup', handleCardMouseUp);
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleSplitterMouseMove);
      window.removeEventListener('mouseup', handleSplitterMouseUp);
      window.removeEventListener('mousemove', handleCardMouseMove);
      window.removeEventListener('mouseup', handleCardMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingSplitter, dragState.id, handleSplitterMouseMove, handleSplitterMouseUp, handleCardMouseMove, handleCardMouseUp, layout.splitDirection]);

  // Determine container flex direction
  const containerClass = layout.splitDirection === 'HORIZONTAL' ? 'flex-row' : 'flex-col';
  const mediaStyle = layout.splitDirection === 'HORIZONTAL' 
    ? { width: `${layout.mediaPanelSize}%`, height: '100%' }
    : { height: `${layout.mediaPanelSize}%`, width: '100%' };

  const MediaSection = (
     <section 
        style={mediaStyle} 
        className={`hidden lg:flex flex-col transition-[width,height] duration-75 ease-linear shrink-0 ${!layout.showMediaPanel ? '!hidden' : ''}`}
      >
        <div className={`flex-1 rounded-xl shadow-xl overflow-hidden border relative ${layout.isPartyMode ? 'border-purple-500 shadow-purple-500/20' : 'bg-brewery-card border-brewery-border'}`}>
            {isResizingSplitter && <div className="absolute inset-0 z-50 bg-transparent" />}
            <MediaPanel />
        </div>
      </section>
  );

  const Resizer = (
    <div 
      className={`
        hidden lg:flex items-center justify-center bg-transparent z-20 shrink-0
        ${layout.splitDirection === 'HORIZONTAL' ? 'w-4 cursor-col-resize flex-col h-full' : 'h-4 cursor-row-resize w-full'}
        ${isResizingSplitter ? 'bg-white/5' : 'hover:bg-white/5'}
      `}
      onMouseDown={handleSplitterMouseDown}
    >
        <div className={`bg-brewery-border rounded-full flex items-center justify-center gap-1 ${layout.splitDirection === 'HORIZONTAL' ? 'w-1 h-12 flex-col' : 'h-1 w-12 flex-row'}`}>
            <div className="w-0.5 h-0.5 bg-brewery-muted rounded-full" />
            <div className="w-0.5 h-0.5 bg-brewery-muted rounded-full" />
            <div className="w-0.5 h-0.5 bg-brewery-muted rounded-full" />
        </div>
    </div>
  );

  const DashboardSection = (
    <section className="flex-1 overflow-hidden flex flex-col h-full w-full min-w-0 min-h-0 relative bg-black/20">
        {/* Background Grid Pattern for Canvas feel */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="flex-1 overflow-auto relative custom-scrollbar p-4">
            {/* CANVAS AREA */}
            <div className="w-[3000px] h-[2000px] relative"> 
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
                                onMouseDown: (e: React.MouseEvent) => handleCardDragStart(e, config)
                            }}
                        />
                    </div>
                ))}
                
                {lineConfigs.length === 0 && (
                    <div className="absolute top-10 left-10 w-96 h-64 flex flex-col items-center justify-center text-brewery-muted border-2 border-dashed border-brewery-border rounded-xl bg-brewery-card/50">
                        <Grid3X3 size={48} className="mb-4 opacity-50" />
                        <p>Planta da Cervejaria (Modo Canvas)</p>
                        <p className="text-xs mt-2">Adicione tanques nas configurações.</p>
                        <button onClick={toggleSettings} className="mt-4 text-brewery-accent hover:underline">Abrir Configurações</button>
                    </div>
                )}
            </div>
        </div>
    </section>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {layout.showTicker && <AnnouncementsTicker announcements={announcements} />}

      <div ref={containerRef} className={`flex-1 overflow-hidden p-4 flex ${containerClass} relative`}>
        {/* PARTY OVERLAY */}
        {layout.isPartyMode && <PartyOverlay effect={layout.partyEffect} />}

        {layout.panelOrder === 'MEDIA_FIRST' ? (
            <>
                {MediaSection}
                {layout.showMediaPanel && Resizer}
                {DashboardSection}
            </>
        ) : (
             <>
                {DashboardSection}
                {layout.showMediaPanel && Resizer}
                {MediaSection}
            </>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <MachineProvider>
      <div className="h-screen bg-brewery-bg flex flex-col font-sans selection:bg-brewery-accent/30 overflow-hidden text-brewery-text">
        <Header />
        <div className="flex-1 overflow-hidden">
          <ResizableSplitLayout />
        </div>
        <SettingsPanel />
      </div>
    </MachineProvider>
  );
};

export default App;