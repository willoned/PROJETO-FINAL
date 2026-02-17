import React, { useState, useEffect } from 'react';
import { useMachineContext } from '../context/MachineContext';
import { useAuth } from '../context/AuthContext';
import { 
  X, Trash2, LayoutTemplate, Factory, Database, Monitor, Bell, 
  Settings as SettingsIcon, PartyPopper, Type, Plus, Image, Video, Globe, 
  AlertTriangle, AlertOctagon, Info, User as UserIcon, Lock, Users, LogOut, CheckSquare, Square,
  Maximize, Move, Type as TypeIcon, Hash, Beer, AlignLeft, AlignCenter, Minus, Upload, Eye, EyeOff,
  Calendar, Clock as ClockIcon
} from 'lucide-react';
import { MediaType, AnnouncementType, MediaItem, PermissionTab, UserRole, PartyEffect } from '../types';

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-sm font-bold ${
      active
        ? 'bg-brewery-accent text-black shadow-lg shadow-amber-900/20'
        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SectionHeader: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="mb-8 border-b border-brewery-border pb-4">
    <h2 className="text-3xl font-black text-white tracking-tight uppercase">{title}</h2>
    <p className="text-zinc-400 mt-2 text-sm">{desc}</p>
  </div>
);

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-brewery-border hover:border-white/10 transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
    <span className="font-bold text-zinc-300 text-sm">{label}</span>
    <button 
      type="button"
      className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

const NumberInput: React.FC<{ label: string; value: number; onChange: (val: number) => void; min?: number; max?: number }> = ({ label, value, onChange, min, max }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] uppercase font-bold text-zinc-500">{label}</label>
    <div className="flex items-center bg-zinc-900 border border-brewery-border rounded-lg px-2">
      <input 
        type="number" 
        className="w-full bg-transparent py-2 text-white font-mono text-sm focus:outline-none"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
      />
    </div>
  </div>
);

