import React, { useState, useRef, useEffect } from 'react';
import { useMachineContext } from '../context/MachineContext';
import { nodeRedService } from '../services/nodeRedService';
import { 
  X, Trash2, Plus, Monitor, Bell, LayoutTemplate, Factory, 
  Edit2, Database, Eye,
  Settings as SettingsIcon, Activity,
  PartyPopper, Calendar, Disc, Sparkles, Wind, Server, CheckCircle, AlertTriangle, RefreshCw,
  ArrowUp, ArrowDown, Crop, Expand, Clock, Type, List, RotateCcw, Gauge, Zap, AlertOctagon, Info, Megaphone,
  Trophy, Medal, Cake, Banknote, Target, Flag, AlignLeft, AlignCenter, Image as ImageIcon, Upload, Scissors,
  BarChart3, TrendingUp, Scale, Timer, Layers, Maximize, Rss, Tv, MousePointer2, Terminal, Pause, Play, Eraser,
  CopyPlus, Link2, Network, CalendarClock, ChevronRight, Bug, FileJson, Hash, Tags, Wifi, Cpu, Globe, ArrowRightLeft,
  Move, Palette, CreditCard, Lock, Unlock, RefreshCcw
} from 'lucide-react';
import { AnnouncementType, LineConfig } from '../types';
import { LINE_CONFIGS as DEFAULT_LINES } from '../constants';

// --- HELPER COMPONENTS ---

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
      active
        ? 'bg-brewery-accent text-black shadow-lg shadow-amber-900/20'
        : 'text-brewery-muted hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SectionHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="mb-6 border-b border-brewery-border pb-4">
    <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
    <p className="text-brewery-muted mt-1">{desc}</p>
  </div>
);

const Badge: React.FC<{ text: string; color?: string }> = ({ text, color }) => {
    let bgClass = 'bg-white/10 text-brewery-muted border-white/10';
    if (color === 'blue') bgClass = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (color === 'amber') bgClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (color === 'rose') bgClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (color === 'orange') bgClass = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${bgClass}`}>
            {text}
        </span>
    );
};

const Toggle: React.FC<{ checked: boolean; onChange: () => void; color?: string }> = ({ checked, onChange, color }) => (
  <div 
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? (color === 'purple' ? 'bg-purple-600' : 'bg-brewery-accent') : 'bg-black border border-white/20'}`}
  >
    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </div>
);

