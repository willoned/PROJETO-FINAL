import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  MachineContextType, LayoutSettings, LineConfig, ConnectionSettings, 
  MediaItem, Announcement, MachineData, NodeRedPayload, FloatingWindowConfig
} from '../types';
import { LINE_CONFIGS as INITIAL_LINES } from '../constants';
import { nodeRedService } from '../services/nodeRedService';

const MachineContext = createContext<MachineContextType | undefined>(undefined);

const DEFAULT_MEDIA: MediaItem[] = [
    { id: '1', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?auto=format&fit=crop&q=80&w=2070', duration: 15, name: 'Happy Hour' },
];

const INITIAL_LAYOUT: LayoutSettings = {
    header: {
        title: 'Cervejaria MasterView',
        subtitle: 'Sistema Supervisório',
        textColor: '#ffffff',
        backgroundColor: '#1a110d',
        showTopMedia: false,
        topMediaHeight: 200,
        topMediaBorderWidth: 1,
        alignment: 'LEFT'
    },
    logoWidget: { show: true, x: 20, y: 20, w: 120, h: 120, url: '' },
    // Fixed 4 Windows configuration
    floatingWindows: [
        { id: 'win-1', name: 'Janela 01', x: 50, y: 150, w: 400, h: 300, visible: true },
        { id: 'win-2', name: 'Janela 02', x: 500, y: 150, w: 400, h: 300, visible: false },
        { id: 'win-3', name: 'Janela 03', x: 950, y: 150, w: 400, h: 300, visible: false },
        { id: 'win-4', name: 'Janela 04', x: 50, y: 500, w: 400, h: 300, visible: false },
    ],
    areWindowsLocked: false,
    widgetSize: 'NORMAL',
    showMediaPanel: true,
    showTicker: true,
    tickerHeight: 60,
    tickerFontSize: 18,
    mediaFit: 'COVER',
    tickerSpeed: 30,
    isPartyMode: false,
    partyMessage: 'FESTA DA CERVEJA! 🍻',
    partyEffect: 'BUBBLES',
    customPartyRemoveBg: false
};

const INITIAL_CONNECTION: ConnectionSettings = {
    protocol: 'ws',
    host: 'localhost',
    port: '1880',
    path: '/ws/brewery-data',
    autoConnect: true
};

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Persistent State (LocalStorage) ---
  const [lineConfigs, setLineConfigs] = useState<LineConfig[]>(() => {
    const saved = localStorage.getItem('IV_LINES');
    return saved ? JSON.parse(saved) : INITIAL_LINES;
  });

  const [layout, setLayoutState] = useState<LayoutSettings>(() => {
    const saved = localStorage.getItem('IV_LAYOUT');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure 4 windows exist even if loading from old save
        if (!parsed.floatingWindows || parsed.floatingWindows.length !== 4) {
            parsed.floatingWindows = INITIAL_LAYOUT.floatingWindows;
        }
        return parsed;
    }
    return INITIAL_LAYOUT;
  });

  const [connectionConfig, setConnectionConfigState] = useState<ConnectionSettings>(() => {
     const saved = localStorage.getItem('IV_CONNECTION');
     return saved ? JSON.parse(saved) : INITIAL_CONNECTION;
  });

  const [playlists, setPlaylists] = useState<Record<string, MediaItem[]>>(() => {
     const saved = localStorage.getItem('IV_PLAYLISTS');
     const parsed = saved ? JSON.parse(saved) : {};
     
     // Ensure keys exist for banner and all 4 windows
     if (!parsed.banner) parsed.banner = [];
     ['win-1', 'win-2', 'win-3', 'win-4'].forEach(key => {
         if (!parsed[key]) parsed[key] = key === 'win-1' ? DEFAULT_MEDIA : [];
     });
     
     return parsed;
  });

  // Initialize with the requested CRITICAL alert
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
        id: 'default-critical-1',
        message: 'FALHA NO SISTEMA DE REFRIGERAÇÃO',
        type: 'CRITICAL',
        isActive: true,
        displayMode: 'TICKER'
    }
  ]);

  // --- Ephemeral State ---
  const [machines, setMachines] = useState<Record<string, MachineData>>({});
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'>('DISCONNECTED');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem('IV_LINES', JSON.stringify(lineConfigs)), [lineConfigs]);
  useEffect(() => localStorage.setItem('IV_LAYOUT', JSON.stringify(layout)), [layout]);
  useEffect(() => localStorage.setItem('IV_CONNECTION', JSON.stringify(connectionConfig)), [connectionConfig]);
  useEffect(() => localStorage.setItem('IV_PLAYLISTS', JSON.stringify(playlists)), [playlists]);

  // --- Node-RED Connection ---
  useEffect(() => {
    const url = `${connectionConfig.protocol}://${connectionConfig.host}:${connectionConfig.port}${connectionConfig.path}`;
    
    const handleData = (data: NodeRedPayload | NodeRedPayload[]) => {
        const incoming = Array.isArray(data) ? data : [data];
        setMachines(prev => {
            const next = { ...prev };
            let changed = false;
            incoming.forEach(msg => {
                const id = msg.id || msg.topic;
                const config = lineConfigs.find(l => l.id === id || l.nodeRedTopic === id);
                if (config && config.dataMapping) {
                    const values: any = msg.payload || msg;
                    const map = config.dataMapping;
                    
                    // Trend Logic
                    const currentTrend = next[config.id]?.trend || [];
                    const newValue = Number(values[map.temperatureKey]) || 0;
                    const newPoint = { 
                        time: new Date().toLocaleTimeString(), 
                        value: newValue 
                    };
                    const updatedTrend = [...currentTrend, newPoint].slice(-20);

                    next[config.id] = {
                        lineId: config.id,
                        status: values[map.statusKey] || 'STOPPED',
                        productionCount: Number(values[map.productionKey]) || 0,
                        currentHourlyRate: Number(values[map.speedKey]) || 0,
                        rejectCount: Number(values[map.rejectKey]) || 0,
                        efficiency: Number(values[map.efficiencyKey]) || 0,
                        temperature: newValue,
                        lastUpdated: Date.now(),
                        trend: updatedTrend
                    };
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    };

    const cleanup = nodeRedService.connect(handleData, setConnectionStatus);
    nodeRedService.updateConnectionConfig(url, handleData, setConnectionStatus);
    return cleanup;
  }, [connectionConfig, lineConfigs]);


  // --- Actions ---
  const toggleSettings = () => setShowSettings(prev => !prev);
  const setEditing = (val: boolean) => setIsEditing(val);

  const updateLayout = (settings: Partial<LayoutSettings>) => {
      setLayoutState(prev => {
          const next = { ...prev, ...settings };
          if(settings.header) next.header = { ...prev.header, ...settings.header };
          if(settings.logoWidget) next.logoWidget = { ...prev.logoWidget, ...settings.logoWidget };
          return next;
      });
  };

  const updateConnectionConfig = (settings: Partial<ConnectionSettings>) => setConnectionConfigState(prev => ({ ...prev, ...settings }));

  const addLine = (config: LineConfig) => setLineConfigs(prev => [...prev, config]);
  const removeLine = (id: string) => setLineConfigs(prev => prev.filter(l => l.id !== id));
  const updateLine = (id: string, config: Partial<LineConfig>) => {
      setLineConfigs(prev => prev.map(l => l.id === id ? { ...l, ...config } : l));
  };

  const addMedia = (key: string, item: MediaItem) => {
      setPlaylists(prev => ({ ...prev, [key]: [...(prev[key] || []), item] }));
  };
  const removeMedia = (key: string, id: string) => {
      setPlaylists(prev => ({ ...prev, [key]: (prev[key] || []).filter(i => i.id !== id) }));
  };
  const updateMedia = (key: string, id: string, data: Partial<MediaItem>) => {
      setPlaylists(prev => ({ 
          ...prev, 
          [key]: (prev[key] || []).map(i => i.id === id ? { ...i, ...data } : i) 
      }));
  };
  const reorderMedia = (key: string, start: number, end: number) => {
      setPlaylists(prev => {
          const list = [...(prev[key] || [])];
          const [removed] = list.splice(start, 1);
          list.splice(end, 0, removed);
          return { ...prev, [key]: list };
      });
  };

  const addAnnouncement = (item: Announcement) => setAnnouncements(prev => [...prev, item]);
  const removeAnnouncement = (id: string) => setAnnouncements(prev => prev.filter(a => a.id !== id));

  // Disabled in UI, but kept for type safety or programmatic use if needed (logic updated to block >4)
  const addWindow = (name: string) => {
      if (layout.floatingWindows.length >= 4) return;
      // ... logic omitted as UI removed ...
  };
  
  const updateWindow = (id: string, config: Partial<FloatingWindowConfig>) => {
      setLayoutState(prev => ({
          ...prev,
          floatingWindows: prev.floatingWindows.map(w => w.id === id ? { ...w, ...config } : w)
      }));
  };
  
  const removeWindow = (id: string) => {
      // Disabled in UI - Fixed 4 windows
  };

  const value: MachineContextType = {
      machines, lineConfigs, layout, connectionConfig, playlists, announcements,
      showSettings, isEditing, connectionStatus,
      toggleSettings, setEditing, updateLayout, updateConnectionConfig,
      addLine, updateLine, removeLine,
      addMedia, removeMedia, reorderMedia, updateMedia,
      addAnnouncement, removeAnnouncement,
      addWindow, updateWindow, removeWindow
  };

  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>;
};

export const useMachineContext = () => {
    const ctx = useContext(MachineContext);
    if (!ctx) throw new Error("useMachineContext must be used within MachineProvider");
    return ctx;
};