import React, { useState, useCallback, useRef } from 'react';
import { Box, Thermometer, Zap, AlertTriangle, Scaling, Clock, Move, WifiOff } from 'lucide-react';
import { MachineData, LineConfig } from '../types';
import { STATUS_COLORS } from '../constants';
import TrendChart from './TrendChart';
import BarChart from './BarChart';
import { useMachineContext } from '../context/MachineContext';

interface Props {
  config: LineConfig;
  data?: MachineData;
  dragHandleProps?: any; 
}

const MachineCard: React.FC<Props> = ({ config, data, dragHandleProps }) => {
  const { updateLine, layout, isEditing } = useMachineContext();
  const display = config.display || { showVolume: false, showPB: false, showHourly: false, showTemp: false, showTrend: false, showBarChart: false };

  // Local resize state
  const [isResizing, setIsResizing] = useState(false);
  const startRef = useRef<{ x: number, y: number, w: number, h: number }>({ x: 0, y: 0, w: 0, h: 0 });

  // Data defaults - READING MAPPED DATA FROM CONTEXT (Normalization happens in Context)
  // The DataMapping configuration is applied in the MachineContext before data reaches here.
  // Therefore, 'data.currentHourlyRate' already holds the value from 'speedKey'.
  const status = data?.status || 'MAINTENANCE';
  const count = data?.productionCount || 0;
  const pbValue = data?.efficiency || 0;
  const hourlyRate = data?.currentHourlyRate || 0;
  const trend = data?.trend || [];
  const temp = data?.temperature || 0;

  const statusClass = STATUS_COLORS[status] || STATUS_COLORS.MAINTENANCE;
  
  // Party Mode Override
  const chartColor = layout.isPartyMode 
    ? '#a855f7' // Purple in party mode
    : (status === 'RUNNING' ? '#f59e0b' : (status === 'ALARM' ? '#ef4444' : '#78350f'));

  // --- Dynamic Visual based on Pixel Width (Responsive) ---
  const width = config.w;
  const isCompact = width < 220;
  const isLarge = width > 400;

  const cardPadding = isCompact ? 'p-2' : isLarge ? 'p-6' : 'p-4';
  const titleSize = isCompact ? 'text-xs' : isLarge ? 'text-2xl' : 'text-lg';
  const idSize = isCompact ? 'text-[10px]' : 'text-xs';
  const metricLabelSize = isCompact ? 'text-[9px]' : 'text-[10px]';
  const metricValueSize = isCompact ? 'text-lg' : isLarge ? 'text-4xl' : 'text-2xl';
  const iconSize = isCompact ? 10 : 12;

  // --- Pixel Resize Logic ---
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startRef.current = { 
        x: e.clientX, 
        y: e.clientY, 
        w: config.w, 
        h: config.h 
    };
    
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    requestAnimationFrame(() => {
        const deltaX = e.clientX - startRef.current.x;
        const deltaY = e.clientY - startRef.current.y;
        
        const newW = Math.max(150, startRef.current.w + deltaX);
        const newH = Math.max(100, startRef.current.h + deltaY);

        updateLine(config.id, { w: newW, h: newH });
    });
  }, [config.id, updateLine]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);

  // Determine grid columns based on active metrics and width
  const activeMetrics = [display.showVolume, display.showPB, display.showHourly].filter(Boolean).length;
  // If extremely narrow, force 1 column. Otherwise adapt.
  const gridCols = width < 300 ? 'grid-cols-1' : (activeMetrics === 3 ? 'grid-cols-3' : 'grid-cols-2');

  // Units
  const unit = config.productionUnit || 'L';
  const timeBasisMap: Record<string, string> = {
      'SECOND': 'Seg',
      'MINUTE': 'Min',
      'HOUR': 'Hora',
      'DAY': 'Dia',
      'WEEK': 'Sem',
      'MONTH': 'Mês'
  };
  const timeBasisLabel = timeBasisMap[config.timeBasis || 'HOUR'] || 'Hora';

  return (
    <div className={`
      rounded-xl shadow-xl flex flex-col overflow-hidden relative group transition-all duration-300
      ${layout.isPartyMode ? 'bg-purple-900/40 border border-purple-500/50 backdrop-blur-sm' : 'bg-brewery-card border border-brewery-border'}
      ${status === 'ALARM' ? 'animate-pulse-border border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : ''}
      ${isEditing ? 'hover:border-brewery-accent ring-1 ring-white/10' : 'hover:border-brewery-accent'}
      ${isResizing ? 'ring-2 ring-brewery-accent border-transparent z-50' : ''}
      h-full w-full select-none
    `}>
      {/* 1. Header (Draggable Area) */}
      <div 
        className={`${cardPadding} flex justify-between items-start z-10 relative transition-colors ${isEditing ? 'cursor-move bg-white/5' : ''}`}
        onMouseDown={isEditing ? dragHandleProps?.onMouseDown : undefined}
      >
        <div className="flex gap-2 items-center overflow-hidden flex-1 pointer-events-none">
            {/* Grip Icon - always visible but highlighted in edit mode */}
            <div 
              className={`shrink-0 p-1 rounded transition-colors ${isEditing ? 'bg-brewery-accent text-black' : 'text-brewery-muted'}`}
            >
               <Move size={16} />
            </div>
            
            {/* Machine Image (Optional) */}
            {config.image && (
                <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 shrink-0 overflow-hidden">
                    <img src={config.image} alt="" className="w-full h-full object-cover" />
                </div>
            )}
            
            {/* Title Block */}
            <div className="min-w-0">
              <h2 className={`text-brewery-accent font-bold uppercase tracking-wider leading-none truncate ${idSize}`}>
                {config.id}
              </h2>
              <h3 className={`font-bold text-brewery-text tracking-tight leading-tight truncate ${titleSize} drop-shadow-sm`}>
                {config.name}
              </h3>
            </div>
        </div>

        {/* Status Badge */}
        <div className={`shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-widest uppercase shadow-sm ${statusClass}`}>
            {status === 'ALARM' && <AlertTriangle size={10} className="animate-bounce" />}
            {!data ? <WifiOff size={10} /> : status}
        </div>
      </div>

      {/* 2. Metrics Grid */}
      {activeMetrics > 0 && (
        <div className={`grid ${gridCols} gap-2 px-4 pb-4 z-10 relative mt-auto`}>
          
          {display.showVolume && (
            <div className={`bg-black/40 rounded border border-white/5 backdrop-blur-sm ${isCompact ? 'p-1.5' : 'p-2'}`}>
                <div className={`flex items-center text-brewery-muted uppercase font-bold tracking-wider mb-0.5 ${metricLabelSize}`}>
                   <Box size={iconSize} className="mr-1" /> Volume ({unit})
                </div>
                <div className={`font-mono text-brewery-text font-bold leading-none tracking-tight ${metricValueSize}`}>
                  {count.toLocaleString()}
                </div>
            </div>
          )}

          {display.showPB && (
             <div className={`bg-black/40 rounded border border-white/5 backdrop-blur-sm ${isCompact ? 'p-1.5' : 'p-2'}`}>
                <div className={`flex items-center text-brewery-muted uppercase font-bold tracking-wider mb-0.5 ${metricLabelSize}`}>
                   <Zap size={iconSize} className="mr-1" /> Efic.
                </div>
                <div className={`font-mono font-bold leading-none tracking-tight ${metricValueSize} ${pbValue >= 85 ? 'text-emerald-400' : 'text-amber-500'}`}>
                  {pbValue.toFixed(0)}<span className="text-sm align-top opacity-50">%</span>
                </div>
             </div>
          )}

          {display.showHourly && (
             <div className={`bg-black/40 rounded border border-white/5 backdrop-blur-sm ${isCompact ? 'p-1.5' : 'p-2'}`}>
                <div className={`flex items-center text-brewery-muted uppercase font-bold tracking-wider mb-0.5 ${metricLabelSize}`}>
                   <Clock size={iconSize} className="mr-1" /> {unit}/{timeBasisLabel}
                </div>
                <div className={`font-mono font-bold leading-none tracking-tight ${metricValueSize} text-blue-400`}>
                  {hourlyRate}
                </div>
             </div>
          )}
        </div>
      )}

      {/* 3. Temperature (Bottom strip) */}
      {display.showTemp && (
          <div className={`z-10 relative border-t border-white/5 bg-black/20 ${isCompact ? 'px-2 py-1' : 'px-4 py-2'}`}>
             <div className="flex items-center gap-2 text-xs text-brewery-muted">
                <Thermometer size={12} className={temp > 50 ? 'text-amber-500' : ''}/>
                <span className="font-mono">{temp.toFixed(1)}°C</span>
             </div>
          </div>
      )}

      {/* 4. Graphs (Bar or Area) */}
      {/* Logic: Bar Chart takes precedence if both enabled, otherwise Area. */}
      {config.h > 150 && (
        <>
            {display.showBarChart ? (
                <div className={`absolute bottom-0 left-0 right-0 z-0 pointer-events-none opacity-40 transition-opacity`}>
                    <BarChart data={trend} color={chartColor} />
                </div>
            ) : display.showTrend ? (
                <div className={`absolute bottom-0 left-0 right-0 z-0 pointer-events-none opacity-40 transition-opacity`}>
                    <TrendChart data={trend} color={chartColor} />
                </div>
            ) : null}
        </>
      )}

      {/* Resize Handle (Bottom Right) */}
      {isEditing && (
        <div 
          className="absolute bottom-0 right-0 w-6 h-6 flex items-end justify-end p-0.5 cursor-nwse-resize text-white z-50 bg-black/20 rounded-tl"
          onMouseDown={handleResizeStart}
          title="Redimensionar"
        >
            <Scaling size={14} className="transform rotate-90" />
        </div>
      )}

    </div>
  );
};

export default React.memo(MachineCard);