const EffectCard: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; description: string }> = ({ active, onClick, icon, label, description }) => (
  <div 
    onClick={onClick}
    className={`cursor-pointer rounded-lg border p-3 flex flex-col gap-2 transition-all hover:scale-105 active:scale-95 ${
        active 
        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40 ring-2 ring-purple-300' 
        : 'bg-black/40 border-purple-500/20 text-purple-300 hover:bg-purple-900/20'
    }`}
  >
    <div className={`p-2 rounded-full w-fit transition-colors ${active ? 'bg-white/20' : 'bg-black/20'}`}>
        {icon}
    </div>
    <div>
        <span className="text-xs font-bold block">{label}</span>
        <span className={`text-[9px] leading-tight block mt-0.5 ${active ? 'text-purple-100' : 'text-purple-400/60'}`}>{description}</span>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const SettingsPanel: React.FC = () => {
  const { 
    showSettings, toggleSettings, 
    playlists, removeMedia, reorderMedia, updateMedia,
    announcements, addAnnouncement, removeAnnouncement,
    layout, updateLayout,
    lineConfigs, addLine, removeLine, updateLine,
    connectionConfig, updateConnectionConfig,
    addWindow, removeWindow, updateWindow, resetWindowDimensions,
    connectionStatus
  } = useMachineContext();
  
  const [activeTab, setActiveTab] = useState<'LINES' | 'API' | 'LAYOUT' | 'MEDIA' | 'ALERTS' | 'PARTY' | 'HEADER'>('LINES');
  
  // API Sub-tabs state
  const [apiSubTab, setApiSubTab] = useState<'CONNECTION' | 'TAGS'>('CONNECTION');

  // Playlist Management State
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('banner'); 
  const [newWindowName, setNewWindowName] = useState('');

  // Update selected playlist when windows change if the selection is invalid
  useEffect(() => {
     const windowIds = layout.floatingWindows.map(w => w.id);
     if (selectedPlaylist !== 'banner' && !windowIds.includes(selectedPlaylist) && windowIds.length > 0) {
         setSelectedPlaylist(windowIds[0]);
     }
  }, [layout.floatingWindows, selectedPlaylist]);

  // Local state for Alerts
  const [newMsg, setNewMsg] = useState('');
  const [newType, setNewType] = useState<AnnouncementType>('INFO');
  const [isOverlay, setIsOverlay] = useState(false); // NEW: Toggle for Overlay mode
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');

  // Local state for Lines
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LineConfig>>({});
  const [newLineForm, setNewLineForm] = useState({ id: '', name: '' });

  // Test Connection State
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  // Simulated Ping for visual effect
  const [ping, setPing] = useState(0);

  // Background Removal State
  const [isProcessingBg, setIsProcessingBg] = useState(false);

  // DEBUG CONSOLE STATE
  const [consoleLogs, setConsoleLogs] = useState<{time: string, data: any}[]>([]);
  const [isLogPaused, setIsLogPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate ping updates when connected
  useEffect(() => {
      if (connectionStatus === 'CONNECTED') {
          const interval = setInterval(() => {
              setPing(Math.floor(Math.random() * 40) + 10);
          }, 2000);
          return () => clearInterval(interval);
      } else {
          setPing(0);
      }
  }, [connectionStatus]);

  // Effect to scroll to bottom of logs
  useEffect(() => {
    if (!isLogPaused && logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, isLogPaused]);

  // Subscribe to raw data when in API tab
  useEffect(() => {
    if (activeTab === 'API') {
        const cleanup = nodeRedService.subscribeDebug((data) => {
            if (!isLogPaused) {
                setConsoleLogs(prev => {
                    const newLog = { 
                        time: new Date().toLocaleTimeString(), 
                        data 
                    };
                    // Keep last 30 logs to avoid memory issues
                    return [...prev.slice(-49), newLog];
                });
            }
        });
        return cleanup;
    }
  }, [activeTab, isLogPaused]);


  if (!showSettings) return null;

  // -- Helpers --
  const handleSaveLine = (id: string) => {
    updateLine(id, editForm);
    setEditingId(null);
  };

  const handleStartEditLine = (line: LineConfig) => {
    setEditingId(line.id);
    setEditForm(JSON.parse(JSON.stringify(line)));
  };

  const toggleDisplayField = (field: keyof LineConfig['display']) => {
    if (!editForm.display) return;
    setEditForm({
      ...editForm,
      display: { ...editForm.display, [field]: !editForm.display[field] }
    });
  };

  const handleMappingChange = (key: string, value: string) => {
      setEditForm(prev => ({
          ...prev,
          dataMapping: {
              ...prev.dataMapping!,
              [key]: value
          }
      }));
  };

  const toggleChartType = (type: 'TREND' | 'BAR') => {
      if (!editForm.display) return;
      
      if (type === 'TREND') {
          // Toggle Trend, turn off Bar if turning Trend on
          const newValue = !editForm.display.showTrend;
          setEditForm({
              ...editForm,
              display: { ...editForm.display, showTrend: newValue, showBarChart: newValue ? false : editForm.display.showBarChart }
          });
      } else {
          // Toggle Bar, turn off Trend if turning Bar on
          const newValue = !editForm.display.showBarChart;
          setEditForm({
              ...editForm,
              display: { ...editForm.display, showBarChart: newValue, showTrend: newValue ? false : editForm.display.showTrend }
          });
      }
  };

  const handleTestConnection = () => {
    setTestStatus('TESTING');
    // Simulate connection attempt
    setTimeout(() => {
        const isValid = connectionConfig.host && connectionConfig.port;
        setTestStatus(isValid ? 'SUCCESS' : 'ERROR');
        setTimeout(() => setTestStatus('IDLE'), 3000);
    }, 1500);
  };

  // Reusable Image Processor (Logo, Party Mode, Line Image)
  const processImage = (file: File, removeBg: boolean, type: 'LOGO' | 'PARTY' | 'LINE') => {
      setIsProcessingBg(true);
      const reader = new FileReader();
      reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => {
              // Canvas processing logic (Shared)
              let processedBase64 = e.target?.result as string;

              if (removeBg) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  
                  const maxWidth = type === 'PARTY' ? 300 : 800;
                  const scale = Math.min(1, maxWidth / img.width);
                  canvas.width = img.width * scale;
                  canvas.height = img.height * scale;
                  
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;
                  
                  for (let i = 0; i < data.length; i += 4) {
                      const r = data[i];
                      const g = data[i + 1];
                      const b = data[i + 2];
                      
                      if (r > 200 && g > 200 && b > 200) {
                          data[i + 3] = 0; // Set Alpha to 0
                      }
                  }
                  
                  ctx.putImageData(imageData, 0, 0);
                  processedBase64 = canvas.toDataURL('image/png');
              } 
              
              // Apply Result based on Type
              if (type === 'LOGO') {
                  updateLayout({ logoWidget: { ...layout.logoWidget, url: processedBase64, show: true } });
              } else if (type === 'PARTY') {
                  updateLayout({ customPartyImage: processedBase64 });
              } else if (type === 'LINE') {
                  setEditForm(prev => ({ ...prev, image: processedBase64 }));
              }

              setIsProcessingBg(false);
          };
      };
      reader.readAsDataURL(file);
  };

  const currentMediaList = playlists[selectedPlaylist] || [];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex justify-center items-center p-4 md:p-10">
      
      {/* PROFESSIONAL WINDOW CONTAINER */}
      <div className="bg-brewery-card border border-brewery-border w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-black/30 border-b border-brewery-border p-5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-brewery-accent p-2 rounded-lg">
                    <SettingsIcon className="text-black w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-brewery-text tracking-tight">Painel Mestre</h2>
                    <p className="text-xs text-brewery-muted uppercase tracking-widest font-semibold">Configuração Cervejaria</p>
                </div>
            </div>
            <button onClick={toggleSettings} className="p-2 hover:bg-rose-950 hover:text-rose-500 text-brewery-muted rounded-lg transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* MAIN BODY (SIDEBAR + CONTENT) */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="w-64 bg-black/20 border-r border-brewery-border flex flex-col p-4 gap-2 shrink-0 overflow-y-auto">
                <NavButton active={activeTab === 'LINES'} onClick={() => setActiveTab('LINES')} icon={<Factory size={18} />} label="Linhas & Tanques" />
                <NavButton active={activeTab === 'HEADER'} onClick={() => setActiveTab('HEADER')} icon={<Type size={18} />} label="Cabeçalho & Marca" />
                <NavButton active={activeTab === 'API'} onClick={() => setActiveTab('API')} icon={<Database size={18} />} label="Conexão API" />
                <NavButton active={activeTab === 'LAYOUT'} onClick={() => setActiveTab('LAYOUT')} icon={<LayoutTemplate size={18} />} label="Layout & Telas" />
                <NavButton active={activeTab === 'MEDIA'} onClick={() => setActiveTab('MEDIA')} icon={<Monitor size={18} />} label="Mídia & Menu" />
                <NavButton active={activeTab === 'ALERTS'} onClick={() => setActiveTab('ALERTS')} icon={<Bell size={18} />} label="Avisos Gerais" />
                <NavButton active={activeTab === 'PARTY'} onClick={() => setActiveTab('PARTY')} icon={<PartyPopper size={18} />} label="Modo Festa" />
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 bg-brewery-bg overflow-y-auto p-8 custom-scrollbar">
                
                {/* --- TAB: LINES & TANKS --- */}
                 {activeTab === 'LINES' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {/* ... (Existing Lines Code) ... */}
                         <SectionHeader title="Gestão de Equipamentos" desc="Configure tanques, linhas de envase e esteiras." />
                         
                         {/* ADD NEW LINE WIDGET */}
                         <div className="bg-brewery-card border border-brewery-border rounded-lg p-4 flex gap-4 items-end shadow-md">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-brewery-muted">Tag / ID</label>
                                <input className="input-pro" placeholder="Ex: TNK-05" value={newLineForm.id} onChange={e => setNewLineForm({...newLineForm, id: e.target.value})} />
                            </div>
                            <div className="flex-[2] space-y-1">
                                <label className="text-[10px] uppercase font-bold text-brewery-muted">Nome do Equipamento</label>
                                <input className="input-pro" placeholder="Ex: Maturação Stout" value={newLineForm.name} onChange={e => setNewLineForm({...newLineForm, name: e.target.value})} />
                            </div>
                            <button onClick={() => {
                                if(newLineForm.id && newLineForm.name) {
                                    addLine({
                                        id: newLineForm.id, name: newLineForm.name, targetPerHour: 100, nodeRedTopic: '',
                                        display: { showVolume: false, showPB: false, showHourly: false, showTemp: false, showTrend: false, showBarChart: false },
                                        x: 20, y: 20, w: 300, h: 200, // Default pos
                                        productionUnit: 'L',
                                        timeBasis: 'HOUR',
                                        dataMapping: {
                                            productionKey: 'count',
                                            speedKey: 'rate_h',
                                            temperatureKey: 'temp_c',
                                            rejectKey: 'rejects',
                                            statusKey: 'status',
                                            efficiencyKey: 'oee'
                                        }
                                    });
                                    setNewLineForm({id:'', name:''});
                                }
                            }} className="btn-primary h-10 px-6">
                                <Plus size={18} className="mr-2" /> Adicionar
                            </button>
                         </div>

                         {/* LIST OF LINES */}
                          <div className="grid grid-cols-1 gap-4">
                            {lineConfigs.map(line => (
                                <div key={line.id} className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden transition-all hover:border-brewery-accent/30 shadow-sm">
                                    {editingId === line.id ? (
                                        <div className="p-4 space-y-4 bg-black/20 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* Edit Header */}
                                            <div className="flex items-start gap-4 mb-4">
                                                {/* IMAGE UPLOADER */}
                                                <div className="w-20 h-20 rounded bg-black border border-white/10 shrink-0 relative overflow-hidden group">
                                                    {editForm.image ? (
                                                        <img src={editForm.image} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-brewery-muted"><ImageIcon size={24}/></div>
                                                    )}
                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <label className="cursor-pointer p-2 text-white hover:text-brewery-accent">
                                                            <Upload size={16} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], false, 'LINE')} />
                                                        </label>
                                                        {editForm.image && (
                                                            <button onClick={() => setEditForm(prev => ({ ...prev, image: undefined }))} className="p-2 text-white hover:text-rose-500">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-3">
                                                     <div>
                                                        <label className="text-[10px] uppercase font-bold text-brewery-muted">Nome de Exibição</label>
                                                        <input className="input-pro font-bold text-lg" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                                                     </div>
                                                     
                                                     {/* Units & Time Basis */}
                                                     <div className="flex gap-4">
                                                         <div className="flex-1">
                                                            <label className="text-[10px] uppercase font-bold text-brewery-muted flex items-center gap-1"><Scale size={10}/> Unidade</label>
                                                            <select 
                                                                className="input-pro py-1 text-xs"
                                                                value={editForm.productionUnit || 'L'}
                                                                onChange={(e) => setEditForm({...editForm, productionUnit: e.target.value})}
                                                            >
                                                                <option value="L">L (Litros)</option>
                                                                <option value="ML">mL (Mililitros)</option>
                                                                <option value="HL">hL (Hectolitros)</option>
                                                                <option value="KG">kg (Quilogramas)</option>
                                                                <option value="UN">UN (Unidades)</option>
                                                                <option value="CX">CX (Caixas)</option>
                                                            </select>
                                                         </div>
                                                         <div className="flex-1">
                                                            <label className="text-[10px] uppercase font-bold text-brewery-muted flex items-center gap-1"><Timer size={10}/> Base de Tempo</label>
                                                            <select 
                                                                className="input-pro py-1 text-xs"
                                                                value={editForm.timeBasis || 'HOUR'}
                                                                onChange={(e) => setEditForm({...editForm, timeBasis: e.target.value as any})}
                                                            >
                                                                <option value="SECOND">Por Segundo</option>
                                                                <option value="MINUTE">Por Minuto</option>
                                                                <option value="HOUR">Por Hora</option>
                                                                <option value="DAY">Por Dia</option>
                                                                <option value="WEEK">Por Semana</option>
                                                                <option value="MONTH">Por Mês</option>
                                                            </select>
                                                         </div>
                                                     </div>
                                                </div>
                                            </div>

                                            {/* --- DATA MAPPING SECTION (TAGS) --- */}
                                            <div className="p-5 bg-black/30 rounded-lg border border-white/5">
                                                <div className="col-span-full text-xs font-bold text-brewery-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Link2 size={14} /> Mapeamento de Dados (Tags MQTT)
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label-pro flex items-center gap-2"><Database size={10}/> Volume (Tag)</label>
                                                        <input 
                                                            className="input-pro font-mono text-xs" 
                                                            placeholder="Ex: payload.volume"
                                                            value={editForm.dataMapping?.productionKey}
                                                            onChange={(e) => handleMappingChange('productionKey', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="label-pro flex items-center gap-2"><Gauge size={10}/> Velocidade (Tag)</label>
                                                        <input 
                                                            className="input-pro font-mono text-xs" 
                                                            placeholder="Ex: payload.speed"
                                                            value={editForm.dataMapping?.speedKey}
                                                            onChange={(e) => handleMappingChange('speedKey', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="label-pro flex items-center gap-2"><Activity size={10}/> Temperatura (Tag)</label>
                                                        <input 
                                                            className="input-pro font-mono text-xs" 
                                                            placeholder="Ex: payload.temp"
                                                            value={editForm.dataMapping?.temperatureKey}
                                                            onChange={(e) => handleMappingChange('temperatureKey', e.target.value)}
                                                        />
                                                    </div>
                                                     <div>
                                                        <label className="label-pro flex items-center gap-2"><Zap size={10}/> Eficiência (Tag)</label>
                                                        <input 
                                                            className="input-pro font-mono text-xs" 
                                                            placeholder="Ex: payload.oee"
                                                            value={editForm.dataMapping?.efficiencyKey}
                                                            onChange={(e) => handleMappingChange('efficiencyKey', e.target.value)}
                                                        />
                                                    </div>
                                                     <div className="col-span-full">
                                                        <label className="label-pro flex items-center gap-2"><Info size={10}/> Status (Tag)</label>
                                                        <input 
                                                            className="input-pro font-mono text-xs" 
                                                            placeholder="Ex: payload.status"
                                                            value={editForm.dataMapping?.statusKey}
                                                            onChange={(e) => handleMappingChange('statusKey', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* METRICS GRID OPTIMIZED */}
                                            <div className="p-5 bg-black/30 rounded-lg border border-white/5">
                                                <div className="col-span-full text-xs font-bold text-brewery-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Eye size={14} /> Dados Visíveis no Card (On/Off)
                                                </div>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className={`p-3 rounded border transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${editForm.display?.showVolume ? 'bg-brewery-accent/20 border-brewery-accent text-white' : 'border-white/10 text-brewery-muted hover:bg-white/5'}`} onClick={() => toggleDisplayField('showVolume')}>
                                                        <Database size={18} />
                                                        <span className="text-[10px] font-bold uppercase">Volume Total</span>
                                                    </div>
                                                    <div className={`p-3 rounded border transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${editForm.display?.showPB ? 'bg-brewery-accent/20 border-brewery-accent text-white' : 'border-white/10 text-brewery-muted hover:bg-white/5'}`} onClick={() => toggleDisplayField('showPB')}>
                                                        <Zap size={18} />
                                                        <span className="text-[10px] font-bold uppercase">Eficiência (%)</span>
                                                    </div>
                                                    <div className={`p-3 rounded border transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${editForm.display?.showHourly ? 'bg-brewery-accent/20 border-brewery-accent text-white' : 'border-white/10 text-brewery-muted hover:bg-white/5'}`} onClick={() => toggleDisplayField('showHourly')}>
                                                        <Clock size={18} />
                                                        <span className="text-[10px] font-bold uppercase">Vazão</span>
                                                    </div>
                                                    <div className={`p-3 rounded border transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${editForm.display?.showTemp ? 'bg-brewery-accent/20 border-brewery-accent text-white' : 'border-white/10 text-brewery-muted hover:bg-white/5'}`} onClick={() => toggleDisplayField('showTemp')}>
                                                        <Activity size={18} />
                                                        <span className="text-[10px] font-bold uppercase">Temperatura</span>
                                                    </div>
                                                </div>

                                                {/* CHART SELECTION */}
                                                <div className="mt-6 pt-4 border-t border-white/5">
                                                    <div className="col-span-full text-xs font-bold text-brewery-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <TrendingUp size={14} /> Visualização Gráfica (Rodapé)
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button 
                                                            onClick={() => toggleChartType('TREND')} 
                                                            className={`p-4 rounded border flex flex-row items-center justify-center gap-3 transition-all ${editForm.display?.showTrend ? 'bg-gradient-to-r from-brewery-accent to-amber-600 text-black border-transparent shadow-lg shadow-amber-900/20' : 'bg-black/40 border-white/10 text-brewery-muted hover:bg-white/5'}`}
                                                        >
                                                            <TrendingUp size={24} />
                                                            <div className="text-left">
                                                                <span className="block text-sm font-bold">Gráfico de Área</span>
                                                                <span className="block text-[10px] opacity-70">Tendência contínua</span>
                                                            </div>
                                                        </button>

                                                        <button 
                                                            onClick={() => toggleChartType('BAR')} 
                                                            className={`p-4 rounded border flex flex-row items-center justify-center gap-3 transition-all ${editForm.display?.showBarChart ? 'bg-gradient-to-r from-brewery-accent to-amber-600 text-black border-transparent shadow-lg shadow-amber-900/20' : 'bg-black/40 border-white/10 text-brewery-muted hover:bg-white/5'}`}
                                                        >
                                                            <BarChart3 size={24} />
                                                            <div className="text-left">
                                                                <span className="block text-sm font-bold">Gráfico de Barras</span>
                                                                <span className="block text-[10px] opacity-70">Comparativo discreto</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2">
                                                <button onClick={() => setEditingId(null)} className="btn-ghost">Cancelar</button>
                                                <button onClick={() => handleSaveLine(line.id)} className="btn-primary px-6">Salvar Configuração</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                {/* Image Thumbnail or ID Placeholder */}
                                                <div className="w-12 h-12 rounded bg-brewery-border border border-brewery-muted/20 flex items-center justify-center text-brewery-muted font-bold text-sm shadow-inner overflow-hidden">
                                                    {line.image ? <img src={line.image} className="w-full h-full object-cover" /> : line.id}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-brewery-text text-lg">{line.name}</h3>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <Badge text={`${line.productionUnit || 'L'} / ${line.timeBasis || 'HOUR'}`} color="blue" />
                                                        {line.display.showVolume && <Badge text="Vol" />}
                                                        {line.display.showPB && <Badge text="Efic" />}
                                                        {line.display.showTemp && <Badge text="Temp" />}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleStartEditLine(line)} className="p-2.5 text-brewery-muted hover:text-brewery-accent hover:bg-black/20 rounded-lg transition-colors"><Edit2 size={20} /></button>
                                                <button onClick={() => removeLine(line.id)} className="p-2.5 text-brewery-muted hover:text-rose-500 hover:bg-black/20 rounded-lg transition-colors"><Trash2 size={20} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                         </div>
                    </div>
                 )}

                {/* --- TAB: HEADER & BRAND --- */}
                {activeTab === 'HEADER' && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <SectionHeader title="Cabeçalho & Identidade Visual" desc="Personalize o título, cores e logo que aparecem no topo da tela." />
                        
                        {/* Live Preview Header */}
                        <div className="bg-black border border-brewery-border rounded-lg p-2 mb-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
                                <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Preview em Tempo Real</span>
                            </div>
                            <header 
                                className="flex justify-between items-center p-4 border rounded relative z-10 transition-colors duration-500"
                                style={{
                                    backgroundColor: layout.header.backgroundColor,
                                    borderColor: '#452c20'
                                }}
                            >
                                <div className={`flex items-center gap-4 flex-1 ${layout.header.alignment === 'CENTER' ? 'justify-center' : 'justify-start'}`}>
                                    <div className={layout.header.alignment === 'CENTER' ? 'text-center' : 'text-left'}>
                                        <h1 className="text-xl font-bold tracking-tight" style={{ color: layout.header.textColor }}>
                                            {layout.header.title || 'Título da Aplicação'}
                                        </h1>
                                        {layout.header.subtitle && (
                                            <p className="text-xs font-mono uppercase tracking-widest opacity-60" style={{ color: layout.header.textColor }}>{layout.header.subtitle}</p>
                                        )}
                                    </div>
                                </div>
                            </header>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* LEFT: TEXT & COLOR */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-white uppercase border-b border-white/5 pb-2">Conteúdo e Cores</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="label-pro">Título Principal</label>
                                        <input 
                                            className="input-pro font-bold" 
                                            value={layout.header.title} 
                                            onChange={(e) => updateLayout({ header: { ...layout.header, title: e.target.value } })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="label-pro">Subtítulo (Opcional)</label>
                                        <input 
                                            className="input-pro font-mono text-xs" 
                                            value={layout.header.subtitle} 
                                            onChange={(e) => updateLayout({ header: { ...layout.header, subtitle: e.target.value } })} 
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label-pro flex items-center gap-2"><Palette size={12}/> Cor do Texto</label>
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    type="color" 
                                                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                                    value={layout.header.textColor}
                                                    onChange={(e) => updateLayout({ header: { ...layout.header, textColor: e.target.value } })}
                                                />
                                                <input 
                                                    className="input-pro py-1 text-xs font-mono uppercase" 
                                                    value={layout.header.textColor} 
                                                    onChange={(e) => updateLayout({ header: { ...layout.header, textColor: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label-pro flex items-center gap-2"><Palette size={12}/> Cor de Fundo</label>
                                            <div className="flex gap-2 items-center">
                                                <input 
                                                    type="color" 
                                                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                                    value={layout.header.backgroundColor}
                                                    onChange={(e) => updateLayout({ header: { ...layout.header, backgroundColor: e.target.value } })}
                                                />
                                                <input 
                                                    className="input-pro py-1 text-xs font-mono uppercase" 
                                                    value={layout.header.backgroundColor} 
                                                    onChange={(e) => updateLayout({ header: { ...layout.header, backgroundColor: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label-pro">Alinhamento do Texto</label>
                                        <div className="flex gap-2 bg-black/30 p-1 rounded-lg border border-white/5 w-fit">
                                            <button 
                                                onClick={() => updateLayout({ header: { ...layout.header, alignment: 'LEFT' } })}
                                                className={`p-2 rounded transition-all ${layout.header.alignment === 'LEFT' ? 'bg-brewery-accent text-black' : 'text-brewery-muted hover:bg-white/5'}`}
                                            >
                                                <AlignLeft size={20} />
                                            </button>
                                            <button 
                                                onClick={() => updateLayout({ header: { ...layout.header, alignment: 'CENTER' } })}
                                                className={`p-2 rounded transition-all ${layout.header.alignment === 'CENTER' ? 'bg-brewery-accent text-black' : 'text-brewery-muted hover:bg-white/5'}`}
                                            >
                                                <AlignCenter size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: MEDIA & LOGO */}
                            <div className="space-y-6">
                                {/* Banner Config */}
                                <div className="bg-brewery-card/50 border border-brewery-border rounded-lg p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2"><CreditCard size={14} className="text-indigo-400"/> Banner Superior</h4>
                                            <p className="text-[10px] text-brewery-muted mt-1">Habilite uma área de mídia fixa acima do cabeçalho.</p>
                                        </div>
                                        <Toggle checked={layout.header.showTopMedia} onChange={() => updateLayout({ header: { ...layout.header, showTopMedia: !layout.header.showTopMedia } })} />
                                    </div>
                                    
                                    {layout.header.showTopMedia && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="label-pro flex justify-between">
                                                    <span>Altura (px)</span>
                                                    <span className="text-indigo-400">{layout.header.topMediaHeight}px</span>
                                                </label>
                                                <input 
                                                    type="range" min="50" max="400" step="10" 
                                                    className="w-full accent-indigo-500"
                                                    value={layout.header.topMediaHeight}
                                                    onChange={(e) => updateLayout({ header: { ...layout.header, topMediaHeight: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                            <div>
                                                <label className="label-pro flex justify-between">
                                                    <span>Espessura da Borda</span>
                                                    <span className="text-indigo-400">{layout.header.topMediaBorderWidth || 0}px</span>
                                                </label>
                                                <input 
                                                    type="range" min="0" max="10" step="1" 
                                                    className="w-full accent-indigo-500"
                                                    value={layout.header.topMediaBorderWidth || 0}
                                                    onChange={(e) => updateLayout({ header: { ...layout.header, topMediaBorderWidth: parseInt(e.target.value) } })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Logo Config */}
                                <div className="bg-brewery-card/50 border border-brewery-border rounded-lg p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2"><ImageIcon size={14} className="text-emerald-400"/> Logo Flutuante</h4>
                                            <p className="text-[10px] text-brewery-muted mt-1">Um widget de imagem arrastável sobre a tela.</p>
                                        </div>
                                        <Toggle checked={layout.logoWidget.show} onChange={() => updateLayout({ logoWidget: { ...layout.logoWidget, show: !layout.logoWidget.show } })} />
                                    </div>

                                    {layout.logoWidget.show && (
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="w-16 h-16 bg-black rounded border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                                {layout.logoWidget.url ? (
                                                    <img src={layout.logoWidget.url} className="w-full h-full object-contain" />
                                                ) : <ImageIcon className="text-brewery-muted" />}
                                                
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <label className="cursor-pointer p-1 text-white hover:text-emerald-400">
                                                        <Upload size={14} />
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], true, 'LOGO')} />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] text-brewery-muted mb-2">Clique na imagem para alterar. Use o mouse na tela principal para posicionar e redimensionar.</p>
                                                <div className="flex gap-2">
                                                    <div className="bg-black/20 px-2 py-1 rounded text-[10px] font-mono border border-white/5 text-zinc-400">
                                                        X: {layout.logoWidget.x.toFixed(0)}
                                                    </div>
                                                    <div className="bg-black/20 px-2 py-1 rounded text-[10px] font-mono border border-white/5 text-zinc-400">
                                                        Y: {layout.logoWidget.y.toFixed(0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- TAB: LAYOUT & MEDIA (Combined/Optimized) --- */}
                {activeTab === 'MEDIA' && (
                    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
                         <SectionHeader title="Gerenciador de Janelas & Mídia" desc="Crie janelas flutuantes (PIP) e gerencie o conteúdo de cada uma." />

                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                            {/* LEFT COL: WINDOW LIST & GLOBAL SETTINGS */}
                            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                {/* Global Settings Card */}
                                <div className="bg-brewery-card border border-brewery-border rounded-lg p-4 space-y-4">
                                    <h3 className="text-xs font-bold text-brewery-muted uppercase tracking-widest mb-1">Ajustes Globais</h3>
                                    
                                    {/* Media Fit Controls */}
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-white flex items-center gap-2">
                                            <Expand size={14} /> Preenchimento de Mídia
                                        </label>
                                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 w-36 shrink-0">
                                            <button 
                                                onClick={() => updateLayout({ mediaFit: 'CONTAIN' })}
                                                className={`flex-1 py-1.5 text-[10px] rounded-md font-bold transition-all text-center ${layout.mediaFit === 'CONTAIN' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                                            >
                                                CONTAIN
                                            </button>
                                            <button 
                                                onClick={() => updateLayout({ mediaFit: 'COVER' })}
                                                className={`flex-1 py-1.5 text-[10px] rounded-md font-bold transition-all text-center ${layout.mediaFit === 'COVER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                                            >
                                                COVER
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lock and Reset Actions */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                                        <button 
                                            onClick={() => updateLayout({ areWindowsLocked: !layout.areWindowsLocked })}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                                layout.areWindowsLocked 
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                                                : 'bg-black/20 border-white/10 text-zinc-400 hover:bg-white/5'
                                            }`}
                                            title="Travar posição das janelas"
                                        >
                                            {layout.areWindowsLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                            <span className="text-xs font-bold">{layout.areWindowsLocked ? 'Travado' : 'Destravado'}</span>
                                        </button>

                                        <button 
                                            onClick={resetWindowDimensions}
                                            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-black/20 border border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                                            title="Resetar para 200x200px"
                                        >
                                            <RefreshCcw size={16} />
                                            <span className="text-xs font-bold">Reset Dim.</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-500">Trave as janelas para evitar movimentos acidentais ou resete o tamanho para o padrão.</p>
                                </div>

                                {/* Window List Manager */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                        <h3 className="text-xs font-bold text-brewery-muted uppercase tracking-widest">Janelas Ativas</h3>
                                        <button 
                                            onClick={() => addWindow(`Janela ${layout.floatingWindows.length + 1}`)}
                                            className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                        >
                                            <Plus size={10} /> Nova Janela
                                        </button>
                                    </div>

                                    {layout.floatingWindows.map(win => (
                                        <div 
                                            key={win.id}
                                            onClick={() => setSelectedPlaylist(win.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                                                selectedPlaylist === win.id 
                                                ? 'bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-900/20' 
                                                : 'bg-black/20 border-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Monitor size={14} className={selectedPlaylist === win.id ? 'text-indigo-400' : 'text-zinc-600'} />
                                                    <span className={`font-bold text-sm ${selectedPlaylist === win.id ? 'text-white' : 'text-zinc-400'}`}>{win.name}</span>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); removeWindow(win.id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 hover:text-rose-500 rounded transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            {/* Quick Stats/Edit - OPTIMIZED LAYOUT */}
                                            {selectedPlaylist === win.id && (
                                                <div className="space-y-3 mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                                                    <div>
                                                        <label className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-1">
                                                            <Type size={10}/> Nome da Janela
                                                        </label>
                                                        <input 
                                                            className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                                            value={win.name}
                                                            onChange={(e) => updateWindow(win.id, { name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-1">
                                                                <ArrowRightLeft size={10}/> Largura (px)
                                                            </label>
                                                            <input 
                                                                type="number"
                                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-indigo-500 focus:outline-none"
                                                                value={win.w}
                                                                onChange={(e) => updateWindow(win.id, { w: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-zinc-500 uppercase font-bold flex items-center gap-1 mb-1">
                                                                <ArrowUp size={10}/> Altura (px)
                                                            </label>
                                                            <input 
                                                                type="number"
                                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-indigo-500 focus:outline-none"
                                                                value={win.h}
                                                                onChange={(e) => updateWindow(win.id, { h: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div 
                                        onClick={() => setSelectedPlaylist('banner')}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 ${
                                            selectedPlaylist === 'banner' 
                                            ? 'bg-amber-900/20 border-amber-500 shadow-lg shadow-amber-900/20' 
                                            : 'bg-black/20 border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <CreditCard size={14} className={selectedPlaylist === 'banner' ? 'text-amber-400' : 'text-zinc-600'} />
                                        <span className={`font-bold text-sm ${selectedPlaylist === 'banner' ? 'text-white' : 'text-zinc-400'}`}>Banner Superior (Fixo)</span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COL: PLAYLIST CONTENT */}
                            <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl overflow-hidden flex flex-col">
                                <div className="p-3 border-b border-white/10 bg-black/20 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <List size={14} className="text-indigo-400" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                                            Conteúdo: {selectedPlaylist === 'banner' ? 'Banner Superior' : layout.floatingWindows.find(w => w.id === selectedPlaylist)?.name || 'Desconhecido'}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-zinc-500">
                                        {playlists[selectedPlaylist]?.length || 0} Itens
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    {(!playlists[selectedPlaylist] || playlists[selectedPlaylist].length === 0) ? (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-60">
                                            <Monitor size={48} className="mb-2" />
                                            <p className="text-sm">Esta playlist está vazia.</p>
                                            <p className="text-xs">Use o painel de mídia na tela principal para adicionar conteúdo.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {playlists[selectedPlaylist].map((item, index) => (
                                                <div key={item.id} className="flex items-center gap-3 p-2 bg-black/40 border border-white/5 rounded hover:border-white/20 transition-colors group">
                                                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 font-mono text-xs">
                                                        {index + 1}
                                                    </div>
                                                    <div className="w-12 h-8 rounded bg-black border border-white/10 overflow-hidden shrink-0">
                                                        {item.type === 'VIDEO' ? <div className="w-full h-full bg-indigo-900/50 flex items-center justify-center"><Play size={10} className="text-white"/></div> : 
                                                         <img src={item.url} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-white truncate">{item.name}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                                            <span className="uppercase">{item.type}</span>
                                                            {item.type !== 'VIDEO' && (
                                                                <span className="flex items-center gap-1 bg-white/5 px-1 rounded">
                                                                    <Timer size={8} /> {item.duration}s
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.type !== 'VIDEO' && (
                                                            <input 
                                                                type="number"
                                                                className="w-12 bg-black border border-white/20 rounded px-1 text-[10px] text-center"
                                                                value={item.duration}
                                                                onChange={(e) => updateMedia(selectedPlaylist, item.id, { duration: parseInt(e.target.value) })}
                                                                title="Duração (segundos)"
                                                            />
                                                        )}
                                                        <button 
                                                            onClick={() => removeMedia(selectedPlaylist, item.id)}
                                                            className="p-1.5 hover:bg-rose-500/20 hover:text-rose-500 rounded"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                    </div>
                )}

                {/* --- TAB: PARTY MODE --- */}
                {activeTab === 'PARTY' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <SectionHeader title="Modo Festa & Comemoração" desc="Ative efeitos visuais especiais para celebrar metas batidas ou eventos." />

                        {/* MASTER TOGGLE CARD */}
                        <div className={`p-6 rounded-2xl border transition-all duration-500 flex flex-col items-center text-center gap-4 ${layout.isPartyMode ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.15)]' : 'bg-brewery-card border-brewery-border'}`}>
                             <div className={`p-4 rounded-full ${layout.isPartyMode ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50 animate-bounce' : 'bg-black/40 text-zinc-600'}`}>
                                <PartyPopper size={32} />
                             </div>
                             <div>
                                <h3 className={`text-2xl font-black uppercase tracking-tight ${layout.isPartyMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400' : 'text-zinc-500'}`}>
                                    {layout.isPartyMode ? 'Modo Festa Ativado!' : 'Modo Festa Desativado'}
                                </h3>
                                <p className="text-sm text-zinc-400 mt-2 max-w-md mx-auto">
                                    Quando ativo, o sistema exibe animações sobrepostas, altera as cores do tema e destaca a mensagem de comemoração.
                                </p>
                             </div>
                             <div className="scale-150 mt-2">
                                <Toggle checked={layout.isPartyMode} onChange={() => updateLayout({ isPartyMode: !layout.isPartyMode })} color="purple" />
                             </div>
                        </div>

                        {/* CONFIG GRID */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity duration-300 ${!layout.isPartyMode ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                            {/* Message Config */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white uppercase border-b border-white/5 pb-2">Mensagem do Banner</h4>
                                <div>
                                    <label className="label-pro">Texto de Celebração</label>
                                    <input 
                                        className="input-pro border-purple-500/30 focus:border-purple-500 font-bold text-lg text-purple-200 bg-purple-900/10"
                                        value={layout.partyMessage || ''}
                                        onChange={(e) => updateLayout({ partyMessage: e.target.value })}
                                        placeholder="EX: META BATIDA! PARABÉNS TIME!"
                                    />
                                </div>
                                
                                {/* Custom Image Upload */}
                                <div className="pt-4">
                                    <h4 className="text-sm font-bold text-white uppercase border-b border-white/5 pb-2 mb-4">Imagem Personalizada (Partícula)</h4>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-24 h-24 bg-black rounded-lg border border-purple-500/30 flex items-center justify-center relative overflow-hidden group">
                                            {layout.customPartyImage ? (
                                                <img src={layout.customPartyImage} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <ImageIcon className="text-purple-500/30" />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <label className="cursor-pointer p-2 text-white hover:text-purple-400">
                                                    <Upload size={20} />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], true, 'PARTY')} />
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex-1 text-xs text-zinc-400">
                                            <p className="mb-2">Faça upload de uma imagem (ex: foto do funcionário do mês, logo de um cliente) para usar como chuva de partículas.</p>
                                            <p className="text-purple-400 font-bold">O fundo será removido automaticamente.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Effect Selector Grid */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white uppercase border-b border-white/5 pb-2">Escolha o Efeito Visual</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'CONFETTI', label: 'Confetes', icon: <PartyPopper size={18}/>, desc: 'Coloridos' },
                                        { id: 'BUBBLES', label: 'Bolhas', icon: <Wind size={18}/>, desc: 'Cervejaria' },
                                        { id: 'DISCO', label: 'Disco', icon: <Disc size={18}/>, desc: 'Luzes Strobo' },
                                        { id: 'GLOW', label: 'Neon', icon: <Sparkles size={18}/>, desc: 'Brilho Suave' },
                                        { id: 'WORLDCUP', label: 'Brasil', icon: <Flag size={18}/>, desc: 'Verde/Amarelo' },
                                        { id: 'OLYMPICS', label: 'Olimpíadas', icon: <Medal size={18}/>, desc: 'Anéis' },
                                        { id: 'BIRTHDAY', label: 'Aniversário', icon: <Cake size={18}/>, desc: 'Balões' },
                                        { id: 'BONUS', label: 'Bônus', icon: <Banknote size={18}/>, desc: 'Chuva de $' },
                                        { id: 'GOAL', label: 'Meta', icon: <Trophy size={18}/>, desc: 'Estrelas/Taças' },
                                        { id: 'CUSTOM', label: 'Custom', icon: <ImageIcon size={18}/>, desc: 'Sua Imagem' },
                                    ].map(eff => (
                                        <EffectCard 
                                            key={eff.id}
                                            active={layout.partyEffect === eff.id}
                                            onClick={() => updateLayout({ partyEffect: eff.id as any })}
                                            icon={eff.icon}
                                            label={eff.label}
                                            description={eff.desc}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: API CONNECTION --- */}
                {activeTab === 'API' && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <SectionHeader title="Conexão Industrial" desc="Gerencie a conexão MQTT e mapeie as tags de dados para cada linha." />
                        
                        {/* API Sub-Navigation */}
                        <div className="flex bg-black/40 p-1 rounded-lg border border-brewery-border mb-6 w-fit">
                            <button 
                                onClick={() => setApiSubTab('CONNECTION')}
                                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${apiSubTab === 'CONNECTION' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}
                            >
                                <Network size={16} /> Configuração Broker
                            </button>
                            <button 
                                onClick={() => setApiSubTab('TAGS')}
                                className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${apiSubTab === 'TAGS' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}
                            >
                                <Tags size={16} /> Mapeamento de Tags
                            </button>
                        </div>

                        {apiSubTab === 'CONNECTION' && (
                            <div className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                                {/* Visual Connection Status Header */}
                                <div className="bg-black/40 p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 ${
                                            connectionStatus === 'CONNECTED' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-500 shadow-emerald-900/40' :
                                            connectionStatus === 'CONNECTING' ? 'bg-blue-900/20 border-blue-500 text-blue-500 animate-pulse' :
                                            'bg-rose-900/20 border-rose-500 text-rose-500'
                                        }`}>
                                            {connectionStatus === 'CONNECTED' ? <Wifi size={32} /> : 
                                             connectionStatus === 'CONNECTING' ? <RefreshCw size={32} className="animate-spin" /> : 
                                             <Wifi size={32} className="opacity-50" />}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                                                {connectionStatus === 'CONNECTED' ? 'ONLINE' : 
                                                 connectionStatus === 'CONNECTING' ? 'CONECTANDO...' : 'OFFLINE'}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center gap-1.5 text-xs font-mono text-brewery-muted">
                                                    <Server size={12} />
                                                    {connectionConfig.protocol}://{connectionConfig.host}:{connectionConfig.port}
                                                </div>
                                                {connectionStatus === 'CONNECTED' && (
                                                    <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                                                        <Activity size={12} />
                                                        {ping}ms
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                         <button 
                                            onClick={handleTestConnection}
                                            disabled={testStatus === 'TESTING'}
                                            className={`px-6 py-3 rounded-lg font-bold border transition-all flex items-center gap-2 uppercase tracking-wider text-sm ${
                                                testStatus === 'SUCCESS' ? 'bg-emerald-500 text-black border-emerald-500' : 
                                                testStatus === 'ERROR' ? 'bg-rose-500 text-white border-rose-500' : 
                                                'bg-white/10 border-white/10 text-white hover:bg-white/20'
                                            }`}
                                        >
                                            {testStatus === 'TESTING' ? <RefreshCw className="animate-spin" size={16} /> : 
                                            testStatus === 'SUCCESS' ? <CheckCircle size={16} /> : 
                                            testStatus === 'ERROR' ? <AlertTriangle size={16} /> : 
                                            <ArrowRightLeft size={16} />}
                                            <span>Testar Ping</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="col-span-1">
                                            <label className="label-pro">Protocolo</label>
                                            <select 
                                                className="input-pro"
                                                value={connectionConfig.protocol}
                                                onChange={(e) => updateConnectionConfig({ protocol: e.target.value as 'ws' | 'wss' })}
                                            >
                                                <option value="ws">WS:// (Padrão)</option>
                                                <option value="wss">WSS:// (Seguro)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1 md:col-span-3">
                                            <label className="label-pro">Host / IP do Broker</label>
                                            <div className="relative">
                                                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brewery-muted"/>
                                                <input 
                                                    className="input-pro !pl-9 font-mono"
                                                    placeholder="localhost ou 192.168.1.50"
                                                    value={connectionConfig.host}
                                                    onChange={(e) => updateConnectionConfig({ host: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="col-span-1">
                                            <label className="label-pro">Porta</label>
                                            <div className="relative">
                                                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brewery-muted"/>
                                                <input 
                                                    className="input-pro !pl-9 font-mono"
                                                    placeholder="1880"
                                                    value={connectionConfig.port}
                                                    onChange={(e) => updateConnectionConfig({ port: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-1 md:col-span-3">
                                            <label className="label-pro">Topic / Path (Rota WebSocket)</label>
                                            <div className="relative">
                                                <Network size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brewery-muted"/>
                                                <input 
                                                    className="input-pro !pl-9 font-mono"
                                                    placeholder="/ws/brewery-data"
                                                    value={connectionConfig.path}
                                                    onChange={(e) => updateConnectionConfig({ path: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-[10px] text-brewery-muted mt-2 flex items-center gap-1">
                                                <Info size={10} /> O endpoint deve suportar conexão WebSocket.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Toggle checked={connectionConfig.autoConnect} onChange={() => updateConnectionConfig({ autoConnect: !connectionConfig.autoConnect })} />
                                            <div>
                                                <span className="text-sm font-bold text-white block">Conexão Automática</span>
                                                <span className="text-xs text-brewery-muted">Reconectar ao iniciar ou em caso de queda.</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-mono">
                                            Client ID: IV-PRO-{Math.floor(Math.random()*1000)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {apiSubTab === 'TAGS' && (
                             <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                                    <Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-blue-200 font-bold">Dicionário de Dados</p>
                                        <p className="text-xs text-blue-300/70 mt-1">Defina o caminho JSON (ex: <code className="bg-black/30 px-1 rounded">payload.temp</code>) para cada variável de cada equipamento. Use o Terminal abaixo para ver a estrutura dos dados recebidos.</p>
                                    </div>
                                </div>

                                {lineConfigs.map((line) => (
                                    <div key={line.id} className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden">
                                        <div className="bg-black/20 p-3 border-b border-white/5 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center text-brewery-muted text-xs font-bold border border-white/10">
                                                {line.id.substring(0,3)}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{line.name}</h4>
                                                <span className="text-[10px] text-brewery-muted font-mono">{line.id}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] uppercase font-bold text-brewery-muted flex items-center gap-1"><Database size={10} /> Volume (Total)</label>
                                                <div className="relative">
                                                    <FileJson size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-brewery-muted opacity-50"/>
                                                    <input 
                                                        className="input-pro !pl-7 py-1.5 text-xs font-mono text-emerald-400/90 bg-black/40 border-white/5 focus:border-emerald-500/50" 
                                                        value={line.dataMapping?.productionKey || ''}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, productionKey: e.target.value } })}
                                                        placeholder="key"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] uppercase font-bold text-brewery-muted flex items-center gap-1"><Gauge size={10} /> Velocidade</label>
                                                <div className="relative">
                                                    <FileJson size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-brewery-muted opacity-50"/>
                                                    <input 
                                                        className="input-pro !pl-7 py-1.5 text-xs font-mono text-blue-400/90 bg-black/40 border-white/5 focus:border-blue-500/50" 
                                                        value={line.dataMapping?.speedKey || ''}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, speedKey: e.target.value } })}
                                                        placeholder="key"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] uppercase font-bold text-brewery-muted flex items-center gap-1"><Activity size={10} /> Temperatura</label>
                                                <div className="relative">
                                                    <FileJson size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-brewery-muted opacity-50"/>
                                                    <input 
                                                        className="input-pro !pl-7 py-1.5 text-xs font-mono text-amber-400/90 bg-black/40 border-white/5 focus:border-amber-500/50" 
                                                        value={line.dataMapping?.temperatureKey || ''}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, temperatureKey: e.target.value } })}
                                                        placeholder="key"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] uppercase font-bold text-brewery-muted flex items-center gap-1"><Zap size={10} /> Eficiência/OEE</label>
                                                <div className="relative">
                                                    <FileJson size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-brewery-muted opacity-50"/>
                                                    <input 
                                                        className="input-pro !pl-7 py-1.5 text-xs font-mono text-purple-400/90 bg-black/40 border-white/5 focus:border-purple-500/50" 
                                                        value={line.dataMapping?.efficiencyKey || ''}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, efficiencyKey: e.target.value } })}
                                                        placeholder="key"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] uppercase font-bold text-brewery-muted flex items-center gap-1"><Info size={10} /> Status (String)</label>
                                                <div className="relative">
                                                    <FileJson size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-brewery-muted opacity-50"/>
                                                    <input 
                                                        className="input-pro !pl-7 py-1.5 text-xs font-mono text-zinc-300/90 bg-black/40 border-white/5 focus:border-zinc-500/50" 
                                                        value={line.dataMapping?.statusKey || ''}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, statusKey: e.target.value } })}
                                                        placeholder="key"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Visibility Toggle Shortcuts */}
                                            <div className="flex items-end pb-1 gap-2">
                                                <button 
                                                    onClick={() => updateLine(line.id, { display: { ...line.display, showTemp: !line.display.showTemp } })}
                                                    className={`p-1.5 rounded border transition-colors ${line.display.showTemp ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-black/20 border-white/5 text-zinc-600'}`}
                                                    title="Toggle Temp Visibility"
                                                >
                                                    <Activity size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => updateLine(line.id, { display: { ...line.display, showVolume: !line.display.showVolume } })}
                                                    className={`p-1.5 rounded border transition-colors ${line.display.showVolume ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-black/20 border-white/5 text-zinc-600'}`}
                                                    title="Toggle Volume Visibility"
                                                >
                                                    <Database size={14} />
                                                </button>
                                                <div className="text-[9px] text-zinc-600 self-center ml-1">Visibilidade Rápida</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        )}

                        {/* --- DEBUG TERMINAL (ALWAYS VISIBLE IN API TAB) --- */}
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-lg overflow-hidden shadow-2xl flex flex-col h-80 animate-in slide-in-from-bottom-4 fade-in">
                            {/* Terminal Header */}
                            <div className="flex justify-between items-center p-2 bg-white/5 border-b border-white/10">
                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-brewery-muted px-2">
                                    <Terminal size={14} className="text-brewery-accent" />
                                    <span>Terminal de Telemetria (Live)</span>
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setIsLogPaused(!isLogPaused)} 
                                        className={`p-1.5 rounded transition-colors ${isLogPaused ? 'bg-amber-500/20 text-amber-500' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                                        title={isLogPaused ? "Resume" : "Pause"}
                                    >
                                        {isLogPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                                    </button>
                                    <button 
                                        onClick={() => setConsoleLogs([])} 
                                        className="p-1.5 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                        title="Clear Console"
                                    >
                                        <Eraser size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Terminal Body */}
                            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] md:text-xs custom-scrollbar">
                                {consoleLogs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-2 opacity-50">
                                        <Bug size={32} />
                                        <p>Aguardando dados...</p>
                                    </div>
                                ) : (
                                    consoleLogs.map((log, i) => (
                                        <div key={i} className="mb-1 border-b border-white/5 pb-1 break-all last:border-0 hover:bg-white/5 transition-colors px-1 rounded">
                                            <span className="text-zinc-500 select-none mr-2">[{log.time}]</span>
                                            {log.data.error ? (
                                                <span className="text-rose-500 font-bold">
                                                    ERROR: {log.data.error}
                                                    <span className="block text-rose-300/50 pl-4 text-[9px]">{typeof log.data.raw === 'string' ? log.data.raw : JSON.stringify(log.data.raw)}</span>
                                                </span>
                                            ) : (
                                                <span className="text-emerald-400/90">
                                                    {JSON.stringify(log.data)}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: ALERTS (AVISOS GERAIS) --- */}
                {activeTab === 'ALERTS' && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* ... (Existing Alerts Code) ... */}
                         <SectionHeader title="Avisos Gerais" desc="Crie comunicados para o rodapé (Ticker) ou alertas de tela cheia." />
                         
                         {/* ALERT CREATION CARD */}
                         <div className="bg-brewery-card/50 border border-brewery-border rounded-xl p-6 space-y-6 shadow-xl backdrop-blur-sm">
                            
                            {/* 1. TYPE SELECTION (VISUAL BUTTONS) */}
                            <div>
                                <label className="label-pro mb-3">Selecione o Tipo de Alerta</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { type: 'INFO', label: 'Info', icon: <Info size={20} />, color: 'blue', border: 'border-blue-500', bg: 'bg-blue-500' },
                                        { type: 'ATTENTION', label: 'Comunicado', icon: <Megaphone size={20} />, color: 'orange', border: 'border-orange-500', bg: 'bg-orange-500' },
                                        { type: 'WARNING', label: 'Atenção', icon: <AlertTriangle size={20} />, color: 'amber', border: 'border-amber-500', bg: 'bg-amber-500' },
                                        { type: 'CRITICAL', label: 'Crítico', icon: <AlertOctagon size={20} />, color: 'rose', border: 'border-rose-500', bg: 'bg-rose-500' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.type}
                                            onClick={() => setNewType(opt.type as AnnouncementType)}
                                            className={`
                                                relative p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200
                                                ${newType === opt.type 
                                                    ? `${opt.bg}/20 ${opt.border} text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] ring-1 ring-white/20` 
                                                    : 'bg-black/40 border-white/5 text-brewery-muted hover:bg-white/5 hover:border-white/20'
                                                }
                                            `}
                                        >
                                            <div className={`${newType === opt.type ? `text-${opt.color}-400` : ''}`}>
                                                {opt.icon}
                                            </div>
                                            <span className="font-bold text-xs uppercase tracking-wider">{opt.label}</span>
                                            {newType === opt.type && <div className={`absolute inset-0 rounded-xl bg-${opt.color}-500/5`} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. MESSAGE INPUT */}
                            <div>
                                <label className="label-pro">Mensagem do Aviso</label>
                                <textarea 
                                    className="input-pro h-24 font-bold text-lg resize-none leading-relaxed" 
                                    placeholder="Digite a mensagem que será exibida..." 
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    maxLength={140}
                                />
                                <div className="flex justify-between mt-1 px-1">
                                    <span className="text-[10px] text-brewery-muted">Suporta emojis ⚠️ 🔥</span>
                                    <span className="text-[10px] text-brewery-muted font-mono">{newMsg.length}/140</span>
                                </div>
                            </div>

                            {/* 3. MODE & SCHEDULE GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-xl border border-white/5">
                                {/* Mode Toggle */}
                                <div className="space-y-3">
                                    <label className="label-pro flex items-center gap-2"><Monitor size={14}/> Modo de Exibição</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsOverlay(false)}
                                            className={`flex-1 p-3 rounded-lg border text-xs font-bold uppercase transition-all flex flex-col items-center gap-2 ${!isOverlay ? 'bg-brewery-accent/20 border-brewery-accent text-white' : 'bg-black/40 border-white/10 text-brewery-muted'}`}
                                        >
                                            <Rss size={18} />
                                            Rodapé (Ticker)
                                        </button>
                                        <button 
                                            onClick={() => setIsOverlay(true)}
                                            className={`flex-1 p-3 rounded-lg border text-xs font-bold uppercase transition-all flex flex-col items-center gap-2 ${isOverlay ? 'bg-rose-500/20 border-rose-500 text-white' : 'bg-black/40 border-white/10 text-brewery-muted'}`}
                                        >
                                            <Maximize size={18} />
                                            Tela Cheia
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-brewery-muted leading-tight">
                                        {isOverlay 
                                            ? "Interrompe a visualização com um alerta pop-up no centro da tela." 
                                            : "Passa uma mensagem contínua na barra inferior sem interromper."}
                                    </p>
                                </div>

                                {/* Scheduling */}
                                <div className="space-y-3 border-l border-white/10 pl-0 md:pl-6">
                                     <label className="label-pro flex items-center gap-2"><CalendarClock size={14}/> Agendamento (Opcional)</label>
                                     <div className="grid grid-cols-1 gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-brewery-muted w-8">Início</span>
                                            <input 
                                                type="datetime-local" 
                                                className="input-pro py-1 text-xs bg-black border-white/10"
                                                value={scheduleStart}
                                                onChange={(e) => setScheduleStart(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-brewery-muted w-8">Fim</span>
                                            <input 
                                                type="datetime-local" 
                                                className="input-pro py-1 text-xs bg-black border-white/10"
                                                value={scheduleEnd}
                                                onChange={(e) => setScheduleEnd(e.target.value)}
                                            />
                                        </div>
                                     </div>
                                </div>
                            </div>
                            
                            {/* ACTION BUTTON */}
                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={() => {
                                        if (newMsg) {
                                            addAnnouncement({
                                                id: Date.now().toString(),
                                                message: newMsg,
                                                type: newType,
                                                isActive: true,
                                                displayMode: isOverlay ? 'OVERLAY' : 'TICKER',
                                                schedule: (scheduleStart || scheduleEnd) ? {
                                                    start: scheduleStart || undefined,
                                                    end: scheduleEnd || undefined
                                                } : undefined
                                            });
                                            setNewMsg('');
                                            setScheduleStart('');
                                            setScheduleEnd('');
                                            setIsOverlay(false);
                                        }
                                    }} 
                                    disabled={!newMsg}
                                    className="btn-primary px-8 h-12 shadow-lg shadow-amber-900/20 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Megaphone size={18} className="mr-2" /> Publicar Aviso no Painel
                                </button>
                            </div>
                         </div>

                         {/* LIST OF ALERTS */}
                         <div className="space-y-4 pt-4">
                            <h3 className="text-xs font-bold text-brewery-muted uppercase tracking-widest flex items-center gap-2"><List size={14}/> Avisos Ativos ({announcements.length})</h3>
                            
                            {announcements.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 bg-black/20 rounded-xl border border-dashed border-brewery-border text-brewery-muted">
                                    <Bell size={40} className="mb-3 opacity-20" />
                                    <p>Nenhum aviso configurado no momento.</p>
                                </div>
                            )}

                            <div className="grid gap-3">
                                {announcements.map(item => (
                                    <div key={item.id} className="bg-brewery-card border border-brewery-border p-4 rounded-xl flex items-center justify-between group hover:border-brewery-accent/40 transition-all shadow-sm">
                                        <div className="flex items-center gap-5 overflow-hidden">
                                            {/* Type Icon Indicator */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 ${
                                                item.type === 'CRITICAL' ? 'bg-rose-900/30 border-rose-500 text-rose-500' : 
                                                item.type === 'WARNING' ? 'bg-amber-900/30 border-amber-500 text-amber-500' : 
                                                item.type === 'ATTENTION' ? 'bg-orange-900/30 border-orange-500 text-orange-500' : 
                                                'bg-blue-900/30 border-blue-500 text-blue-400'
                                            }`}>
                                                {item.type === 'CRITICAL' ? <AlertOctagon size={20} /> : 
                                                 item.type === 'WARNING' ? <AlertTriangle size={20} /> :
                                                 item.type === 'ATTENTION' ? <Megaphone size={20} /> : <Info size={20} />}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-bold text-white text-lg leading-tight truncate">{item.message}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <Badge text={item.type} color={
                                                        item.type === 'CRITICAL' ? 'rose' : 
                                                        item.type === 'WARNING' ? 'amber' : 
                                                        item.type === 'ATTENTION' ? 'orange' : 'blue'
                                                    }/>
                                                    <Badge text={item.displayMode === 'OVERLAY' ? 'TELA CHEIA' : 'RODAPÉ'} />
                                                    
                                                    {(item.schedule?.start || item.schedule?.end) && (
                                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-black/40 text-brewery-muted border border-white/10 font-mono">
                                                            <Clock size={10} />
                                                            {item.schedule.start ? new Date(item.schedule.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Agora'}
                                                            {' -> '}
                                                            {item.schedule.end ? new Date(item.schedule.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Indefinido'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => removeAnnouncement(item.id)}
                                            className="p-3 bg-black/40 hover:bg-rose-950 text-brewery-muted hover:text-rose-500 rounded-lg transition-colors border border-white/5 hover:border-rose-500/30"
                                            title="Remover Aviso"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>
                )}
                
                {/* --- TAB: LAYOUT & INTERFACE (Optimized) --- */}
                {activeTab === 'LAYOUT' && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                         <SectionHeader title="Layout & Interface" desc="Personalize a disposição dos painéis e elementos visuais." />
                         <div className="bg-brewery-card border border-brewery-border rounded-lg p-6 space-y-4">
                            <div className="flex justify-between items-center p-3 bg-black/20 rounded border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Monitor size={18} className="text-indigo-400" />
                                    <div>
                                        <span className="text-sm font-bold text-white block">Painel de Mídia (PIP)</span>
                                        <span className="text-xs text-brewery-muted">Ativar/Desativar todas as janelas flutuantes globalmente.</span>
                                    </div>
                                </div>
                                <Toggle checked={layout.showMediaPanel} onChange={() => updateLayout({ showMediaPanel: !layout.showMediaPanel })} />
                            </div>
                            
                            <div className="flex justify-between items-center p-3 bg-black/20 rounded border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Rss size={18} className="text-orange-400" />
                                    <div>
                                        <span className="text-sm font-bold text-white block">Ticker de Notícias (Rodapé)</span>
                                        <span className="text-xs text-brewery-muted">Exibir barra de rolagem de avisos na parte inferior.</span>
                                    </div>
                                </div>
                                <Toggle checked={layout.showTicker} onChange={() => updateLayout({ showTicker: !layout.showTicker })} />
                            </div>

                            {layout.showTicker && (
                                <div className="px-3 space-y-4 pt-2">
                                    <div>
                                        <label className="label-pro flex justify-between">
                                            <span>Velocidade do Ticker</span>
                                            <span className="text-indigo-400">{layout.tickerSpeed}s</span>
                                        </label>
                                        <input 
                                            type="range" min="10" max="100" step="5" 
                                            className="w-full accent-indigo-500"
                                            value={layout.tickerSpeed}
                                            onChange={(e) => updateLayout({ tickerSpeed: parseInt(e.target.value) })}
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">Quanto menor o valor, mais rápido o texto passa.</p>
                                    </div>
                                    <div>
                                        <label className="label-pro flex justify-between">
                                            <span>Altura da Barra (px)</span>
                                            <span className="text-indigo-400">{layout.tickerHeight || 60}px</span>
                                        </label>
                                        <input 
                                            type="range" min="30" max="150" step="5" 
                                            className="w-full accent-indigo-500"
                                            value={layout.tickerHeight || 60}
                                            onChange={(e) => updateLayout({ tickerHeight: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    {/* NEW: Font Size Control */}
                                    <div>
                                        <label className="label-pro flex justify-between">
                                            <span>Tamanho da Fonte (px)</span>
                                            <span className="text-indigo-400">{layout.tickerFontSize || 18}px</span>
                                        </label>
                                        <input 
                                            type="range" min="12" max="72" step="2" 
                                            className="w-full accent-indigo-500"
                                            value={layout.tickerFontSize || 18}
                                            onChange={(e) => updateLayout({ tickerFontSize: parseInt(e.target.value) })}
                                        />
                                        <p className="text-[10px] text-zinc-500 mt-1">Aumente ou diminua o texto das mensagens.</p>
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      {/* CSS Utilities for Professional Look */}
      <style>{`
        .input-pro {
            background-color: #0f0a08;
            border: 1px solid #452c20;
            border-radius: 0.5rem;
            padding: 0.6rem 0.8rem;
            color: #fffbeb;
            font-size: 0.875rem;
            width: 100%;
            transition: border-color 0.2s;
        }
        .input-pro:focus {
            outline: none;
            border-color: #f59e0b;
        }
        .label-pro {
            display: block;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            color: #d6bbaa; 
            margin-bottom: 0.4rem;
        }
        .btn-primary {
            background-color: #f59e0b;
            color: #1a110d;
            border-radius: 0.5rem;
            font-weight: 700;
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }
        .btn-primary:hover {
            background-color: #d97706;
        }
        .btn-ghost {
            background-color: transparent;
            color: #d6bbaa;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
        }
        .btn-ghost:hover {
            color: #fffbeb;
            background-color: #291d18;
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;