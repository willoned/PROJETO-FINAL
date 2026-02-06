import React, { useState, useRef } from 'react';
import { useMachineContext } from '../context/MachineContext';
import { 
  X, Trash2, Plus, Monitor, Bell, LayoutTemplate, Factory, 
  Edit2, Database, Eye,
  Settings as SettingsIcon, Activity,
  PartyPopper, Calendar, Disc, Sparkles, Wind, Server, CheckCircle, AlertTriangle, RefreshCw,
  ArrowUp, ArrowDown, Crop, Expand, Clock, Type, List, RotateCcw, Gauge, Zap, AlertOctagon, Info, Megaphone,
  Trophy, Medal, Cake, Banknote, Target, Flag, AlignLeft, AlignCenter, Image as ImageIcon, Upload, Scissors,
  BarChart3, TrendingUp, Scale, Timer, Layers, Maximize
} from 'lucide-react';
import { AnnouncementType, LineConfig } from '../types';

const SettingsPanel: React.FC = () => {
  const { 
    showSettings, toggleSettings, 
    playlists, removeMedia, reorderMedia,
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
        updateLayout({ 
            mediaWindow: { x: 50, y: 150, w: 400, h: 300 },
            logoWidget: { ...layout.logoWidget, x: 20, y: 20, w: 120, h: 120 }
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

                {/* --- TAB: ALERTS (OPTIMIZED) --- */}
                {activeTab === 'ALERTS' && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        <SectionHeader title="Mural de Avisos" desc="Gerencie comunicados e alertas para o chão de fábrica." />
                        
                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6">
                            <h3 className="font-bold text-brewery-text mb-4">Novo Aviso</h3>
                             <form onSubmit={(e) => {
                                 e.preventDefault();
                                 if(!newMsg) return;
                                 addAnnouncement({ 
                                    id: Date.now().toString(), 
                                    message: newMsg, 
                                    type: newType, 
                                    displayMode: isOverlay ? 'OVERLAY' : 'TICKER', // NEW
                                    isActive: true,
                                    schedule: (scheduleStart || scheduleEnd) ? {
                                        start: scheduleStart || undefined,
                                        end: scheduleEnd || undefined
                                    } : undefined
                                 });
                                 setNewMsg('');
                                 setScheduleStart('');
                                 setScheduleEnd('');
                                 setNewType('INFO');
                                 setIsOverlay(false);
                             }} className="space-y-6">
                                 
                                 {/* Type Selection - Visual Badges */}
                                 <div>
                                     <label className="label-pro mb-3">Tipo de Comunicado</label>
                                     <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'INFO', label: 'Informativo', color: 'bg-blue-600', icon: <Info size={14}/> },
                                            { id: 'WARNING', label: 'Alerta', color: 'bg-amber-600', icon: <AlertTriangle size={14}/> },
                                            { id: 'CRITICAL', label: 'Crítico', color: 'bg-rose-600', icon: <AlertOctagon size={14}/> },
                                            { id: 'ATTENTION', label: 'Evento', color: 'bg-orange-500 text-black', icon: <PartyPopper size={14}/> },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setNewType(t.id as any)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-all transform ${newType === t.id ? `${t.color} scale-105 shadow-lg` : 'bg-black border border-white/10 text-brewery-muted hover:border-white/30'}`}
                                            >
                                                {t.icon} {t.label}
                                            </button>
                                        ))}
                                     </div>
                                 </div>

                                 {/* Overlay Toggle */}
                                 <div className="flex justify-between items-center bg-black/30 p-3 rounded border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded ${isOverlay ? 'bg-rose-500 text-white' : 'bg-white/10 text-brewery-muted'}`}>
                                            <Maximize size={18} />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-white">Exibir como Pop-up Central</span>
                                            <span className="block text-[10px] text-brewery-muted">O aviso aparecerá grande no meio da tela, bloqueando a visão.</span>
                                        </div>
                                    </div>
                                    <Toggle checked={isOverlay} onChange={() => setIsOverlay(!isOverlay)} />
                                 </div>

                                 <div>
                                     <label className="label-pro">Mensagem</label>
                                     <input 
                                        className="input-pro text-lg h-12" 
                                        placeholder="Digite a mensagem que aparecerá no rodapé ou centro..." 
                                        value={newMsg} 
                                        onChange={e => setNewMsg(e.target.value)} 
                                        required 
                                    />
                                 </div>

                                 {/* Scheduling Inputs */}
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded border border-white/5">
                                    <div>
                                        <label className="label-pro text-[10px] flex items-center gap-1"><Clock size={12}/> Início (Opcional)</label>
                                        <input 
                                            type="datetime-local" 
                                            className="input-pro text-xs text-brewery-muted"
                                            value={scheduleStart}
                                            onChange={(e) => setScheduleStart(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label-pro text-[10px] flex items-center gap-1"><Clock size={12}/> Fim (Opcional)</label>
                                        <input 
                                            type="datetime-local" 
                                            className="input-pro text-xs text-brewery-muted"
                                            value={scheduleEnd}
                                            onChange={(e) => setScheduleEnd(e.target.value)}
                                        />
                                    </div>
                                 </div>
                                 
                                 <button type="submit" className="btn-primary w-full py-3 text-sm">
                                    <Plus size={18} className="mr-2" /> Publicar Aviso
                                 </button>

                             </form>

                             <div className="mt-8 border-t border-brewery-border pt-6">
                                <h4 className="text-xs font-bold text-brewery-muted uppercase mb-4">Avisos Ativos ({announcements.length})</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {announcements.map(ann => {
                                        const now = new Date();
                                        const start = ann.schedule?.start ? new Date(ann.schedule.start) : null;
                                        const end = ann.schedule?.end ? new Date(ann.schedule.end) : null;
                                        
                                        const isScheduledFuture = start && start > now;
                                        const isExpired = end && end < now;

                                        return (
                                        <div key={ann.id} className={`flex items-center justify-between p-3 bg-black/40 border rounded-lg transition-all ${isExpired ? 'opacity-40 border-dashed border-white/10' : 'border-white/10 hover:border-brewery-accent/50'}`}>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        ann.type === 'ATTENTION' ? 'bg-orange-500' :
                                                        ann.type === 'CRITICAL' ? 'bg-rose-500' : 
                                                        ann.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`} />
                                                    <span className={`text-brewery-text text-sm font-medium ${isExpired ? 'line-through' : ''}`}>{ann.message}</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-5 mt-1">
                                                    {ann.schedule && (
                                                        <div className="text-[10px] text-brewery-muted flex gap-2">
                                                            {isScheduledFuture && <span className="text-blue-400 bg-blue-400/10 px-1 rounded">Agendado</span>}
                                                            {isExpired && <span className="text-rose-400 bg-rose-400/10 px-1 rounded">Expirado</span>}
                                                            {(!isScheduledFuture && !isExpired) && <span className="text-emerald-400 bg-emerald-400/10 px-1 rounded">No Ar</span>}
                                                        </div>
                                                    )}
                                                    {ann.displayMode === 'OVERLAY' && (
                                                        <span className="text-[10px] font-bold text-white bg-rose-600 px-1.5 rounded flex items-center gap-1"><Maximize size={10} /> POP-UP</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => removeAnnouncement(ann.id)} className="p-2 text-brewery-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition"><Trash2 size={16}/></button>
                                        </div>
                                    )})}
                                    {announcements.length === 0 && (
                                        <div className="text-center text-brewery-muted text-sm py-4 italic">Nenhum aviso cadastrado.</div>
                                    )}
                                </div>
                             </div>
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

                 {activeTab === 'MEDIA' && (
                     <div className="space-y-6 max-w-3xl mx-auto">
                         <SectionHeader title="Playlist / Menu Digital" desc="Gerencie as imagens que aparecem na tela (Cardápios, Fotos, Vídeos, GIFs)." />
                         
                         {/* Display Settings */}
                         <div className="bg-brewery-card border border-brewery-border rounded-lg p-4 mb-6">
                             <div className="flex items-center justify-between">
                                 <div>
                                     <h3 className="font-bold text-brewery-text text-sm mb-1">Ajuste de Tela (Global)</h3>
                                     <p className="text-xs text-brewery-muted">Como o conteúdo deve se comportar</p>
                                 </div>
                                 <div className="flex bg-black/40 rounded-lg p-1 border border-brewery-border">
                                     <button 
                                        onClick={() => updateLayout({ mediaFit: 'COVER' })} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition ${layout.mediaFit === 'COVER' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}
                                     >
                                         <Crop size={14} /> Preencher (Cover)
                                     </button>
                                     <button 
                                        onClick={() => updateLayout({ mediaFit: 'CONTAIN' })} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition ${layout.mediaFit === 'CONTAIN' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}
                                     >
                                         <Expand size={14} /> Ajustar (Contain)
                                     </button>
                                 </div>
                             </div>
                         </div>

                         {/* Playlist Selector */}
                         <div className="flex items-center gap-4 mb-4">
                             <label className="text-sm font-bold text-brewery-muted uppercase">Editando Playlist:</label>
                             <div className="flex bg-black/40 rounded-lg p-1 border border-brewery-border">
                                 <button 
                                    onClick={() => setSelectedPlaylist('floating')}
                                    className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-2 transition ${selectedPlaylist === 'floating' ? 'bg-indigo-600 text-white shadow' : 'text-brewery-muted hover:text-white'}`}
                                 >
                                    <Layers size={14} /> Janela Flutuante
                                 </button>
                                 <button 
                                    onClick={() => setSelectedPlaylist('banner')}
                                    className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-2 transition ${selectedPlaylist === 'banner' ? 'bg-indigo-600 text-white shadow' : 'text-brewery-muted hover:text-white'}`}
                                 >
                                    <LayoutTemplate size={14} /> Banner Superior
                                 </button>
                             </div>
                         </div>

                         {/* Playlist Manager */}
                         <div className="bg-black/20 rounded-lg border border-brewery-border overflow-hidden">
                             <div className="p-3 border-b border-brewery-border bg-black/40 flex justify-between items-center">
                                 <span className="text-xs font-bold uppercase text-brewery-muted flex items-center gap-2">
                                    <List size={14} /> 
                                    {selectedPlaylist === 'floating' ? 'Mídia: Janela Flutuante' : 'Mídia: Banner Superior'}
                                 </span>
                                 <span className="text-xs text-brewery-muted">{currentMediaList.length} itens</span>
                             </div>
                             
                             <div className="divide-y divide-brewery-border">
                                {currentMediaList.map((item, index) => (
                                    <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-white/5 transition-colors group">
                                        <div className="w-6 text-center text-xs font-mono text-brewery-muted">{index + 1}</div>
                                        
                                        <div className="w-12 h-8 bg-black rounded overflow-hidden border border-white/10 shrink-0">
                                            {item.type === 'VIDEO' ? (
                                                <video src={item.url} className="w-full h-full object-cover opacity-50" />
                                            ) : (
                                                <img src={item.url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-brewery-text truncate">{item.name}</p>
                                            <p className="text-[10px] text-brewery-muted uppercase">{item.type} • {item.type === 'VIDEO' ? 'Auto' : `${item.duration}s`}</p>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => index > 0 && reorderMedia(selectedPlaylist, index, index - 1)}
                                                disabled={index === 0}
                                                className="p-1.5 hover:bg-black/40 rounded text-brewery-muted hover:text-white disabled:opacity-30"
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button 
                                                onClick={() => index < currentMediaList.length - 1 && reorderMedia(selectedPlaylist, index, index + 1)}
                                                disabled={index === currentMediaList.length - 1}
                                                className="p-1.5 hover:bg-black/40 rounded text-brewery-muted hover:text-white disabled:opacity-30"
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                            <div className="w-px h-4 bg-brewery-border mx-1" />
                                            <button 
                                                onClick={() => removeMedia(selectedPlaylist, item.id)}
                                                className="p-1.5 hover:bg-rose-950/50 rounded text-brewery-muted hover:text-rose-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {currentMediaList.length === 0 && (
                                    <div className="p-8 text-center text-brewery-muted border-dashed">
                                        <Monitor size={24} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Playlist vazia.</p>
                                        <p className="text-xs">Arraste arquivos para a tela principal para adicionar.</p>
                                    </div>
                                )}
                             </div>
                         </div>

                         <div className="text-xs text-center text-brewery-muted mt-2">
                             Dica: Arraste arquivos (JPG, PNG, GIF, MP4, HTML) diretamente para o painel correspondente na tela inicial para adicionar.
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
                                    <label className="label-pro mb-4 flex justify-between">
                                        <span>Velocidade do Ticker</span>
                                        <span className="text-brewery-accent">{layout.tickerSpeed || 30}s</span>
                                    </label>
                                    <input 
                                        type="range" 
                                        min="10" max="100" 
                                        value={layout.tickerSpeed || 30} 
                                        onChange={(e) => updateLayout({ tickerSpeed: Number(e.target.value) })}
                                        className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-brewery-accent"
                                    />
                                    <div className="flex justify-between text-[10px] text-brewery-muted mt-1 font-mono">
                                        <span>Rápido (10s)</span>
                                        <span>Lento (100s)</span>
                                    </div>
                                </div>
                                
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
                
                {/* --- TAB: API (Preserved) --- */}
                {activeTab === 'API' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <SectionHeader title="Integração & Conectividade" desc="Configure a ponte MQTT/WebSocket para comunicação com os PLCs." />
                        {/* Broker Config */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden shadow-lg">
                            <div className="p-4 bg-black/40 border-b border-brewery-border flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-900/30 rounded text-blue-400"><Server size={20} /></div>
                                    <div>
                                        <h3 className="font-bold text-brewery-text">Configuração do Broker</h3>
                                        <p className="text-xs text-brewery-muted">Parâmetros de conexão WebSocket/MQTT</p>
                                    </div>
                                </div>
                                <button 
                                     onClick={handleTestConnection}
                                     disabled={testStatus === 'TESTING'}
                                     className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all border
                                        ${testStatus === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50' : 
                                          testStatus === 'ERROR' ? 'bg-rose-500/10 text-rose-400 border-rose-500/50' : 
                                          'bg-white/5 hover:bg-white/10 text-brewery-muted border-white/10'}
                                     `}
                                   >
                                       {testStatus === 'TESTING' ? <RefreshCw size={14} className="animate-spin" /> : 
                                        testStatus === 'SUCCESS' ? <CheckCircle size={14} /> : 
                                        testStatus === 'ERROR' ? <AlertTriangle size={14} /> : <Zap size={14} />}
                                       
                                       {testStatus === 'IDLE' && 'Testar Conexão'}
                                       {testStatus === 'TESTING' && 'Conectando...'}
                                       {testStatus === 'SUCCESS' && 'Conectado'}
                                       {testStatus === 'ERROR' && 'Falha'}
                                   </button>
                            </div>
                            <div className="p-6 grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-2">
                                    <label className="label-pro">Protocolo</label>
                                    <select 
                                        className="input-pro"
                                        value={connectionConfig.protocol}
                                        onChange={(e) => updateConnectionConfig({ protocol: e.target.value as any })}
                                    >
                                        <option value="ws">WS</option>
                                        <option value="wss">WSS (Secure)</option>
                                        <option value="mqtt">MQTT</option>
                                    </select>
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="label-pro">Host / Endereço IP</label>
                                    <input 
                                        className="input-pro font-mono text-emerald-300" 
                                        placeholder="localhost" 
                                        value={connectionConfig.host}
                                        onChange={(e) => updateConnectionConfig({ host: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-2">
                                    <label className="label-pro">Porta</label>
                                    <input 
                                        className="input-pro font-mono" 
                                        placeholder="1880" 
                                        value={connectionConfig.port}
                                        onChange={(e) => updateConnectionConfig({ port: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-2">
                                    <label className="label-pro">Caminho</label>
                                    <input 
                                        className="input-pro font-mono text-xs" 
                                        placeholder="/ws" 
                                        value={connectionConfig.path}
                                        onChange={(e) => updateConnectionConfig({ path: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-12 my-2 border-t border-white/5"></div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="label-pro">Usuário (Opcional)</label>
                                    <input 
                                        className="input-pro" 
                                        value={connectionConfig.username || ''}
                                        onChange={(e) => updateConnectionConfig({ username: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-6">
                                    <label className="label-pro">Senha (Opcional)</label>
                                    <input 
                                        type="password"
                                        className="input-pro" 
                                        value={connectionConfig.password || ''}
                                        onChange={(e) => updateConnectionConfig({ password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. DATA MAPPING */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden shadow-lg">
                             <div className="p-4 bg-black/40 border-b border-brewery-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-900/30 rounded text-amber-400"><Activity size={20} /></div>
                                    <div>
                                        <h3 className="font-bold text-brewery-text">Mapeamento de Tags</h3>
                                        <p className="text-xs text-brewery-muted">Associe os tópicos MQTT aos equipamentos</p>
                                    </div>
                                </div>
                            </div>
                            <div className="divide-y divide-brewery-border">
                                {lineConfigs.map(line => (
                                    <div key={line.id} className="p-4 hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-brewery-border flex items-center justify-center text-brewery-muted text-xs font-bold">{line.id}</div>
                                                <div className="font-bold text-brewery-text">{line.name}</div>
                                            </div>
                                            <div className="text-xs font-mono text-brewery-muted bg-black px-2 py-1 rounded border border-brewery-border">
                                                {line.nodeRedTopic || 'Sem tópico'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-pro text-[10px] text-amber-500/80">Tópico MQTT Principal</label>
                                                <div className="flex items-center">
                                                    <span className="bg-black border-y border-l border-brewery-border text-brewery-muted px-3 py-2.5 rounded-l text-xs font-mono select-none">/</span>
                                                    <input 
                                                        className="input-pro rounded-l-none font-mono text-xs text-white border-l-0 focus:ring-0" 
                                                        value={line.nodeRedTopic}
                                                        onChange={(e) => updateLine(line.id, { nodeRedTopic: e.target.value })}
                                                        placeholder={`brewery/${line.id.toLowerCase()}`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-black/30 rounded border border-white/5 p-2 grid grid-cols-3 gap-2">
                                                <div>
                                                     <label className="text-[9px] uppercase text-brewery-muted font-bold">Prod</label>
                                                     <input className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono py-1 focus:border-amber-500 focus:outline-none text-white"
                                                        value={line.dataMapping?.productionKey}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, productionKey: e.target.value } })}
                                                     />
                                                </div>
                                                <div>
                                                     <label className="text-[9px] uppercase text-brewery-muted font-bold">Vel</label>
                                                     <input className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono py-1 focus:border-amber-500 focus:outline-none text-white"
                                                        value={line.dataMapping?.speedKey}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, speedKey: e.target.value } })}
                                                     />
                                                </div>
                                                <div>
                                                     <label className="text-[9px] uppercase text-brewery-muted font-bold">Temp</label>
                                                     <input className="w-full bg-transparent border-b border-white/10 text-[10px] font-mono py-1 focus:border-amber-500 focus:outline-none text-white"
                                                        value={line.dataMapping?.temperatureKey}
                                                        onChange={(e) => updateLine(line.id, { dataMapping: { ...line.dataMapping!, temperatureKey: e.target.value } })}
                                                     />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
      `}</style>
    </div>
  );
};

// UI Components
const EffectCard = ({ active, onClick, icon, label, description, highlight }: any) => (
    <div 
        onClick={onClick}
        className={`cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center gap-2 transition-all group ${active 
            ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40 scale-105' 
            : highlight 
                ? 'bg-purple-900/30 border-purple-500/50 text-purple-300 hover:bg-purple-900/40' 
                : 'bg-black/40 border-purple-500/20 text-purple-300 hover:bg-purple-900/20'}`}
    >
        <div className={`p-2 rounded-full transition-colors ${active ? 'bg-white/20' : 'bg-black/20 group-hover:bg-purple-600/20'}`}>{icon}</div>
        <div className="text-center">
            <span className="text-xs font-bold block">{label}</span>
            <span className={`text-[9px] ${active ? 'text-purple-100' : 'text-purple-400/60'}`}>{description}</span>
        </div>
    </div>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${active ? 'bg-brewery-accent text-black shadow-lg shadow-amber-900/20' : 'text-brewery-muted hover:bg-black/20 hover:text-white'}`}
    >
        {icon}
        {label}
    </button>
);

const SectionHeader = ({ title, desc }: any) => (
    <div className="mb-6 border-b border-brewery-border pb-4">
        <h2 className="text-2xl font-bold text-brewery-text mb-1">{title}</h2>
        <p className="text-brewery-muted text-sm">{desc}</p>
    </div>
);

const Badge = ({ text, color = 'amber' }: any) => {
    const borderColor = color === 'blue' ? 'border-blue-500/50' : 'border-brewery-border';
    const textColor = color === 'blue' ? 'text-blue-400' : 'text-brewery-muted';
    return (
        <span className={`text-[10px] font-bold bg-black ${textColor} px-1.5 py-0.5 rounded border ${borderColor}`}>{text}</span>
    );
};

const Toggle = ({ checked, onChange, color = 'amber' }: any) => {
    const bgClass = color === 'purple' 
        ? (checked ? 'bg-purple-600' : 'bg-zinc-700') 
        : (checked ? 'bg-brewery-accent' : 'bg-zinc-700');

    return (
        <button onClick={onChange} className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${bgClass}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );
};

export default SettingsPanel;