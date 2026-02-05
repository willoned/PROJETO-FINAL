import React, { useState } from 'react';
import { useMachineContext } from '../context/MachineContext';
import { 
  X, Trash2, Plus, Monitor, Bell, LayoutTemplate, Factory, 
  Edit2, Save, Database, ArrowLeftRight, ArrowUpDown, 
  AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, Eye,
  Maximize, Minimize, Settings as SettingsIcon, Activity, Key, Copy,
  PartyPopper, Calendar, Disc, Sparkles, Wind, Server, Wifi, PlayCircle, CheckCircle, AlertTriangle, RefreshCw,
  ArrowUp, ArrowDown, Crop, Expand
} from 'lucide-react';
import { AnnouncementType, LineConfig, PartyEffect } from '../types';

const SettingsPanel: React.FC = () => {
  const { 
    showSettings, toggleSettings, 
    mediaPlaylist, removeMedia, reorderMedia,
    announcements, addAnnouncement, removeAnnouncement,
    layout, updateLayout,
    lineConfigs, addLine, removeLine, updateLine,
    connectionConfig, updateConnectionConfig
  } = useMachineContext();
  
  const [activeTab, setActiveTab] = useState<'LINES' | 'API' | 'LAYOUT' | 'MEDIA' | 'ALERTS' | 'PARTY'>('LINES');
  
  // Local state
  const [newMsg, setNewMsg] = useState('');
  const [newType, setNewType] = useState<AnnouncementType>('INFO');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LineConfig>>({});
  const [newLineForm, setNewLineForm] = useState({ id: '', name: '' });

  // Test Connection State
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');

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

  const handleTestConnection = () => {
    setTestStatus('TESTING');
    // Simulate connection attempt
    setTimeout(() => {
        // Simple mock validation logic
        const isValid = connectionConfig.host && connectionConfig.port;
        setTestStatus(isValid ? 'SUCCESS' : 'ERROR');
        
        // Reset after 3 seconds
        setTimeout(() => setTestStatus('IDLE'), 3000);
    }, 1500);
  };

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
                <NavButton active={activeTab === 'API'} onClick={() => setActiveTab('API')} icon={<Database size={18} />} label="Conexão API" />
                <NavButton active={activeTab === 'LAYOUT'} onClick={() => setActiveTab('LAYOUT')} icon={<LayoutTemplate size={18} />} label="Layout & Telas" />
                <NavButton active={activeTab === 'MEDIA'} onClick={() => setActiveTab('MEDIA')} icon={<Monitor size={18} />} label="Mídia & Menu" />
                <NavButton active={activeTab === 'ALERTS'} onClick={() => setActiveTab('ALERTS')} icon={<Bell size={18} />} label="Avisos Gerais" />
                <NavButton active={activeTab === 'PARTY'} onClick={() => setActiveTab('PARTY')} icon={<PartyPopper size={18} />} label="Modo Festa" />
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 bg-brewery-bg overflow-y-auto p-8 custom-scrollbar">
                
                {/* --- TAB: LINES --- */}
                {activeTab === 'LINES' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                         <SectionHeader title="Gestão de Equipamentos" desc="Configure tanques, linhas de envase e esteiras." />
                         
                         <div className="bg-brewery-card border border-brewery-border rounded-lg p-4 flex gap-4 items-end">
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
                                        display: { showVolume: false, showPB: false, showHourly: false, showTemp: false, showTrend: false },
                                        x: 20, y: 20, w: 300, h: 200 // Default pos
                                    });
                                    setNewLineForm({id:'', name:''});
                                }
                            }} className="btn-primary h-10 px-6">
                                <Plus size={18} className="mr-2" /> Adicionar
                            </button>
                         </div>

                         <div className="grid grid-cols-1 gap-4">
                            {lineConfigs.map(line => (
                                <div key={line.id} className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden transition-all hover:border-brewery-accent/30">
                                    {editingId === line.id ? (
                                        <div className="p-4 space-y-4 bg-black/20">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded bg-brewery-accent flex items-center justify-center text-black font-bold text-xs">{line.id}</div>
                                                <input className="input-pro flex-1" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-black/20 rounded border border-white/5">
                                                <div className="col-span-full text-xs font-bold text-brewery-accent uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <Eye size={14} /> Dados Visíveis
                                                </div>
                                                <Checkbox label="Volume / Litros" checked={editForm.display?.showVolume} onChange={() => toggleDisplayField('showVolume')} />
                                                <Checkbox label="Eficiência %" checked={editForm.display?.showPB} onChange={() => toggleDisplayField('showPB')} />
                                                <Checkbox label="Vazão/Hora" checked={editForm.display?.showHourly} onChange={() => toggleDisplayField('showHourly')} />
                                                <Checkbox label="Temperatura" checked={editForm.display?.showTemp} onChange={() => toggleDisplayField('showTemp')} />
                                                <Checkbox label="Gráfico" checked={editForm.display?.showTrend} onChange={() => toggleDisplayField('showTrend')} />
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="btn-ghost">Cancelar</button>
                                                <button onClick={() => handleSaveLine(line.id)} className="btn-primary">Salvar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded bg-brewery-border border border-brewery-muted/20 flex items-center justify-center text-brewery-muted font-bold text-sm">{line.id}</div>
                                                <div>
                                                    <h3 className="font-semibold text-brewery-text">{line.name}</h3>
                                                    <div className="flex gap-2 mt-1">
                                                        {line.display.showVolume && <Badge text="Litros" />}
                                                        {line.display.showPB && <Badge text="Efic" />}
                                                        {line.display.showTemp && <Badge text="Temp" />}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleStartEditLine(line)} className="p-2 text-brewery-muted hover:text-brewery-accent hover:bg-black/20 rounded-lg"><Edit2 size={18} /></button>
                                                <button onClick={() => removeLine(line.id)} className="p-2 text-brewery-muted hover:text-rose-500 hover:bg-black/20 rounded-lg"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                         </div>
                    </div>
                )}

                {/* --- TAB: API BRIDGE (REFACTORED) --- */}
                {activeTab === 'API' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <SectionHeader title="Integração (MQTT/Websocket)" desc="Configure a conexão global e o mapeamento dos sensores." />
                        
                        {/* GLOBAL CONFIGURATION CARD */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden">
                            <div className="p-4 bg-black/20 border-b border-brewery-border flex justify-between items-center">
                                <h3 className="font-bold text-brewery-text flex items-center gap-2"><Server size={18} className="text-brewery-accent" /> Servidor / Broker</h3>
                                <div className="flex gap-2">
                                   <button 
                                     onClick={handleTestConnection}
                                     disabled={testStatus === 'TESTING'}
                                     className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all
                                        ${testStatus === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 
                                          testStatus === 'ERROR' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 
                                          'bg-white/5 hover:bg-white/10 text-brewery-muted border border-white/10'}
                                     `}
                                   >
                                       {testStatus === 'TESTING' && <RefreshCw size={12} className="animate-spin" />}
                                       {testStatus === 'SUCCESS' && <CheckCircle size={12} />}
                                       {testStatus === 'ERROR' && <AlertTriangle size={12} />}
                                       
                                       {testStatus === 'IDLE' && 'Testar Conexão'}
                                       {testStatus === 'TESTING' && 'Testando...'}
                                       {testStatus === 'SUCCESS' && 'Conectado!'}
                                       {testStatus === 'ERROR' && 'Falha'}
                                   </button>
                                </div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                                <div className="lg:col-span-2">
                                    <label className="label-pro">Protocolo</label>
                                    <select 
                                        className="input-pro"
                                        value={connectionConfig.protocol}
                                        onChange={(e) => updateConnectionConfig({ protocol: e.target.value as any })}
                                    >
                                        <option value="ws">WS://</option>
                                        <option value="wss">WSS://</option>
                                        <option value="mqtt">MQTT://</option>
                                    </select>
                                </div>
                                <div className="lg:col-span-6">
                                    <label className="label-pro">Host / IP</label>
                                    <input 
                                        className="input-pro font-mono" 
                                        placeholder="localhost" 
                                        value={connectionConfig.host}
                                        onChange={(e) => updateConnectionConfig({ host: e.target.value })}
                                    />
                                </div>
                                <div className="lg:col-span-4">
                                    <label className="label-pro">Porta</label>
                                    <input 
                                        className="input-pro font-mono" 
                                        placeholder="1880" 
                                        value={connectionConfig.port}
                                        onChange={(e) => updateConnectionConfig({ port: e.target.value })}
                                    />
                                </div>
                                
                                <div className="lg:col-span-12">
                                    <label className="label-pro">Caminho / Endpoint (Opcional)</label>
                                    <input 
                                        className="input-pro font-mono" 
                                        placeholder="/ws/brewery-data" 
                                        value={connectionConfig.path}
                                        onChange={(e) => updateConnectionConfig({ path: e.target.value })}
                                    />
                                </div>

                                <div className="lg:col-span-6">
                                    <label className="label-pro">Usuário (Auth)</label>
                                    <input 
                                        className="input-pro" 
                                        placeholder="Opcional" 
                                        value={connectionConfig.username || ''}
                                        onChange={(e) => updateConnectionConfig({ username: e.target.value })}
                                    />
                                </div>
                                <div className="lg:col-span-6">
                                    <label className="label-pro">Senha</label>
                                    <input 
                                        type="password"
                                        className="input-pro" 
                                        placeholder="Opcional" 
                                        value={connectionConfig.password || ''}
                                        onChange={(e) => updateConnectionConfig({ password: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LINES MAPPING */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg overflow-hidden">
                             <div className="p-4 bg-black/20 border-b border-brewery-border">
                                <h3 className="font-bold text-brewery-text flex items-center gap-2"><Activity size={18} className="text-brewery-accent" /> Mapeamento de Tópicos</h3>
                                <p className="text-xs text-brewery-muted mt-1">Defina qual tópico MQTT corresponde a cada equipamento e as chaves JSON.</p>
                            </div>

                            <div className="divide-y divide-brewery-border">
                                {lineConfigs.map(line => (
                                    <div key={line.id} className="p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="w-8 h-8 rounded bg-brewery-border flex items-center justify-center text-brewery-muted text-xs font-bold">{line.id}</div>
                                            <div className="font-bold text-brewery-text">{line.name}</div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-pro text-[10px]">Tópico MQTT</label>
                                                <div className="flex items-center">
                                                    <span className="bg-black border-y border-l border-brewery-border text-brewery-muted px-2 py-2.5 rounded-l text-xs font-mono">/</span>
                                                    <input 
                                                        className="input-pro rounded-l-none font-mono text-xs text-amber-200" 
                                                        value={line.nodeRedTopic}
                                                        onChange={(e) => updateLine(line.id, { nodeRedTopic: e.target.value })}
                                                        placeholder={`brewery/${line.id.toLowerCase()}`}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Advanced JSON Mapping Toggle/Inputs could go here */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                     <label className="label-pro text-[10px]">Chave: Volume</label>
                                                     <input 
                                                        className="input-pro py-1 text-xs font-mono text-brewery-muted"
                                                        value={line.dataMapping?.volumeKey || 'count'}
                                                        onChange={(e) => updateLine(line.id, { 
                                                            dataMapping: { ...line.dataMapping!, volumeKey: e.target.value } 
                                                        })}
                                                     />
                                                </div>
                                                <div>
                                                     <label className="label-pro text-[10px]">Chave: Temp</label>
                                                     <input 
                                                        className="input-pro py-1 text-xs font-mono text-brewery-muted"
                                                        value={line.dataMapping?.tempKey || 'temp'}
                                                        onChange={(e) => updateLine(line.id, { 
                                                            dataMapping: { ...line.dataMapping!, tempKey: e.target.value } 
                                                        })}
                                                     />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {lineConfigs.length === 0 && (
                                    <div className="p-8 text-center text-brewery-muted">
                                        Nenhuma linha configurada. Vá para a aba "Linhas & Tanques" para adicionar equipamentos.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: LAYOUT --- */}
                {activeTab === 'LAYOUT' && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        <SectionHeader title="Layout & Interface" desc="Personalize a disposição dos painéis e o comportamento da mídia." />

                        {/* Media Configuration */}
                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-brewery-text flex items-center gap-2"><Monitor size={18}/> Painel de Menu/Mídia</h3>
                                <Toggle checked={layout.showMediaPanel} onChange={() => updateLayout({ showMediaPanel: !layout.showMediaPanel })} />
                            </div>

                            {layout.showMediaPanel && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label-pro">Direção de Divisão</label>
                                        <div className="flex bg-black/40 rounded-lg p-1 border border-brewery-border">
                                            <button onClick={() => updateLayout({ splitDirection: 'HORIZONTAL' })} className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 transition ${layout.splitDirection === 'HORIZONTAL' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}>
                                                <ArrowLeftRight size={14} /> Lado a Lado
                                            </button>
                                            <button onClick={() => updateLayout({ splitDirection: 'VERTICAL' })} className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 transition ${layout.splitDirection === 'VERTICAL' ? 'bg-brewery-accent text-black shadow' : 'text-brewery-muted hover:text-white'}`}>
                                                <ArrowUpDown size={14} /> Topo / Baixo
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* ... keeps other layout settings but styled ... */}
                                     <div className="col-span-full">
                                        <div className="flex justify-between text-xs font-bold text-brewery-muted mb-2">
                                            <span>Tamanho do Painel Mídia</span>
                                            <span>{layout.mediaPanelSize}%</span>
                                        </div>
                                        <input 
                                            type="range" min="20" max="80" 
                                            value={layout.mediaPanelSize} 
                                            onChange={(e) => updateLayout({ mediaPanelSize: parseInt(e.target.value) })} 
                                            className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-brewery-accent" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB: PARTY MODE (NEW) --- */}
                {activeTab === 'PARTY' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <SectionHeader title="Modo Festa & Eventos" desc="Configure a atmosfera para Happy Hours e eventos especiais." />
                        
                        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        <PartyPopper className="text-purple-400" /> 
                                        Ativar Modo Festa
                                    </h3>
                                    <p className="text-sm text-brewery-muted mt-1">Habilita efeitos visuais e temas comemorativos na tela.</p>
                                </div>
                                <Toggle checked={layout.isPartyMode} onChange={() => updateLayout({ isPartyMode: !layout.isPartyMode })} color="purple" />
                            </div>
                            
                            {layout.isPartyMode && (
                                <div className="mt-6 pt-6 border-t border-purple-500/20 space-y-6 animate-in fade-in slide-in-from-top-2">
                                    
                                    {/* Effect Selection */}
                                    <div>
                                        <label className="label-pro mb-3">Efeito Visual</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <EffectCard 
                                                active={layout.partyEffect === 'BUBBLES'} 
                                                onClick={() => updateLayout({ partyEffect: 'BUBBLES' })}
                                                icon={<Wind size={20} />}
                                                label="Bolhas (Cerveja)"
                                            />
                                            <EffectCard 
                                                active={layout.partyEffect === 'CONFETTI'} 
                                                onClick={() => updateLayout({ partyEffect: 'CONFETTI' })}
                                                icon={<PartyPopper size={20} />}
                                                label="Confetes"
                                            />
                                            <EffectCard 
                                                active={layout.partyEffect === 'DISCO'} 
                                                onClick={() => updateLayout({ partyEffect: 'DISCO' })}
                                                icon={<Disc size={20} />}
                                                label="Luzes Disco"
                                            />
                                            <EffectCard 
                                                active={layout.partyEffect === 'GLOW'} 
                                                onClick={() => updateLayout({ partyEffect: 'GLOW' })}
                                                icon={<Sparkles size={20} />}
                                                label="Glow Suave"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label-pro">Mensagem do Banner</label>
                                        <input 
                                            className="input-pro border-purple-500/30 focus:border-purple-500" 
                                            value={layout.partyMessage || ''} 
                                            onChange={(e) => updateLayout({ partyMessage: e.target.value })}
                                            placeholder="Ex: HAPPY HOUR DA CERVEJARIA!"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6 opacity-60 pointer-events-none relative">
                            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">Em breve</div>
                            <h3 className="font-bold text-brewery-text mb-4 flex items-center gap-2"><Calendar size={18}/> Agendamento Automático</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded">
                                    <span className="text-sm text-brewery-muted">Oktoberfest (Todo Outubro)</span>
                                    <Toggle checked={false} onChange={() => {}} />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded">
                                    <span className="text-sm text-brewery-muted">St. Patrick's Day (17 Março)</span>
                                    <Toggle checked={false} onChange={() => {}} />
                                </div>
                                <div className="flex justify-between items-center p-3 bg-black/20 rounded">
                                    <span className="text-sm text-brewery-muted">Sexta-feira Happy Hour (17h-22h)</span>
                                    <Toggle checked={true} onChange={() => {}} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: ALERTS --- */}
                {activeTab === 'ALERTS' && (
                    <div className="space-y-8 max-w-3xl mx-auto">
                        <SectionHeader title="Mural de Avisos" desc="Comunicados para o chão de fábrica." />
                        
                        <div className="bg-brewery-card border border-brewery-border rounded-lg p-6">
                            <h3 className="font-bold text-brewery-text mb-4">Novo Aviso</h3>
                             <form onSubmit={(e) => {
                                 e.preventDefault();
                                 if(!newMsg) return;
                                 addAnnouncement({ id: Date.now().toString(), message: newMsg, type: newType, isActive: true });
                                 setNewMsg('');
                             }} className="flex gap-2 mb-6">
                                 <input className="input-pro flex-1" placeholder="Ex: Barril de IPA trocado..." value={newMsg} onChange={e => setNewMsg(e.target.value)} />
                                 <select className="bg-black border border-brewery-border text-white text-sm rounded px-3" value={newType} onChange={e => setNewType(e.target.value as any)}>
                                     <option value="INFO">Info</option>
                                     <option value="WARNING">Alerta</option>
                                     <option value="CRITICAL">Urgente</option>
                                 </select>
                                 <button type="submit" className="btn-primary px-4"><Plus size={18} /></button>
                             </form>

                             <div className="space-y-2">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="flex items-center justify-between p-3 bg-black/20 border border-brewery-border rounded hover:border-brewery-muted">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${ann.type === 'CRITICAL' ? 'bg-rose-950 text-rose-400' : ann.type === 'WARNING' ? 'bg-amber-950 text-amber-400' : 'bg-blue-950 text-blue-400'}`}>{ann.type}</span>
                                            <span className="text-brewery-text text-sm">{ann.message}</span>
                                        </div>
                                        <button onClick={() => removeAnnouncement(ann.id)} className="text-brewery-muted hover:text-rose-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}
                
                 {/* --- TAB: MEDIA (REFACTORED FOR PLAYLIST MANAGEMENT) --- */}
                 {activeTab === 'MEDIA' && (
                     <div className="space-y-6 max-w-3xl mx-auto">
                         <SectionHeader title="Playlist / Menu Digital" desc="Gerencie as imagens que aparecem na tela (Cardápios, Fotos, Vídeos, GIFs)." />
                         
                         {/* Display Settings */}
                         <div className="bg-brewery-card border border-brewery-border rounded-lg p-4 mb-6">
                             <div className="flex items-center justify-between">
                                 <div>
                                     <h3 className="font-bold text-brewery-text text-sm mb-1">Ajuste de Tela</h3>
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

                         {/* Playlist Manager */}
                         <div className="bg-black/20 rounded-lg border border-brewery-border overflow-hidden">
                             <div className="p-3 border-b border-brewery-border bg-black/40 flex justify-between items-center">
                                 <span className="text-xs font-bold uppercase text-brewery-muted">Ordem de Reprodução</span>
                                 <span className="text-xs text-brewery-muted">{mediaPlaylist.length} itens</span>
                             </div>
                             
                             <div className="divide-y divide-brewery-border">
                                {mediaPlaylist.map((item, index) => (
                                    <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-white/5 transition-colors group">
                                        <div className="w-6 text-center text-xs font-mono text-brewery-muted">{index + 1}</div>
                                        
                                        {/* Thumbnail */}
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
                                                onClick={() => index > 0 && reorderMedia(index, index - 1)}
                                                disabled={index === 0}
                                                className="p-1.5 hover:bg-black/40 rounded text-brewery-muted hover:text-white disabled:opacity-30"
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button 
                                                onClick={() => index < mediaPlaylist.length - 1 && reorderMedia(index, index + 1)}
                                                disabled={index === mediaPlaylist.length - 1}
                                                className="p-1.5 hover:bg-black/40 rounded text-brewery-muted hover:text-white disabled:opacity-30"
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                            <div className="w-px h-4 bg-brewery-border mx-1" />
                                            <button 
                                                onClick={() => removeMedia(item.id)}
                                                className="p-1.5 hover:bg-rose-950/50 rounded text-brewery-muted hover:text-rose-500"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {mediaPlaylist.length === 0 && (
                                    <div className="p-8 text-center text-brewery-muted border-dashed">
                                        <Monitor size={24} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Playlist vazia.</p>
                                        <p className="text-xs">Arraste arquivos para a tela principal para adicionar.</p>
                                    </div>
                                )}
                             </div>
                         </div>

                         <div className="text-xs text-center text-brewery-muted mt-2">
                             Dica: Arraste arquivos (JPG, PNG, GIF, MP4) para o painel principal para adicionar à playlist.
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
const EffectCard = ({ active, onClick, icon, label }: any) => (
    <div 
        onClick={onClick}
        className={`cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center gap-2 transition-all ${active ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40 scale-105' : 'bg-black/40 border-purple-500/20 text-purple-300 hover:bg-purple-900/20'}`}
    >
        {icon}
        <span className="text-xs font-bold">{label}</span>
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

const Badge = ({ text }: any) => (
    <span className="text-[10px] font-bold bg-black text-brewery-muted px-1.5 py-0.5 rounded border border-brewery-border">{text}</span>
);

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

const Checkbox = ({ label, checked, onChange }: any) => (
    <div onClick={onChange} className={`flex items-center gap-2 cursor-pointer select-none transition-opacity ${checked ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-brewery-accent border-amber-500' : 'border-brewery-muted bg-black'}`}>
            {checked && <div className="w-2 h-2 bg-black rounded-sm" />}
        </div>
        <span className="text-xs text-brewery-text font-medium">{label}</span>
    </div>
);

export default SettingsPanel;