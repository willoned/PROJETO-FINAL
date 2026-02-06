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
  BarChart3, TrendingUp, Scale, Timer, Layers, Maximize, Rss, Tv, MousePointer2, Terminal, Pause, Play, Eraser
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
    connectionConfig, updateConnectionConfig
  } = useMachineContext();
  
  const [activeTab, setActiveTab] = useState<'LINES' | 'API' | 'LAYOUT' | 'MEDIA' | 'ALERTS' | 'PARTY' | 'HEADER'>('LINES');
  
  // Playlist Management State
  const [selectedPlaylist, setSelectedPlaylist] = useState('floating'); // 'floating' or 'banner'

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

  // Background Removal State
  const [isProcessingBg, setIsProcessingBg] = useState(false);

  // DEBUG CONSOLE STATE
  const [consoleLogs, setConsoleLogs] = useState<{time: string, data: any}[]>([]);
  const [isLogPaused, setIsLogPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
                    return [...prev.slice(-29), newLog];
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

  const resetLayoutPositions = () => {
    if(confirm('Isso irá resetar a posição de todos os cards, logo e da janela de mídia. Continuar?')) {
        // 1. Reset Global UI Elements
        updateLayout({ 
            mediaWindow: { x: 800, y: 350, w: 400, h: 300 },
            logoWidget: { ...layout.logoWidget, x: 20, y: 20, w: 120, h: 120 }
        });

        // 2. Reset All Machines to Default Constants
        lineConfigs.forEach(line => {
            const def = DEFAULT_LINES.find(d => d.id === line.id);
            if (def) {
                updateLine(line.id, { x: def.x, y: def.y, w: def.w, h: def.h });
            } else {
                // Cascading fallback for new lines created by user
                updateLine(line.id, { x: 50, y: 50 });
            }
        });
    }
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
                  // Canvas magic for simple background removal (White/Light pixels)
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  
                  // Scale down if too huge to save performance
                  // For logos we want better quality, but for particles smaller is better.
                  const maxWidth = type === 'PARTY' ? 300 : 800;
                  const scale = Math.min(1, maxWidth / img.width);
                  canvas.width = img.width * scale;
                  canvas.height = img.height * scale;
                  
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;
                  
                  // Simple algorithm: If pixel is light, make transparent
                  for (let i = 0; i < data.length; i += 4) {
                      const r = data[i];
                      const g = data[i + 1];
                      const b = data[i + 2];
                      
                      // Threshold for "White-ish"
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
                                            
                                            {/* METRICS GRID OPTIMIZED */}
                                            <div className="p-5 bg-black/30 rounded-lg border border-white/5">
                                                <div className="col-span-full text-xs font-bold text-brewery-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Eye size={14} /> Dados Visíveis no Card
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
                                                        <span className="text-[10px] font-bold uppercase">Vazão ({editForm.productionUnit || 'L'}/{editForm.timeBasis === 'MINUTE' ? 'Min' : editForm.timeBasis === 'DAY' ? 'Dia' : 'Hora'})</span>
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

                {/* --- TAB: API CONNECTION --- */}
                {activeTab === 'API' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <SectionHeader title="Conexão Industrial" desc="Configuração do protocolo WebSocket/MQTT para o chão de fábrica." />

                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6 space-y-6">
                            
                            {/* Protocol & Host */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="col-span-1">
                                    <label className="label-pro">Protocolo</label>
                                    <select 
                                        className="input-pro"
                                        value={connectionConfig.protocol}
                                        onChange={(e) => updateConnectionConfig({ protocol: e.target.value as 'ws' | 'wss' })}
                                    >
                                        <option value="ws">WS://</option>
                                        <option value="wss">WSS:// (Secure)</option>
                                    </select>
                                </div>
                                <div className="col-span-1 md:col-span-3">
                                    <label className="label-pro">Host / IP do Servidor</label>
                                    <input 
                                        className="input-pro font-mono"
                                        placeholder="localhost ou 192.168.1.50"
                                        value={connectionConfig.host}
                                        onChange={(e) => updateConnectionConfig({ host: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Port & Path */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="col-span-1">
                                    <label className="label-pro">Porta</label>
                                    <input 
                                        className="input-pro font-mono"
                                        placeholder="1880"
                                        value={connectionConfig.port}
                                        onChange={(e) => updateConnectionConfig({ port: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-3">
                                    <label className="label-pro">Caminho (Path/Topic)</label>
                                    <input 
                                        className="input-pro font-mono"
                                        placeholder="/ws/brewery-data"
                                        value={connectionConfig.path}
                                        onChange={(e) => updateConnectionConfig({ path: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Authentication */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="col-span-1">
                                    <label className="label-pro">Usuário (Opcional)</label>
                                    <input 
                                        className="input-pro"
                                        placeholder="admin"
                                        value={connectionConfig.username || ''}
                                        onChange={(e) => updateConnectionConfig({ username: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="label-pro">Senha (Opcional)</label>
                                    <input 
                                        type="password"
                                        className="input-pro"
                                        placeholder="••••••"
                                        value={connectionConfig.password || ''}
                                        onChange={(e) => updateConnectionConfig({ password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-brewery-border my-2"></div>

                            {/* Status & Actions */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${connectionConfig.autoConnect ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-sm font-bold text-brewery-muted">Conexão Automática {connectionConfig.autoConnect ? 'Ativada' : 'Desativada'}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleTestConnection}
                                        disabled={testStatus === 'TESTING'}
                                        className={`btn-ghost border border-white/10 ${
                                            testStatus === 'SUCCESS' ? 'text-emerald-400 border-emerald-500/50' : 
                                            testStatus === 'ERROR' ? 'text-rose-500 border-rose-500/50' : ''
                                        }`}
                                    >
                                        {testStatus === 'TESTING' ? <RefreshCw className="animate-spin" size={18} /> : 
                                         testStatus === 'SUCCESS' ? <CheckCircle size={18} /> : 
                                         testStatus === 'ERROR' ? <AlertTriangle size={18} /> : 
                                         <Activity size={18} />}
                                        <span className="ml-2">{
                                            testStatus === 'TESTING' ? 'Testando...' : 
                                            testStatus === 'SUCCESS' ? 'Conexão OK' : 
                                            testStatus === 'ERROR' ? 'Falha' : 
                                            'Testar Conexão'
                                        }</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- DEBUG CONSOLE (NEW) --- */}
                        <div className="bg-black/95 border border-brewery-border rounded-lg overflow-hidden flex flex-col shadow-inner h-[300px]">
                            {/* Terminal Header */}
                            <div className="flex justify-between items-center bg-zinc-900/50 p-2 border-b border-white/10">
                                <div className="flex items-center gap-2 px-2">
                                    <Terminal size={14} className="text-emerald-400" />
                                    <span className="text-xs font-mono font-bold text-zinc-300">RECEBIMENTO DE DADOS EM TEMPO REAL</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsLogPaused(!isLogPaused)} 
                                        className={`p-1.5 rounded hover:bg-white/10 transition-colors ${isLogPaused ? 'text-amber-400 bg-amber-900/20' : 'text-zinc-400'}`}
                                        title={isLogPaused ? "Resumir" : "Pausar"}
                                    >
                                        {isLogPaused ? <Play size={14} /> : <Pause size={14} />}
                                    </button>
                                    <button 
                                        onClick={() => setConsoleLogs([])} 
                                        className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                                        title="Limpar Console"
                                    >
                                        <Eraser size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Terminal Body */}
                            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] md:text-xs space-y-2 custom-scrollbar">
                                {consoleLogs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                                        <Activity size={24} className="opacity-50" />
                                        <p>Aguardando dados do WebSocket...</p>
                                    </div>
                                ) : (
                                    consoleLogs.map((log, i) => (
                                        <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-200">
                                            <span className="text-zinc-500 mr-2">[{log.time}]</span>
                                            <span className="text-emerald-500 font-bold mr-2">&gt;</span>
                                            <span className="text-zinc-300 whitespace-pre-wrap break-all">{JSON.stringify(log.data)}</span>
                                        </div>
                                    ))
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: MEDIA & MENU --- */}
                {activeTab === 'MEDIA' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <SectionHeader title="Gestão de Mídia" desc="Gerencie imagens e vídeos exibidos nos players." />

                        {/* Playlist Selection */}
                        <div className="flex gap-4 mb-6">
                            <button 
                                onClick={() => setSelectedPlaylist('floating')}
                                className={`flex-1 py-4 px-6 rounded-lg border flex flex-col items-center gap-2 transition-all ${selectedPlaylist === 'floating' ? 'bg-brewery-accent text-black border-transparent shadow-lg' : 'bg-brewery-card border-brewery-border text-brewery-muted hover:border-brewery-muted'}`}
                            >
                                <Monitor size={24} />
                                <span className="font-bold uppercase tracking-wider text-xs">Janela Flutuante</span>
                            </button>
                            <button 
                                onClick={() => setSelectedPlaylist('banner')}
                                className={`flex-1 py-4 px-6 rounded-lg border flex flex-col items-center gap-2 transition-all ${selectedPlaylist === 'banner' ? 'bg-brewery-accent text-black border-transparent shadow-lg' : 'bg-brewery-card border-brewery-border text-brewery-muted hover:border-brewery-muted'}`}
                            >
                                <Tv size={24} />
                                <span className="font-bold uppercase tracking-wider text-xs">Banner Superior</span>
                            </button>
                        </div>

                        {/* Media List */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden flex flex-col h-[400px]">
                            <div className="p-4 bg-black/20 border-b border-brewery-border flex justify-between items-center">
                                <span className="text-xs font-bold text-brewery-muted uppercase">Itens da Playlist ({currentMediaList.length})</span>
                                {/* Note: Adding files is done via the specific MediaPanel on the HUD for drag-drop convenience, 
                                    but we could add a button here too if needed. */}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                {currentMediaList.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-brewery-muted opacity-50">
                                        <Monitor size={48} className="mb-2"/>
                                        <p>Nenhuma mídia nesta playlist</p>
                                    </div>
                                ) : (
                                    currentMediaList.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-4 p-3 rounded bg-black/40 border border-white/5 group hover:border-white/10 transition-colors">
                                            <div className="w-10 h-10 bg-black rounded overflow-hidden flex items-center justify-center text-brewery-muted shrink-0">
                                                {item.type === 'IMAGE' ? <ImageIcon size={20} /> : <Monitor size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-white truncate">{item.name}</p>
                                                <div className="flex gap-2 text-[10px] text-brewery-muted uppercase items-center">
                                                    <span>{item.type}</span>
                                                    {item.type !== 'VIDEO' && (
                                                        <div className="flex items-center gap-1 bg-black/40 rounded px-2 py-0.5 border border-white/10 ml-2 group-hover:border-white/30 transition-colors">
                                                            <Clock size={10} className="text-brewery-muted" />
                                                            <input 
                                                                type="number" 
                                                                min="1" 
                                                                value={item.duration} 
                                                                onChange={(e) => updateMedia(selectedPlaylist, item.id, { duration: Math.max(1, Number(e.target.value)) })}
                                                                className="w-8 bg-transparent text-[10px] text-white text-center focus:outline-none appearance-none font-mono font-bold"
                                                            />
                                                            <span className="text-[9px] text-brewery-muted">seg</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => idx > 0 && reorderMedia(selectedPlaylist, idx, idx-1)} className="p-2 hover:bg-white/10 rounded disabled:opacity-20" disabled={idx === 0}><ArrowUp size={16}/></button>
                                                <button onClick={() => idx < currentMediaList.length-1 && reorderMedia(selectedPlaylist, idx, idx+1)} className="p-2 hover:bg-white/10 rounded disabled:opacity-20" disabled={idx === currentMediaList.length-1}><ArrowDown size={16}/></button>
                                                <button onClick={() => removeMedia(selectedPlaylist, item.id)} className="p-2 hover:bg-rose-950 text-rose-500 rounded ml-2"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: GENERAL ALERTS --- */}
                {activeTab === 'ALERTS' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <SectionHeader title="Avisos Gerais" desc="Mensagens importantes, alertas de segurança e comunicados." />

                        {/* New Alert Form */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6 space-y-4 shadow-lg relative overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="label-pro">Mensagem</label>
                                    <input 
                                        className="input-pro h-12 text-lg" 
                                        placeholder="Ex: Reunião geral às 14h" 
                                        value={newMsg}
                                        onChange={(e) => setNewMsg(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newMsg) {
                                                addAnnouncement({ id: Date.now().toString(), message: newMsg, type: newType, displayMode: isOverlay ? 'OVERLAY' : 'TICKER', isActive: true });
                                                setNewMsg('');
                                            }
                                        }}
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="label-pro">Tipo</label>
                                    <select 
                                        className="input-pro h-12"
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value as AnnouncementType)}
                                    >
                                        <option value="INFO">Informação</option>
                                        <option value="WARNING">Aviso</option>
                                        <option value="CRITICAL">Crítico</option>
                                        <option value="ATTENTION">Atenção</option>
                                    </select>
                                </div>
                            </div>

                            {/* Scheduling */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="label-pro">Início (Opcional)</label>
                                    <input type="datetime-local" className="input-pro" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} />
                                </div>
                                <div>
                                    <label className="label-pro">Fim (Opcional)</label>
                                    <input type="datetime-local" className="input-pro" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center gap-3 bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                                    <Toggle checked={isOverlay} onChange={() => setIsOverlay(!isOverlay)} />
                                    <div>
                                        <span className="text-sm font-bold block text-white">{isOverlay ? 'Modo Overlay (Tela Cheia)' : 'Modo Ticker (Rodapé)'}</span>
                                        <span className="text-[10px] text-brewery-muted block">{isOverlay ? 'Interrompe a visualização com pop-up' : 'Passa texto na barra inferior'}</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        if(newMsg) {
                                            addAnnouncement({ 
                                                id: Date.now().toString(), 
                                                message: newMsg, 
                                                type: newType, 
                                                displayMode: isOverlay ? 'OVERLAY' : 'TICKER', 
                                                isActive: true,
                                                schedule: scheduleStart || scheduleEnd ? {
                                                    start: scheduleStart || undefined,
                                                    end: scheduleEnd || undefined
                                                } : undefined
                                            });
                                            setNewMsg('');
                                            setScheduleStart('');
                                            setScheduleEnd('');
                                        }
                                    }}
                                    className="btn-primary px-8 h-12"
                                >
                                    Adicionar Aviso
                                </button>
                            </div>

                            {/* ANIMATED PREVIEW */}
                            {newMsg && (
                                <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                                    <label className="label-pro mb-2 flex items-center gap-2 text-indigo-400"><Eye size={12}/> Pré-visualização em tempo real</label>
                                    
                                    {isOverlay ? (
                                        <div className="w-full aspect-[21/9] bg-black/80 rounded-lg flex items-center justify-center border-4 relative overflow-hidden transition-all duration-300 transform scale-95"
                                             style={{
                                                 borderColor: newType === 'CRITICAL' ? '#f43f5e' : newType === 'WARNING' ? '#f59e0b' : newType === 'ATTENTION' ? '#f97316' : '#3b82f6',
                                                 boxShadow: newType === 'CRITICAL' ? '0 0 20px rgba(244,63,94,0.4)' : 'none'
                                             }}
                                        >
                                            <div className={`text-center space-y-2 ${newType === 'CRITICAL' ? 'animate-pulse' : ''}`}>
                                                {newType === 'CRITICAL' && <AlertOctagon size={40} className="mx-auto text-rose-500 mb-2" />}
                                                {newType === 'WARNING' && <AlertTriangle size={40} className="mx-auto text-amber-500 mb-2 animate-bounce" />}
                                                {newType === 'ATTENTION' && <Megaphone size={40} className="mx-auto text-orange-500 mb-2 animate-wiggle" />}
                                                <h3 className="text-2xl font-black text-white uppercase tracking-wider">{newMsg}</h3>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-12 bg-black rounded-full overflow-hidden flex items-center px-4 relative border border-white/10">
                                            <div className={`
                                                flex items-center px-4 py-1 rounded-full whitespace-nowrap
                                                ${newType === 'ATTENTION' 
                                                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-black border-2 border-yellow-400 animate-flash-alert' 
                                                    : newType === 'CRITICAL' 
                                                    ? 'bg-rose-950/80 border border-rose-500 animate-critical-attention' 
                                                    : newType === 'WARNING'
                                                    ? 'bg-amber-950/80 border border-amber-500 animate-warning-float'
                                                    : 'bg-blue-950/80 border border-blue-500'
                                                }
                                            `}>
                                                 {newType === 'ATTENTION' && <Megaphone className="mr-2 animate-wiggle" size={16} />}
                                                 {newType === 'CRITICAL' && <AlertOctagon className="mr-2" size={16} />}
                                                 {newType === 'WARNING' && <AlertTriangle className="mr-2" size={16} />}
                                                 <span className={`font-mono font-bold ${newType === 'ATTENTION' ? 'text-black' : 'text-white'}`}>{newMsg}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Active Alerts List */}
                        <div className="space-y-2">
                            <label className="label-pro">Avisos Ativos</label>
                            {announcements.map(alert => (
                                <div key={alert.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5 group hover:bg-black/40 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                            ${alert.type === 'INFO' ? 'bg-blue-500/20 text-blue-500' :
                                              alert.type === 'WARNING' ? 'bg-amber-500/20 text-amber-500' :
                                              alert.type === 'ATTENTION' ? 'bg-orange-500/20 text-orange-500' :
                                              'bg-rose-500/20 text-rose-500 animate-pulse'}
                                        `}>
                                            {alert.type === 'INFO' ? <Info size={20} /> :
                                             alert.type === 'WARNING' ? <AlertTriangle size={20} /> :
                                             alert.type === 'ATTENTION' ? <Megaphone size={20} /> :
                                             <AlertOctagon size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{alert.message}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge text={alert.type} />
                                                <Badge text={alert.displayMode === 'OVERLAY' ? 'TELA CHEIA' : 'RODAPÉ'} color="blue" />
                                                {alert.schedule && <Badge text="AGENDADO" color="blue" />}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeAnnouncement(alert.id)} className="p-3 text-brewery-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                            {announcements.length === 0 && (
                                <div className="text-center py-10 text-brewery-muted opacity-50 border-2 border-dashed border-brewery-border rounded-lg">
                                    <Bell size={40} className="mx-auto mb-2" />
                                    <p>Nenhum aviso ativo no momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB: PARTY MODE (OPTIMIZED) --- */}
                {activeTab === 'PARTY' && (
                     <div className="space-y-6 max-w-4xl mx-auto">
                        <SectionHeader title="Modo Festa & Eventos" desc="Transforme o painel para Happy Hours e celebrações." />
                        
                        {/* Main Toggle Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 border border-purple-500/30 rounded-xl p-8 shadow-2xl transition-all duration-300">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

                            <div className="relative z-10 flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="font-bold text-white text-2xl flex items-center gap-3 drop-shadow-md">
                                        <PartyPopper className="text-purple-300" size={32} /> 
                                        Modo Festa
                                    </h3>
                                    <p className="text-purple-200/70 mt-1">Ative efeitos visuais, altere cores e exiba animações.</p>
                                </div>
                                <Toggle checked={layout.isPartyMode} onChange={() => updateLayout({ isPartyMode: !layout.isPartyMode })} color="purple" />
                            </div>
                            
                            <div className={`space-y-8 transition-all duration-500 ${layout.isPartyMode ? 'opacity-100 translate-y-0' : 'opacity-50 blur-[2px] pointer-events-none grayscale'}`}>
                                
                                {/* 1. Message */}
                                <div className="bg-black/20 p-4 rounded-lg border border-purple-500/20">
                                    <label className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-2 block">Mensagem do Cabeçalho</label>
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 bg-black/30 border border-purple-400/30 rounded-lg px-4 py-3 text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-400 transition"
                                            value={layout.partyMessage || ''} 
                                            onChange={(e) => updateLayout({ partyMessage: e.target.value })}
                                            placeholder="Ex: HAPPY HOUR DA CERVEJARIA!"
                                        />
                                    </div>
                                </div>

                                {/* 2. Effect Grid */}
                                <div>
                                    <label className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-4 block">Efeito Visual de Fundo</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                                        
                                        {/* Special Custom Card */}
                                        <div 
                                            onClick={() => updateLayout({ partyEffect: 'CUSTOM' })}
                                            className={`col-span-1 md:col-span-2 cursor-pointer rounded-lg border p-4 flex flex-row items-center gap-4 transition-all group relative overflow-hidden ${layout.partyEffect === 'CUSTOM' ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40 ring-2 ring-purple-300' : 'bg-black/40 border-purple-500/20 text-purple-300 hover:bg-purple-900/20'}`}
                                        >
                                            <div className={`p-3 rounded-full transition-colors shrink-0 ${layout.partyEffect === 'CUSTOM' ? 'bg-white/20' : 'bg-black/20 group-hover:bg-purple-600/20'}`}>
                                                <ImageIcon size={28} />
                                            </div>
                                            <div className="z-10">
                                                <span className="text-sm font-bold block">Personalizado</span>
                                                <span className={`text-[10px] ${layout.partyEffect === 'CUSTOM' ? 'text-purple-100' : 'text-purple-400/60'}`}>Use sua própria imagem ou logo caindo na tela</span>
                                            </div>
                                        </div>

                                        <EffectCard active={layout.partyEffect === 'BUBBLES'} onClick={() => updateLayout({ partyEffect: 'BUBBLES' })} icon={<Wind size={24} />} label="Bolhas" description="Estilo Cerveja" />
                                        <EffectCard active={layout.partyEffect === 'CONFETTI'} onClick={() => updateLayout({ partyEffect: 'CONFETTI' })} icon={<PartyPopper size={24} />} label="Confetes" description="Celebração" />
                                        <EffectCard active={layout.partyEffect === 'WORLDCUP'} onClick={() => updateLayout({ partyEffect: 'WORLDCUP' })} icon={<Flag size={24} />} label="Copa" description="Verde e Amarelo" />
                                        <EffectCard active={layout.partyEffect === 'OLYMPICS'} onClick={() => updateLayout({ partyEffect: 'OLYMPICS' })} icon={<Medal size={24} />} label="Olimpíadas" description="Cores Olímpicas" />
                                        <EffectCard active={layout.partyEffect === 'BIRTHDAY'} onClick={() => updateLayout({ partyEffect: 'BIRTHDAY' })} icon={<Cake size={24} />} label="Aniversário" description="Balões" />
                                        <EffectCard active={layout.partyEffect === 'BONUS'} onClick={() => updateLayout({ partyEffect: 'BONUS' })} icon={<Banknote size={24} />} label="Bônus" description="Chuva de $$$" />
                                        <EffectCard active={layout.partyEffect === 'GOAL'} onClick={() => updateLayout({ partyEffect: 'GOAL' })} icon={<Trophy size={24} />} label="Meta Batida" description="Troféus e Ouro" />
                                        <EffectCard active={layout.partyEffect === 'DISCO'} onClick={() => updateLayout({ partyEffect: 'DISCO' })} icon={<Disc size={24} />} label="Disco" description="Luzes Strobe" />
                                        <EffectCard active={layout.partyEffect === 'GLOW'} onClick={() => updateLayout({ partyEffect: 'GLOW' })} icon={<Sparkles size={24} />} label="Glow" description="Ambiente Suave" />
                                    </div>
                                </div>

                                {/* Custom Image Uploader for Party Mode (Only if CUSTOM selected) */}
                                {layout.partyEffect === 'CUSTOM' && (
                                    <div className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-6 animate-in slide-in-from-top duration-300">
                                        <div className="flex flex-col md:flex-row gap-6 items-center">
                                            <div className="w-24 h-24 bg-black/50 rounded-lg border border-purple-500/30 flex items-center justify-center overflow-hidden shrink-0 relative shadow-lg">
                                                {/* Checkerboard pattern for transparency */}
                                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' }} />
                                                
                                                {layout.customPartyImage ? (
                                                    <img src={layout.customPartyImage} className="w-full h-full object-contain relative z-10" />
                                                ) : (
                                                    <ImageIcon className="text-purple-400 opacity-50 relative z-10" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-white mb-2">Imagem da Partícula</h4>
                                                <p className="text-xs text-purple-300 mb-4 leading-relaxed">
                                                    Envie um logo, rosto ou ícone (PNG/JPG). Esta imagem cairá repetidamente na tela.<br/>
                                                    Use a ferramenta de "Recortar Fundo" se sua imagem tiver fundo branco/sólido.
                                                </p>
                                                <div className="flex gap-3">
                                                    <label className={`btn-primary bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-xs py-2 px-4 border border-white/10 ${isProcessingBg ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {isProcessingBg ? <RefreshCw className="animate-spin mr-2" size={14}/> : <Upload size={14} className="mr-2" />}
                                                        Upload Original
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/png, image/jpeg, image/gif" 
                                                            onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], false, 'PARTY')} 
                                                        />
                                                    </label>
                                                    <label className={`btn-primary bg-purple-600 hover:bg-purple-500 cursor-pointer text-xs py-2 px-4 shadow-lg shadow-purple-900/50 ${isProcessingBg ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {isProcessingBg ? <RefreshCw className="animate-spin mr-2" size={14}/> : <Scissors size={14} className="mr-2" />}
                                                        Upload & Recortar Fundo
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/png, image/jpeg" 
                                                            onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], true, 'PARTY')} 
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- TAB: LAYOUT, HEADER, API (Remaining tabs logic reused) --- */}
                {activeTab === 'HEADER' && (
                     <div className="space-y-6 max-w-3xl mx-auto">
                        <SectionHeader title="Cabeçalho & Marca" desc="Personalize o título, cores e banner superior da aplicação." />

                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6 space-y-6">
                            
                            {/* Alignment & Logo */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 w-full">
                                    <label className="label-pro mb-3">Alinhamento do Título</label>
                                    <div className="flex bg-black/40 rounded-lg p-1 border border-brewery-border">
                                        <button 
                                            onClick={() => updateLayout({ header: { ...layout.header, alignment: 'LEFT' } })} 
                                            className={`flex-1 py-2 text-xs font-bold rounded flex justify-center items-center gap-2 transition ${layout.header.alignment === 'LEFT' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}
                                        >
                                            <AlignLeft size={16} /> Esquerda
                                        </button>
                                        <button 
                                            onClick={() => updateLayout({ header: { ...layout.header, alignment: 'CENTER' } })} 
                                            className={`flex-1 py-2 text-xs font-bold rounded flex justify-center items-center gap-2 transition ${layout.header.alignment === 'CENTER' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}
                                        >
                                            <AlignCenter size={16} /> Centralizado
                                        </button>
                                    </div>
                                </div>
                                
                                {/* CUSTOM LOGO UPLOADER WITH CUTOUT */}
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="label-pro mb-0">Logo Personalizado</label>
                                        <Toggle checked={layout.logoWidget?.show} onChange={() => updateLayout({ logoWidget: { ...layout.logoWidget, show: !layout.logoWidget.show } })} />
                                    </div>
                                    
                                    <div className="bg-black/30 border border-white/10 rounded-lg p-4">
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 bg-black/50 rounded border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                                                {/* Checkerboard for transparency check */}
                                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' }} />
                                                
                                                {layout.logoWidget?.url ? (
                                                    <img src={layout.logoWidget.url} className="w-full h-full object-contain relative z-10" />
                                                ) : (
                                                    <ImageIcon className="text-brewery-muted opacity-30 relative z-10" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center gap-2">
                                                <p className="text-[10px] text-brewery-muted mb-1">
                                                    Max 5MB. A logo ficará flutuante na tela e pode ser redimensionada.
                                                </p>
                                                <div className="flex gap-2">
                                                    <label className={`btn-primary flex-1 cursor-pointer text-[10px] py-1.5 px-2 ${isProcessingBg ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {isProcessingBg ? <RefreshCw className="animate-spin mr-1" size={12}/> : <Upload size={12} className="mr-1" />}
                                                        Original
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*" 
                                                            onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], false, 'LOGO')} 
                                                        />
                                                    </label>
                                                    <label className={`btn-primary bg-indigo-600 hover:bg-indigo-500 flex-1 cursor-pointer text-[10px] py-1.5 px-2 ${isProcessingBg ? 'opacity-50 pointer-events-none' : ''}`}>
                                                        {isProcessingBg ? <RefreshCw className="animate-spin mr-1" size={12}/> : <Scissors size={12} className="mr-1" />}
                                                        Recortar Fundo
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*" 
                                                            onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0], true, 'LOGO')} 
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-brewery-border"></div>

                            {/* Title & Subtitle */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        className="input-pro"
                                        value={layout.header.subtitle}
                                        onChange={(e) => updateLayout({ header: { ...layout.header, subtitle: e.target.value } })}
                                    />
                                </div>
                            </div>

                            {/* Colors */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-pro">Cor do Texto</label>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="color" 
                                            className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                            value={layout.header.textColor}
                                            onChange={(e) => updateLayout({ header: { ...layout.header, textColor: e.target.value } })}
                                        />
                                        <input 
                                            className="input-pro font-mono uppercase"
                                            value={layout.header.textColor}
                                            onChange={(e) => updateLayout({ header: { ...layout.header, textColor: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-pro">Cor do Fundo</label>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="color" 
                                            className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                            value={layout.header.backgroundColor}
                                            onChange={(e) => updateLayout({ header: { ...layout.header, backgroundColor: e.target.value } })}
                                        />
                                        <input 
                                            className="input-pro font-mono uppercase"
                                            value={layout.header.backgroundColor}
                                            onChange={(e) => updateLayout({ header: { ...layout.header, backgroundColor: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-brewery-border my-6"></div>

                            {/* Top Media Banner */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-brewery-text flex items-center gap-2"><Monitor size={18}/> Banner de Mídia Superior</h3>
                                    <p className="text-xs text-brewery-muted mt-1">Exibe uma tela de mídia de largura total no topo (abaixo do cabeçalho).</p>
                                </div>
                                <Toggle checked={layout.header.showTopMedia} onChange={() => updateLayout({ header: { ...layout.header, showTopMedia: !layout.header.showTopMedia } })} />
                            </div>
                        </div>
                     </div>
                )}
                
                {activeTab === 'LAYOUT' && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        <SectionHeader title="Layout & Interface" desc="Personalize a disposição dos painéis e elementos visuais." />

                        {/* 1. Window Management */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-brewery-text flex items-center gap-2"><LayoutTemplate size={18}/> Elementos da Tela</h3>
                                    <p className="text-xs text-brewery-muted mt-1">Controle o que é exibido no dashboard principal.</p>
                                </div>
                                <button 
                                    onClick={resetLayoutPositions}
                                    className="text-xs text-brewery-muted flex items-center gap-1 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition"
                                >
                                    <RotateCcw size={12} /> Resetar Posições
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Monitor size={18} className="text-indigo-400" />
                                        <div>
                                            <span className="text-sm font-bold text-white block">Janela de Mídia Flutuante</span>
                                            <span className="text-xs text-brewery-muted">Player PIP (Picture-in-Picture) arrastável</span>
                                        </div>
                                    </div>
                                    <Toggle checked={layout.showMediaPanel} onChange={() => updateLayout({ showMediaPanel: !layout.showMediaPanel })} />
                                </div>
                                
                                <div className="p-3 bg-black/20 rounded border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="text-indigo-400"><MousePointer2 size={18} /></div>
                                            <div>
                                                <span className="text-sm font-bold text-white block">Configuração da Janela de Mídia</span>
                                                <span className="text-xs text-brewery-muted">Ajuste manual de posição e tamanho</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        <div>
                                            <label className="block text-[10px] uppercase text-brewery-muted mb-1">Largura</label>
                                            <input className="input-pro py-1 px-2" type="number" value={layout.mediaWindow.w} onChange={(e) => updateLayout({ mediaWindow: { ...layout.mediaWindow, w: Number(e.target.value) } })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-brewery-muted mb-1">Altura</label>
                                            <input className="input-pro py-1 px-2" type="number" value={layout.mediaWindow.h} onChange={(e) => updateLayout({ mediaWindow: { ...layout.mediaWindow, h: Number(e.target.value) } })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-brewery-muted mb-1">Pos X</label>
                                            <input className="input-pro py-1 px-2" type="number" value={layout.mediaWindow.x} onChange={(e) => updateLayout({ mediaWindow: { ...layout.mediaWindow, x: Number(e.target.value) } })} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-brewery-muted mb-1">Pos Y</label>
                                            <input className="input-pro py-1 px-2" type="number" value={layout.mediaWindow.y} onChange={(e) => updateLayout({ mediaWindow: { ...layout.mediaWindow, y: Number(e.target.value) } })} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <Megaphone size={18} className="text-orange-400" />
                                        <div>
                                            <span className="text-sm font-bold text-white block">Ticker de Notícias</span>
                                            <span className="text-xs text-brewery-muted">Barra de rolagem inferior</span>
                                        </div>
                                    </div>
                                    <Toggle checked={layout.showTicker} onChange={() => updateLayout({ showTicker: !layout.showTicker })} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Behavior Settings */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6">
                            <h3 className="font-bold text-brewery-text mb-4 flex items-center gap-2"><Gauge size={18}/> Comportamento</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-pro mb-2">Ajuste de Mídia</label>
                                    <div className="flex bg-black rounded p-1 border border-brewery-border">
                                        <button 
                                            onClick={() => updateLayout({ mediaFit: 'COVER' })} 
                                            className={`flex-1 py-2 text-xs font-bold rounded flex justify-center items-center gap-2 transition ${layout.mediaFit === 'COVER' ? 'bg-brewery-accent text-black' : 'text-brewery-muted hover:text-white'}`}
                                        >
                                            <Crop size={14} /> Preencher
                                        </button>
                                        <button 
                                            onClick={() => updateLayout({ mediaFit: 'CONTAIN' })} 
                                            className={`flex-1 py-2 text-xs font-bold rounded flex justify-center items-center gap-2 transition ${layout.mediaFit === 'CONTAIN' ? 'bg-brewery-accent text-black' : 'text-brewery-muted hover:text-white'}`}
                                        >
                                            <Expand size={14} /> Ajustar
                                        </button>
                                    </div>
                                </div>
                            </div>
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
        /* Custom Animations for Alert Preview */
        .animate-critical-attention {
          animation: critical-attention 2s infinite ease-in-out;
        }
        .animate-warning-float {
          animation: warning-float 3s infinite ease-in-out;
        }
        .animate-flash-alert {
          animation: flash-alert 1s infinite linear;
        }
        .animate-wiggle {
          animation: wiggle 0.5s infinite ease-in-out;
        }
        @keyframes critical-attention {
          0%, 100% { transform: scale(1); background-color: rgba(76, 5, 25, 0.6); border-color: rgba(244, 63, 94, 0.5); }
          50% { transform: scale(1.05); background-color: rgba(136, 19, 55, 0.6); border-color: #fff; }
        }
        @keyframes warning-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes flash-alert {
          0%, 100% { opacity: 1; border-color: #fbbf24; }
          50% { opacity: 0.9; border-color: #fff; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