const SettingsPanel: React.FC = () => {
  const { 
    showSettings, toggleSettings, lineConfigs, addLine, updateLine, removeLine, 
    layout, updateLayout, connectionConfig, updateConnectionConfig,
    playlists, addMedia, removeMedia, updateMedia, updateWindow, addWindow, removeWindow,
    announcements, addAnnouncement, removeAnnouncement,
    isEditing, setEditing
  } = useMachineContext();
  
  const { user, login, logout, isAuthenticated, createUser, deleteUser, usersList } = useAuth();
  
  const [activeTab, setActiveTab] = useState<PermissionTab | 'USERS'>('LAYOUT');

  // Login Form State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // User Management Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('CREATOR');
  const [newUserPerms, setNewUserPerms] = useState<PermissionTab[]>([]);

  // Local state for other forms
  const [newLineName, setNewLineName] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<MediaType>('IMAGE');
  
  // Alert State
  const [newAlertMsg, setNewAlertMsg] = useState('');
  const [newAlertType, setNewAlertType] = useState<AnnouncementType>('INFO');
  const [newAlertStart, setNewAlertStart] = useState('');
  const [newAlertEnd, setNewAlertEnd] = useState('');

  const [newWindowName, setNewWindowName] = useState('');

  const PERMISSION_LABELS: Record<PermissionTab, string> = {
    LINES: 'Linhas de Produção',
    MEDIA: 'Mídia & Menu',
    ALERTS: 'Avisos Gerais',
    LAYOUT: 'Layout & Telas',
    HEADER: 'Cabeçalho',
    PARTY: 'Modo Festa',
    API: 'Conexão Node-RED'
  };

  const PARTY_EFFECT_LABELS: Record<PartyEffect, string> = {
    GLOW: 'BRILHO NEON',
    CONFETTI: 'CHUVA DE CONFETE',
    BUBBLES: 'BOLHAS DE CERVEJA',
    DISCO: 'LUZES DE DISCOTECA',
    WORLDCUP: 'CLIMA DE COPA',
    OLYMPICS: 'ESPÍRITO OLÍMPICO',
    BIRTHDAY: 'ANIVERSÁRIO',
    BONUS: 'CHUVA DE DINHEIRO',
    GOAL: 'GOL DE PLACA',
    CUSTOM: 'PERSONALIZADO (IMG/GIF)'
  };

  const getTabs = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') return ['LINES', 'MEDIA', 'ALERTS', 'LAYOUT', 'HEADER', 'PARTY', 'API', 'USERS'];
    return user.permissions;
  };

  const availableTabs = getTabs();

  useEffect(() => {
    if (isAuthenticated && availableTabs.length > 0 && !availableTabs.includes(activeTab as any)) {
      setActiveTab(availableTabs[0] as any);
    }
  }, [isAuthenticated, user]);

  if (!showSettings) return null;

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
      const handleLogin = async (e: React.FormEvent) => {
          e.preventDefault();
          setLoginError('');
          const success = await login(loginUser, loginPass);
          if (!success) setLoginError('Usuário ou senha inválidos.');
          else { setLoginUser(''); setLoginPass(''); }
      };

      return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex justify-center items-center p-4">
            <div className="bg-brewery-card border border-brewery-border w-full max-w-md p-8 rounded-2xl shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
                        <p className="text-brewery-muted text-sm">Faça login para configurar o sistema.</p>
                    </div>
                    <button onClick={toggleSettings} className="text-zinc-500 hover:text-white"><X /></button>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Usuário</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                            <input className="w-full bg-black/40 border border-brewery-border rounded pl-10 pr-4 py-2 text-white focus:border-brewery-accent outline-none" value={loginUser} onChange={e => setLoginUser(e.target.value)} autoFocus />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                            <input type="password" className="w-full bg-black/40 border border-brewery-border rounded pl-10 pr-4 py-2 text-white focus:border-brewery-accent outline-none" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
                        </div>
                    </div>
                    {loginError && <p className="text-rose-500 text-sm font-bold text-center">{loginError}</p>}
                    <button type="submit" className="w-full bg-brewery-accent text-black font-bold py-3 rounded hover:bg-amber-400 transition-colors">ENTRAR NO SISTEMA</button>
                </form>
            </div>
        </div>
      );
  }

  // --- ACTIONS ---
  const handleAddLine = () => {
    if (!newLineName) return;
    const id = `LINE-${Math.floor(Math.random() * 1000)}`;
    addLine({
        id, name: newLineName, targetPerHour: 1000, nodeRedTopic: `brewery/${id.toLowerCase()}`, x: 100, y: 100, w: 300, h: 220, productionUnit: 'UN', timeBasis: 'HOUR',
        dataMapping: { productionKey: 'count', speedKey: 'speed', temperatureKey: 'temp', rejectKey: 'rejects', statusKey: 'status', efficiencyKey: 'oee' },
        display: { showVolume: true, showPB: true, showHourly: true, showTemp: false, showTrend: false, showBarChart: false }
    });
    setNewLineName('');
  };

  const handleAddMedia = (playlistKey: string) => {
      if (!newMediaUrl) return;
      addMedia(playlistKey, { id: Date.now().toString(), name: 'Nova Mídia', type: newMediaType, url: newMediaUrl, duration: 15 });
      setNewMediaUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, playlistKey: string) => {
      if (e.target.files && e.target.files.length > 0) {
          Array.from(e.target.files).forEach((file: File) => {
              const url = URL.createObjectURL(file);
              const type = file.type.startsWith('video/') ? 'VIDEO' : (file.type === 'text/html' || file.name.endsWith('.html') ? 'HTML' : 'IMAGE');
              const duration = type === 'VIDEO' ? 30 : 15;
              
              addMedia(playlistKey, { 
                  id: Date.now().toString() + Math.random().toString().slice(2), 
                  name: file.name, 
                  type: type as MediaType, 
                  url, 
                  duration 
              });
          });
          // Reset input
          e.target.value = '';
      }
  };

  const handleCustomPartyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          updateLayout({ customPartyImage: url });
      }
  };

  const handleAddAlert = () => {
      if (!newAlertMsg) return;
      
      addAnnouncement({ 
          id: Date.now().toString(), 
          message: newAlertMsg, 
          type: newAlertType, 
          isActive: true, 
          displayMode: newAlertType === 'CRITICAL' ? 'OVERLAY' : 'TICKER',
          schedule: (newAlertStart || newAlertEnd) ? {
              start: newAlertStart || undefined,
              end: newAlertEnd || undefined
          } : undefined
      });
      
      setNewAlertMsg('');
      setNewAlertStart('');
      setNewAlertEnd('');
  };

  const handleCreateUser = () => {
      if (user?.role !== 'ADMIN') { alert('Apenas administradores podem criar novos usuários.'); return; }
      if (!newUserName || !newUserPass) return;
      
      // If Admin, they get all permissions automatically
      const permissions = newUserRole === 'ADMIN' 
        ? ['LINES', 'API', 'LAYOUT', 'MEDIA', 'ALERTS', 'PARTY', 'HEADER'] as PermissionTab[]
        : newUserPerms;

      createUser({ 
        username: newUserName, 
        password: newUserPass, 
        role: newUserRole, 
        permissions: permissions 
      });

      setNewUserName(''); 
      setNewUserPass(''); 
      setNewUserPerms([]);
      setNewUserRole('CREATOR');
  };

  const togglePermission = (tab: PermissionTab) => {
      if (newUserPerms.includes(tab)) setNewUserPerms(prev => prev.filter(p => p !== tab));
      else setNewUserPerms(prev => [...prev, tab]);
  };

  // --- MAIN SETTINGS UI ---

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex justify-center items-center p-6">
      <div className="bg-[#0f0a0a] border border-white/10 w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-[#1a110d]/80 border-b border-white/5 p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="bg-brewery-accent p-3 rounded-xl shadow-lg shadow-amber-900/20"><SettingsIcon className="text-black w-6 h-6" /></div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">CONFIGURAÇÕES</h2>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5 uppercase tracking-wider">Logado como: <span className="text-emerald-400">{user?.username}</span> <span className="text-zinc-600">({user?.role})</span></p>
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const newState = !isEditing;
                    setEditing(newState);
                    if (newState) toggleSettings();
                  }} 
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all border ${isEditing ? 'bg-amber-600 border-amber-500 text-white animate-pulse' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                >
                    {isEditing ? 'MODO EDIÇÃO ATIVO' : 'ATIVAR EDIÇÃO VISUAL'}
                </button>
                <button onClick={toggleSettings} className="p-2.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-zinc-400 rounded-xl transition-colors"><X size={24} /></button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation - Conditional Rendering */}
            <div className="w-72 bg-black/20 border-r border-white/5 flex flex-col p-6 gap-2 overflow-y-auto">
                <div className="space-y-2 flex-1">
                    <p className="text-xs font-bold text-zinc-600 uppercase mb-4 px-2">Menu Principal</p>
                    {availableTabs.includes('LINES') && <NavButton active={activeTab === 'LINES'} onClick={() => setActiveTab('LINES')} icon={<Factory size={18} />} label="Linhas de Produção" />}
                    {availableTabs.includes('LAYOUT') && <NavButton active={activeTab === 'LAYOUT'} onClick={() => setActiveTab('LAYOUT')} icon={<LayoutTemplate size={18} />} label="Layout & Telas" />}
                    {availableTabs.includes('MEDIA') && <NavButton active={activeTab === 'MEDIA'} onClick={() => setActiveTab('MEDIA')} icon={<Monitor size={18} />} label="Mídia & Menu" />}
                    {availableTabs.includes('ALERTS') && <NavButton active={activeTab === 'ALERTS'} onClick={() => setActiveTab('ALERTS')} icon={<Bell size={18} />} label="Avisos Gerais" />}
                    {availableTabs.includes('PARTY') && <NavButton active={activeTab === 'PARTY'} onClick={() => setActiveTab('PARTY')} icon={<PartyPopper size={18} />} label="Modo Festa" />}
                    
                    <p className="text-xs font-bold text-zinc-600 uppercase mb-4 mt-8 px-2">Sistema</p>
                    {availableTabs.includes('HEADER') && <NavButton active={activeTab === 'HEADER'} onClick={() => setActiveTab('HEADER')} icon={<Type size={18} />} label="Cabeçalho" />}
                    {availableTabs.includes('API') && <NavButton active={activeTab === 'API'} onClick={() => setActiveTab('API')} icon={<Database size={18} />} label="Conexão Node-RED" />}
                    {availableTabs.includes('USERS') && <NavButton active={activeTab === 'USERS'} onClick={() => setActiveTab('USERS')} icon={<Users size={18} />} label="Usuários e Permissões" />}
                </div>

                <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-sm font-bold text-rose-500 hover:bg-rose-950/20 border border-transparent hover:border-rose-900 mt-4">
                    <LogOut size={18} />
                    <span>Sair do Sistema</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#120c0c] overflow-y-auto p-10 custom-scrollbar">
                
                {/* --- USERS TAB (New Implementation) --- */}
                {activeTab === 'USERS' && (
                  <div className="space-y-8 max-w-5xl mx-auto">
                      <SectionHeader title="Usuários & Permissões" desc="Gerencie quem tem acesso ao painel e quais áreas podem modificar." />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Create User Column */}
                          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 lg:col-span-1 h-fit">
                              <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Plus size={20} className="text-emerald-500"/> Criar Novo Usuário</h3>
                              
                              <div className="space-y-4">
                                  <div>
                                      <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">Nome de Usuário</label>
                                      <input 
                                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-brewery-accent outline-none"
                                          value={newUserName}
                                          onChange={e => setNewUserName(e.target.value)}
                                          placeholder="Ex: operador01"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">Senha</label>
                                      <input 
                                          type="password"
                                          className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white focus:border-brewery-accent outline-none"
                                          value={newUserPass}
                                          onChange={e => setNewUserPass(e.target.value)}
                                          placeholder="******"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs uppercase font-bold text-zinc-500 mb-2 block">Tipo de Conta</label>
                                      <div className="grid grid-cols-2 gap-2">
                                          <button 
                                            type="button"
                                            onClick={() => setNewUserRole('CREATOR')}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${newUserRole === 'CREATOR' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-black/20 border-white/10 text-zinc-500 hover:text-white'}`}
                                          >
                                            CRIADOR
                                          </button>
                                          <button 
                                            type="button"
                                            onClick={() => setNewUserRole('ADMIN')}
                                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${newUserRole === 'ADMIN' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-black/20 border-white/10 text-zinc-500 hover:text-white'}`}
                                          >
                                            ADMINISTRADOR
                                          </button>
                                      </div>
                                      <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                                          {newUserRole === 'ADMIN' ? 'Administradores têm acesso total a todas as configurações e podem criar novos usuários.' : 'Criadores têm acesso restrito apenas às abas selecionadas abaixo.'}
                                      </p>
                                  </div>

                                  {/* Permission Selector (Only for Creators) */}
                                  {newUserRole === 'CREATOR' && (
                                    <div className="pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs uppercase font-bold text-zinc-500 mb-2 block">Permissões de Acesso</label>
                                        <div className="space-y-2">
                                            {(Object.keys(PERMISSION_LABELS) as PermissionTab[]).map(key => (
                                                <div 
                                                    key={key} 
                                                    onClick={() => togglePermission(key)}
                                                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${newUserPerms.includes(key) ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                >
                                                    {newUserPerms.includes(key) ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} className="text-zinc-600" />}
                                                    <span className={`text-sm font-medium ${newUserPerms.includes(key) ? 'text-white' : 'text-zinc-500'}`}>{PERMISSION_LABELS[key]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                  )}

                                  <button onClick={handleCreateUser} className="w-full bg-brewery-accent hover:bg-amber-400 text-black font-bold py-3 rounded-lg mt-4 transition-colors">
                                      CADASTRAR USUÁRIO
                                  </button>
                              </div>
                          </div>

                          {/* Users List Column */}
                          <div className="lg:col-span-2">
                              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 min-h-[400px]">
                                  <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Users size={20} className="text-brewery-accent"/> Usuários do Sistema</h3>
                                  
                                  <div className="space-y-3">
                                      {usersList.map((u, idx) => (
                                          <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                              <div className="flex items-center gap-4">
                                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                      {u.username.charAt(0).toUpperCase()}
                                                  </div>
                                                  <div>
                                                      <p className="font-bold text-white">{u.username}</p>
                                                      <div className="flex items-center gap-2 text-xs">
                                                          <span className={`font-bold px-1.5 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-400'}`}>{u.role}</span>
                                                          {u.role === 'CREATOR' && (
                                                              <span className="text-zinc-500">Acesso: {u.permissions.length} abas</span>
                                                          )}
                                                      </div>
                                                  </div>
                                              </div>
                                              
                                              {/* Prevent deleting yourself or the main Admin if intended (logic simplified here) */}
                                              {u.username !== user?.username && (
                                                  <button onClick={() => deleteUser(u.username)} className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Excluir Usuário">
                                                      <Trash2 size={18} />
                                                  </button>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                )}
                
                {/* --- LAYOUT TAB (Refactored) --- */}
                {activeTab === 'LAYOUT' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <SectionHeader title="Layout & Telas" desc="Controle global dos elementos, posicionamento e redimensionamento independente." />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <Toggle label="Painel de Mídia (Lateral)" checked={layout.showMediaPanel} onChange={v => updateLayout({ showMediaPanel: v })} />
                            <Toggle label="Exibir Logotipo" checked={layout.logoWidget.show} onChange={v => updateLayout({ logoWidget: { ...layout.logoWidget, show: v } })} />
                            <Toggle label="Ajuste de Mídia (Cover)" checked={layout.mediaFit === 'COVER'} onChange={v => updateLayout({ mediaFit: v ? 'COVER' : 'CONTAIN' })} />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Logo Settings */}
                            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Beer size={20} className="text-brewery-accent"/> Logotipo Personalizado</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <NumberInput label="Posição X" value={layout.logoWidget.x} onChange={v => updateLayout({ logoWidget: { ...layout.logoWidget, x: v } })} />
                                        <NumberInput label="Posição Y" value={layout.logoWidget.y} onChange={v => updateLayout({ logoWidget: { ...layout.logoWidget, y: v } })} />
                                        <NumberInput label="Largura (W)" value={layout.logoWidget.w} onChange={v => updateLayout({ logoWidget: { ...layout.logoWidget, w: v } })} />
                                        <NumberInput label="Altura (H)" value={layout.logoWidget.h} onChange={v => updateLayout({ logoWidget: { ...layout.logoWidget, h: v } })} />
                                    </div>
                                    <div className="pt-2">
                                        <label className="text-xs uppercase font-bold text-zinc-500 mb-1 block">URL da Imagem</label>
                                        <input className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2 text-white text-xs" placeholder="https://..." value={layout.logoWidget.url || ''} onChange={e => updateLayout({ logoWidget: { ...layout.logoWidget, url: e.target.value } })} />
                                    </div>
                                </div>
                            </div>

                            {/* Floating Windows Settings */}
                            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Maximize size={20} className="text-brewery-accent"/> Janela de Mídia Flutuante</h3>
                                {layout.floatingWindows.map(win => (
                                    <div key={win.id} className="space-y-4">
                                        <p className="text-xs text-zinc-400 mb-2">Janela: <span className="text-white font-bold">{win.name}</span></p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <NumberInput label="Posição X" value={win.x} onChange={v => updateWindow(win.id, { x: v })} />
                                            <NumberInput label="Posição Y" value={win.y} onChange={v => updateWindow(win.id, { y: v })} />
                                            <NumberInput label="Largura (W)" value={win.w} onChange={v => updateWindow(win.id, { w: v })} />
                                            <NumberInput label="Altura (H)" value={win.h} onChange={v => updateWindow(win.id, { h: v })} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MEDIA TAB (Refactored) --- */}
                {activeTab === 'MEDIA' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <SectionHeader title="Mídia & Menu" desc="Gerencie as playlists das janelas flutuantes e banners." />
                        
                        {/* New: Panel Visibility Control */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 mb-8">
                             <h3 className="font-bold text-white mb-4 flex items-center gap-2"><LayoutTemplate size={20} className="text-brewery-accent"/> Controle de Exibição</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Toggle label="Ativar Janelas Flutuantes" checked={layout.showMediaPanel} onChange={v => updateLayout({ showMediaPanel: v })} />
                                <Toggle label="Ativar Banner Superior" checked={layout.header.showTopMedia} onChange={v => updateLayout({ header: { ...layout.header, showTopMedia: v } })} />
                             </div>
                        </div>
                        
                        <div className="space-y-6">
                          {/* Combine Floating Windows and Banner into one list for iteration */}
                          {[
                            ...layout.floatingWindows.map(w => ({ id: w.id, name: w.name, isBanner: false, visible: w.visible })),
                            ...(layout.header.showTopMedia ? [{ id: 'banner', name: 'Banner do Cabeçalho', isBanner: true, visible: true }] : [])
                          ].map((win) => {
                            const key = win.id;
                            const items = playlists[key] || [];

                            return (
                              <div key={key} className="bg-zinc-900/30 border border-white/10 rounded-2xl overflow-hidden mb-6">
                                
                                {/* CABEÇALHO DO CARD DA JANELA */}
                                <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/5">
                                  <div className="flex items-center gap-3">
                                     <h3 className="font-bold text-lg text-white uppercase flex items-center gap-2">
                                        <Monitor size={18} className="text-brewery-accent"/> 
                                        {win.name}
                                        {/* Tag Visual para identificar o Banner */}
                                        {win.isBanner && (
                                          <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/30">
                                            BANNER
                                          </span>
                                        )}
                                        {!win.isBanner && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${win.visible ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                                {win.visible ? 'VISÍVEL' : 'OCULTO'}
                                            </span>
                                        )}
                                     </h3>
                                  </div>
                                  {!win.isBanner && (
                                      <div className="flex items-center gap-3">
                                          <button
                                            onClick={() => updateWindow(win.id, { visible: !win.visible })}
                                            className={`p-2 rounded-lg transition-colors border ${win.visible ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'}`}
                                            title={win.visible ? 'Ocultar Janela' : 'Mostrar Janela'}
                                          >
                                              {win.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                          </button>
                                      </div>
                                  )}
                                </div>
                                
                                <div className="p-6">
                                    {/* Add Media Bar */}
                                    <div className="flex gap-3 mb-6 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <select 
                                            value={newMediaType} 
                                            onChange={e => setNewMediaType(e.target.value as MediaType)}
                                            className="bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white text-sm font-bold focus:outline-none"
                                        >
                                            <option value="IMAGE">Imagem</option>
                                            <option value="VIDEO">Vídeo</option>
                                            <option value="HTML">HTML/Web</option>
                                        </select>
                                        <input 
                                            className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none"
                                            placeholder="Cole a URL da mídia aqui..."
                                            value={newMediaUrl}
                                            onChange={e => setNewMediaUrl(e.target.value)}
                                        />
                                        
                                        {/* New File Upload Button */}
                                        <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-lg flex items-center justify-center cursor-pointer border border-white/10 transition-colors hover:border-white/20" title="Carregar do Dispositivo">
                                            <Upload size={18} />
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                multiple 
                                                accept="image/*,video/*,text/html,.html,.htm" 
                                                onChange={(e) => handleFileUpload(e, key)} 
                                            />
                                        </label>

                                        <button onClick={() => handleAddMedia(key)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-lg text-sm font-bold transition-colors">Adicionar</button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                                <div className="w-16 h-12 bg-black rounded-lg flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                                                    {item.type === 'IMAGE' ? <img src={item.url} className="w-full h-full object-cover opacity-80" /> :
                                                     item.type === 'VIDEO' ? <video src={item.url} className="w-full h-full object-cover opacity-60" /> :
                                                     <Globe size={20} className="text-zinc-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <input 
                                                        className="w-full bg-transparent text-sm text-white font-bold focus:outline-none mb-1" 
                                                        value={item.name} 
                                                        onChange={e => updateMedia(key, item.id, { name: e.target.value })}
                                                    />
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">{item.url.startsWith('blob:') ? 'Arquivo Local' : item.url}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-zinc-400 uppercase font-bold">Duração:</span>
                                                            <input 
                                                                type="number" 
                                                                className="w-12 bg-zinc-800/50 rounded px-1 py-0.5 text-center text-white text-xs"
                                                                value={item.duration}
                                                                onChange={e => updateMedia(key, item.id, { duration: Number(e.target.value) })}
                                                            />
                                                            <span className="text-[10px] text-zinc-500">seg</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeMedia(key, item.id)} className="text-zinc-600 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
                                            </div>
                                        ))}
                                        {items.length === 0 && <p className="text-center text-zinc-600 py-8 italic text-sm">Nenhuma mídia configurada.</p>}
                                    </div>
                                </div>
                            </div>
                           );
                        })}
                        </div>
                    </div>
                )}

                {/* --- ALERTS TAB (Refactored) --- */}
                {activeTab === 'ALERTS' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <SectionHeader title="Avisos Gerais" desc="Gerencie o ticker de notícias, popups e a aparência da barra de avisos." />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Create Alert Column */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Plus size={20} className="text-emerald-500"/> Novo Comunicado</h3>
                                    <div className="flex flex-col gap-4">
                                        <textarea 
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white h-32 resize-none placeholder-zinc-600 focus:outline-none focus:border-brewery-accent transition-colors text-lg"
                                            placeholder="Digite a mensagem do aviso..."
                                            value={newAlertMsg}
                                            onChange={e => setNewAlertMsg(e.target.value)}
                                        />
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1"><Calendar size={10} /> Início (Opcional)</label>
                                                <input 
                                                    type="datetime-local" 
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brewery-accent outline-none appearance-none"
                                                    value={newAlertStart}
                                                    onChange={e => setNewAlertStart(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 flex items-center gap-1"><ClockIcon size={10} /> Fim (Opcional)</label>
                                                <input 
                                                    type="datetime-local" 
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-brewery-accent outline-none appearance-none"
                                                    value={newAlertEnd}
                                                    onChange={e => setNewAlertEnd(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
                                            <div className="flex gap-2 flex-wrap">
                                                {(['INFO', 'WARNING', 'CRITICAL', 'ATTENTION'] as AnnouncementType[]).map(type => (
                                                    <button 
                                                        key={type}
                                                        onClick={() => setNewAlertType(type)}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${newAlertType === type ? 'bg-white text-black border-white shadow-lg' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 bg-transparent'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={handleAddAlert} className="w-full md:w-auto bg-brewery-accent text-black font-bold px-8 py-2.5 rounded-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-900/20">PUBLICAR</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {announcements.map(alert => (
                                        <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-xl border relative overflow-hidden group ${alert.type === 'CRITICAL' ? 'bg-rose-950/20 border-rose-900/50' : 'bg-zinc-900/40 border-white/5'}`}>
                                            <div className="shrink-0 relative z-10">
                                                {alert.type === 'CRITICAL' && <AlertOctagon className="text-rose-500" size={24} />}
                                                {alert.type === 'WARNING' && <AlertTriangle className="text-amber-500" size={24} />}
                                                {alert.type === 'INFO' && <Info className="text-blue-400" size={24} />}
                                                {alert.type === 'ATTENTION' && <AlertTriangle className="text-orange-500" size={24} />}
                                            </div>
                                            <div className="flex-1 relative z-10">
                                                <p className="text-white font-bold text-lg">{alert.message}</p>
                                                <div className="flex gap-2 text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">
                                                    <span>{alert.type}</span> • <span>{alert.displayMode}</span>
                                                    {alert.schedule?.start && <span> • Início: {new Date(alert.schedule.start).toLocaleString()}</span>}
                                                    {alert.schedule?.end && <span> • Fim: {new Date(alert.schedule.end).toLocaleString()}</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => removeAnnouncement(alert.id)} className="relative z-10 text-zinc-600 hover:text-rose-500 p-2"><X size={20}/></button>
                                        </div>
                                    ))}
                                    {announcements.length === 0 && <p className="text-center text-zinc-600 py-10 italic">Nenhum aviso ativo no momento.</p>}
                                </div>
                            </div>

                            {/* Ticker Appearance Column (Requested Feature) */}
                            <div className="space-y-6">
                                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 h-full">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><LayoutTemplate size={20} className="text-brewery-accent"/> Aparência da Barra</h3>
                                    
                                    <div className="space-y-8">
                                        <Toggle label="Exibir Rodapé (Ticker)" checked={layout.showTicker} onChange={v => updateLayout({ showTicker: v })} />
                                        
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase">
                                                    <span>Altura da Barra</span>
                                                    <span>{layout.tickerHeight}px</span>
                                                </div>
                                                <input 
                                                    type="range" min="30" max="150" step="5"
                                                    className="w-full accent-brewery-accent h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                                    value={layout.tickerHeight}
                                                    onChange={e => updateLayout({ tickerHeight: Number(e.target.value) })}
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase">
                                                    <span>Tamanho da Fonte</span>
                                                    <span>{layout.tickerFontSize || 18}px</span>
                                                </div>
                                                <input 
                                                    type="range" min="12" max="48" step="2"
                                                    className="w-full accent-brewery-accent h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                                    value={layout.tickerFontSize || 18}
                                                    onChange={e => updateLayout({ tickerFontSize: Number(e.target.value) })}
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase">
                                                    <span>Velocidade de Rolagem</span>
                                                    <span>{layout.tickerSpeed}s</span>
                                                </div>
                                                <input 
                                                    type="range" min="10" max="120" step="5"
                                                    className="w-full accent-brewery-accent h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                                    value={layout.tickerSpeed}
                                                    onChange={e => updateLayout({ tickerSpeed: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PARTY TAB (Refactored) --- */}
                {activeTab === 'PARTY' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        <SectionHeader title="Modo Festa" desc="Efeitos visuais imersivos para comemorações." />
                        
                        <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-3xl p-10 text-center mb-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <PartyPopper size={64} className={`mx-auto mb-6 relative z-10 ${layout.isPartyMode ? 'text-purple-400 animate-bounce' : 'text-zinc-600'}`} />
                            
                            <h3 className="text-2xl font-black text-white mb-8 relative z-10">{layout.isPartyMode ? 'O MODO FESTA ESTÁ ATIVO!' : 'SISTEMA EM MODO NORMAL'}</h3>
                            
                            <button onClick={() => updateLayout({ isPartyMode: !layout.isPartyMode })} className={`relative z-10 px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-xl ${layout.isPartyMode ? 'bg-purple-600 text-white shadow-purple-900/50 hover:bg-purple-500' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`}>
                                {layout.isPartyMode ? 'DESATIVAR FESTA' : 'ATIVAR MODO FESTA'}
                            </button>
                        </div>

                        {layout.isPartyMode && (
                            <div className="animate-in slide-in-from-bottom-8 fade-in duration-500 space-y-8">
                                <div className="max-w-md mx-auto">
                                    <label className="text-xs uppercase font-bold text-purple-400 mb-2 block text-center">Mensagem de Destaque</label>
                                    <input 
                                        className="w-full bg-black/40 border border-purple-500/30 rounded-xl p-4 text-center text-xl text-purple-200 font-bold focus:outline-none focus:border-purple-500"
                                        value={layout.partyMessage}
                                        onChange={e => updateLayout({ partyMessage: e.target.value })}
                                        placeholder="EX: PARABÉNS EQUIPE!"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase font-bold text-zinc-500 mb-4 block text-center">Selecione o Efeito Visual</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {(Object.keys(PARTY_EFFECT_LABELS) as PartyEffect[]).map(effect => (
                                            <button 
                                                key={effect}
                                                onClick={() => updateLayout({ partyEffect: effect })}
                                                className={`p-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center gap-2 text-center h-24 ${layout.partyEffect === effect ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20 hover:text-white'}`}
                                            >
                                                {PARTY_EFFECT_LABELS[effect]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {layout.partyEffect === 'CUSTOM' && (
                                    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-top-4 p-6 bg-black/30 border border-purple-500/30 rounded-2xl">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs uppercase font-bold text-purple-400 mb-1 block">URL da Imagem ou GIF</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-purple-500 outline-none"
                                                        value={layout.customPartyImage || ''}
                                                        onChange={e => updateLayout({ customPartyImage: e.target.value })}
                                                        placeholder="https://exemplo.com/festa.gif"
                                                    />
                                                    <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 rounded-lg flex items-center justify-center cursor-pointer border border-white/10 transition-colors" title="Carregar do Dispositivo">
                                                        <Upload size={18} />
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*" 
                                                            onChange={handleCustomPartyFileUpload} 
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <Toggle 
                                                label="Remover Fundo (Multiplicar)" 
                                                checked={layout.customPartyRemoveBg || false} 
                                                onChange={v => updateLayout({ customPartyRemoveBg: v })} 
                                            />
                                            <p className="text-[10px] text-zinc-500 italic text-center">
                                                A opção "Remover Fundo" aplica um efeito de mesclagem para tornar fundos brancos transparentes. Ideal para cliparts ou logotipos em fundo branco.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- HEADER TAB --- */}
                {activeTab === 'HEADER' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <SectionHeader title="Cabeçalho & Identidade" desc="Personalize o topo do painel." />
                        
                        {/* New Top Banner Controls */}
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 mb-6">
                             <div className="mb-4">
                                <Toggle label="Ativar Painel de Mídia Superior" checked={layout.header.showTopMedia} onChange={v => updateLayout({ header: { ...layout.header, showTopMedia: v } })} />
                                <p className="text-[10px] text-zinc-500 mt-2 px-2">
                                    Adiciona uma barra no topo da tela (acima do título) para exibir vídeos ou imagens em loop. Gerencie o conteúdo na aba "Mídia & Menu".
                                </p>
                             </div>
                             
                             {layout.header.showTopMedia && (
                                <div className="animate-in fade-in slide-in-from-top-2 pt-4 border-t border-white/5">
                                    <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2 uppercase">
                                        <span>Altura do Painel</span>
                                        <span>{layout.header.topMediaHeight}px</span>
                                    </div>
                                    <input 
                                        type="range" min="100" max="600" step="10"
                                        className="w-full accent-brewery-accent h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                        value={layout.header.topMediaHeight}
                                        onChange={e => updateLayout({ header: { ...layout.header, topMediaHeight: Number(e.target.value) } })}
                                    />
                                </div>
                             )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase font-bold text-brewery-muted">Título do Sistema</label>
                                <input className="w-full bg-black/40 border border-white/10 rounded py-2 px-3 text-white focus:border-brewery-accent" value={layout.header.title} onChange={e => updateLayout({ header: { ...layout.header, title: e.target.value } })} />
                            </div>
                            <div>
                                <label className="text-xs uppercase font-bold text-brewery-muted">Subtítulo</label>
                                <input className="w-full bg-black/40 border border-white/10 rounded py-2 px-3 text-white focus:border-brewery-accent" value={layout.header.subtitle} onChange={e => updateLayout({ header: { ...layout.header, subtitle: e.target.value } })} />
                            </div>
                            
                            <div>
                                <label className="text-xs uppercase font-bold text-brewery-muted mb-2 block">Alinhamento do Texto</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => updateLayout({ header: { ...layout.header, alignment: 'LEFT' } })}
                                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${layout.header.alignment !== 'CENTER' ? 'bg-white text-black border-white' : 'bg-black/20 border-white/10 text-zinc-500 hover:text-white'}`}
                                    >
                                        <AlignLeft size={16} /> Esquerda
                                    </button>
                                    <button 
                                        onClick={() => updateLayout({ header: { ...layout.header, alignment: 'CENTER' } })}
                                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${layout.header.alignment === 'CENTER' ? 'bg-white text-black border-white' : 'bg-black/20 border-white/10 text-zinc-500 hover:text-white'}`}
                                    >
                                        <AlignCenter size={16} /> Centralizado
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs uppercase font-bold text-brewery-muted">Cor do Texto</label>
                                    <div className="flex gap-2 items-center"><input type="color" value={layout.header.textColor} onChange={e => updateLayout({ header: { ...layout.header, textColor: e.target.value } })} className="h-8 w-8 bg-transparent border-0 cursor-pointer" /><span className="text-sm font-mono text-zinc-400">{layout.header.textColor}</span></div>
                                </div>
                                <div>
                                    <label className="text-xs uppercase font-bold text-brewery-muted">Cor de Fundo</label>
                                    <div className="flex gap-2 items-center"><input type="color" value={layout.header.backgroundColor} onChange={e => updateLayout({ header: { ...layout.header, backgroundColor: e.target.value } })} className="h-8 w-8 bg-transparent border-0 cursor-pointer" /><span className="text-sm font-mono text-zinc-400">{layout.header.backgroundColor}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                 {/* --- LINES TAB --- */}
                {activeTab === 'LINES' && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                         <SectionHeader title="Linhas & Tanques" desc="Adicione e configure os cartões de monitoramento." />
                         <div className="flex gap-4 mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                            <input className="flex-1 bg-black/40 border border-white/10 rounded px-4 py-2 text-white placeholder-zinc-500" placeholder="Nome da nova linha (ex: Envasadora 02)" value={newLineName} onChange={e => setNewLineName(e.target.value)} />
                            <button onClick={handleAddLine} className="bg-brewery-accent text-black font-bold px-6 rounded hover:bg-amber-400 flex items-center gap-2"><Plus size={18}/> Adicionar</button>
                         </div>
                         <div className="grid grid-cols-1 gap-4">
                            {lineConfigs.map(line => (
                                <div key={line.id} className="bg-brewery-card border border-brewery-border p-6 rounded-xl flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div><label className="text-[10px] uppercase font-bold text-zinc-500">Nome da Linha</label><input className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm" value={line.name} onChange={e => updateLine(line.id, { name: e.target.value })} /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-zinc-500">Tópico MQTT</label><input className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-zinc-300 text-sm font-mono" value={line.nodeRedTopic} onChange={e => updateLine(line.id, { nodeRedTopic: e.target.value })} /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-zinc-500">Meta/Hora</label><input type="number" className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm" value={line.targetPerHour} onChange={e => updateLine(line.id, { targetPerHour: Number(e.target.value) })} /></div>
                                            <div><label className="text-[10px] uppercase font-bold text-zinc-500">Unidade</label><input className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm" value={line.productionUnit} onChange={e => updateLine(line.id, { productionUnit: e.target.value })} /></div>
                                        </div>
                                        <button onClick={() => removeLine(line.id)} className="ml-4 p-2 bg-rose-950/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded transition-colors"><Trash2 size={20}/></button>
                                    </div>
                                    <div className="border-t border-white/5 pt-4"><label className="text-xs font-bold text-brewery-accent mb-2 block">Visibilidade</label><div className="flex flex-wrap gap-4">{Object.entries(line.display).map(([key, val]) => (<label key={key} className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={val} onChange={(e) => updateLine(line.id, { display: { ...line.display, [key]: e.target.checked } })} className="accent-brewery-accent" /><span className="text-sm text-zinc-400 capitalize">{key.replace('show', '')}</span></label>))}</div></div>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;