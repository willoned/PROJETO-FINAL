import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { AppState, AppContextType, MachineData, MediaItem, Announcement, LayoutSettings, LineConfig, ConnectionSettings } from '../types';
import { nodeRedService } from '../services/nodeRedService'; // USANDO SERVIÇO REAL
import { APP_CONFIG, LINE_CONFIGS as INITIAL_LINES } from '../constants';

// Initial Data for playlists
const DEFAULT_MEDIA: MediaItem[] = [
    { id: '1', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?auto=format&fit=crop&q=80&w=2070', duration: 15, name: 'Happy Hour - Sexta' },
    { id: '2', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&q=80&w=2070', duration: 15, name: 'Controle de Qualidade' }
];

const BANNER_MEDIA: MediaItem[] = [
    { id: 'b1', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&q=80&w=2000', duration: 20, name: 'Banner Institucional' }
];

const initialState: AppState = {
  lineConfigs: INITIAL_LINES, 
  machines: {},
  connectionStatus: 'DISCONNECTED',
  globalError: null,
  lastHeartbeat: 0,
  // Initialize separate playlists
  playlists: {
      'floating': DEFAULT_MEDIA,
      'banner': BANNER_MEDIA
  },
  announcements: [
    { id: '1', message: '🍺 Degustação da nova IPA às 16h no laboratório.', type: 'INFO', isActive: true },
    { id: '2', message: '⚠️ Temperatura do Fermentador 02 acima do ideal.', type: 'WARNING', isActive: true }
  ],
  showSettings: false,
  layout: {
    header: {
        title: 'Cervejaria MasterView',
        subtitle: 'Sistema Supervisório',
        textColor: '#ffffff',
        backgroundColor: '#1a110d',
        showTopMedia: false,
        topMediaHeight: 200,
        alignment: 'LEFT'
    },
    // New draggable logo widget defaults
    logoWidget: {
        show: true,
        x: 20,
        y: 20,
        w: 120,
        h: 120,
        url: '' // Empty by default
    },
    mediaWindow: { x: 800, y: 350, w: 400, h: 300 }, // Default position
    widgetSize: 'NORMAL',
    showMediaPanel: true,
    showTicker: true,
    mediaFit: 'COVER',
    tickerSpeed: 30,
    isPartyMode: false,
    partyMessage: 'FESTA DA CERVEJA! 🍻',
    partyEffect: 'BUBBLES'
  },
  connectionConfig: {
    protocol: 'ws',
    host: 'localhost',
    port: '1880',
    path: '/ws/brewery-data',
    autoConnect: true
  }
};

// Actions
type Action = 
  | { type: 'UPDATE_RAW_DATA'; payload: any } 
  | { type: 'SET_CONNECTION'; payload: AppState['connectionStatus'] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MEDIA'; payload: { key: string; item: MediaItem } }
  | { type: 'REMOVE_MEDIA'; payload: { key: string; id: string } }
  | { type: 'REORDER_MEDIA'; payload: { key: string; startIndex: number; endIndex: number } }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'REMOVE_ANNOUNCEMENT'; payload: string }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<LayoutSettings> }
  | { type: 'UPDATE_CONNECTION_CONFIG'; payload: Partial<ConnectionSettings> }
  | { type: 'ADD_LINE'; payload: LineConfig }
  | { type: 'UPDATE_LINE'; payload: { id: string; config: Partial<LineConfig> } }
  | { type: 'REMOVE_LINE'; payload: string }
  | { type: 'REORDER_LINES'; payload: { startIndex: number; endIndex: number } };

// Helper: Normalize Raw Data using Mapping Config
const normalizeData = (rawData: any, config: LineConfig, currentMachineState?: MachineData): MachineData | null => {
    const mapping = config.dataMapping;
    if (!mapping) return null;

    const values = rawData.payload || rawData; 

    // Extract values based on user configuration keys
    const temperature = Number(values[mapping.temperatureKey]) || 0;
    
    // Manage Trend History
    const prevTrend = currentMachineState?.trend || [];
    const newTrendPoint = {
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: temperature 
    };
    
    // Keep last 20 points
    const updatedTrend = [...prevTrend, newTrendPoint].slice(-20);

    return {
        lineId: config.id,
        status: values[mapping.statusKey] || 'STOPPED',
        productionCount: Number(values[mapping.productionKey]) || 0,
        currentHourlyRate: Number(values[mapping.speedKey]) || 0,
        rejectCount: Number(values[mapping.rejectKey]) || 0,
        efficiency: Number(values[mapping.efficiencyKey]) || 0,
        temperature: temperature,
        lastUpdated: Date.now(),
        trend: updatedTrend
    };
};

function machineReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_RAW_DATA': {
      const incoming = Array.isArray(action.payload) ? action.payload : [action.payload];
      const newMachines = { ...state.machines };
      let updatedAny = false;

      incoming.forEach(msg => {
          const matchId = msg.id || msg.topic; 
          const config = state.lineConfigs.find(l => l.id === matchId || l.nodeRedTopic === matchId);

          if (config) {
              const normalized = normalizeData(msg, config, newMachines[config.id]);
              if (normalized) {
                  newMachines[config.id] = normalized;
                  updatedAny = true;
              }
          }
      });

      if (!updatedAny) return state;

      return {
        ...state,
        machines: newMachines,
        lastHeartbeat: Date.now(),
        globalError: null // Clear error on successful data reception
      };
    }
    case 'SET_CONNECTION':
      return { ...state, connectionStatus: action.payload };
    
    case 'SET_ERROR':
      return { ...state, globalError: action.payload };
    
    // UPDATED MEDIA REDUCERS
    case 'ADD_MEDIA': {
      const { key, item } = action.payload;
      const currentList = state.playlists[key] || [];
      return { 
          ...state, 
          playlists: { ...state.playlists, [key]: [...currentList, item] } 
      };
    }
    case 'REMOVE_MEDIA': {
      const { key, id } = action.payload;
      const currentList = state.playlists[key] || [];
      return { 
          ...state, 
          playlists: { ...state.playlists, [key]: currentList.filter(i => i.id !== id) } 
      };
    }
    case 'REORDER_MEDIA': {
      const { key, startIndex, endIndex } = action.payload;
      const currentList = state.playlists[key] || [];
      const result = Array.from(currentList);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { 
          ...state, 
          playlists: { ...state.playlists, [key]: result } 
      };
    }

    case 'ADD_ANNOUNCEMENT':
      return { ...state, announcements: [...state.announcements, action.payload] };
    case 'REMOVE_ANNOUNCEMENT':
      return { ...state, announcements: state.announcements.filter(i => i.id !== action.payload) };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'UPDATE_LAYOUT':
      let newLayout = { ...state.layout, ...action.payload };
      
      // Handle Nested Updates
      if (action.payload.header) {
          newLayout.header = { ...state.layout.header, ...action.payload.header };
      }
      if (action.payload.logoWidget) {
          newLayout.logoWidget = { ...state.layout.logoWidget, ...action.payload.logoWidget };
      }

      return { ...state, layout: newLayout };
    case 'UPDATE_CONNECTION_CONFIG':
      return { ...state, connectionConfig: { ...state.connectionConfig, ...action.payload } };
    
    // Line Management Reducers
    case 'ADD_LINE':
      return { ...state, lineConfigs: [...state.lineConfigs, action.payload] };
    case 'REMOVE_LINE':
      return { ...state, lineConfigs: state.lineConfigs.filter(l => l.id !== action.payload) };
    case 'UPDATE_LINE':
      return { 
        ...state, 
        lineConfigs: state.lineConfigs.map(l => 
          l.id === action.payload.id ? { ...l, ...action.payload.config } : l
        ) 
      };
    case 'REORDER_LINES': {
      const result = Array.from(state.lineConfigs);
      const [removed] = result.splice(action.payload.startIndex, 1);
      result.splice(action.payload.endIndex, 0, removed);
      return { ...state, lineConfigs: result };
    }

    default:
      return state;
  }
}

const MachineContext = createContext<AppContextType | undefined>(undefined);

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(machineReducer, initialState);
  const [isStale, setIsStale] = useState(false);

  // 1. Connection Logic (REAL NODE-RED SERVICE)
  useEffect(() => {
    let wsUrl = APP_CONFIG.WS_URL;
    if (state.connectionConfig.host) {
        const protocol = state.connectionConfig.protocol;
        const host = state.connectionConfig.host;
        const port = state.connectionConfig.port;
        const path = state.connectionConfig.path;
        wsUrl = `${protocol}://${host}:${port}${path}`;
    }

    const cleanup = nodeRedService.connect(
      (data) => dispatch({ type: 'UPDATE_RAW_DATA', payload: data }),
      (status) => dispatch({ type: 'SET_CONNECTION', payload: status as any }),
      (errorMsg) => dispatch({ type: 'SET_ERROR', payload: errorMsg })
    );
    
    nodeRedService.updateConnectionConfig(wsUrl);
    return cleanup;
  }, [state.connectionConfig]);

  // 2. Watchdog Logic (Data Freshness)
  useEffect(() => {
    const timer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - state.lastHeartbeat;
      const stale = timeSinceLastHeartbeat > APP_CONFIG.WATCHDOG_TIMEOUT && state.lastHeartbeat > 0;
      setIsStale(prev => prev !== stale ? stale : prev);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.lastHeartbeat]);

  // Updated dispatchers with playlistKey
  const addMedia = (playlistKey: string, item: MediaItem) => dispatch({ type: 'ADD_MEDIA', payload: { key: playlistKey, item } });
  const removeMedia = (playlistKey: string, id: string) => dispatch({ type: 'REMOVE_MEDIA', payload: { key: playlistKey, id } });
  const reorderMedia = (playlistKey: string, startIndex: number, endIndex: number) => dispatch({ type: 'REORDER_MEDIA', payload: { key: playlistKey, startIndex, endIndex } });
  
  const addAnnouncement = (item: Announcement) => dispatch({ type: 'ADD_ANNOUNCEMENT', payload: item });
  const removeAnnouncement = (id: string) => dispatch({ type: 'REMOVE_ANNOUNCEMENT', payload: id });
  const toggleSettings = () => dispatch({ type: 'TOGGLE_SETTINGS' });
  const updateLayout = (settings: Partial<LayoutSettings>) => dispatch({ type: 'UPDATE_LAYOUT', payload: settings });
  const updateConnectionConfig = (settings: Partial<ConnectionSettings>) => dispatch({ type: 'UPDATE_CONNECTION_CONFIG', payload: settings });
  
  // Line Actions
  const addLine = (config: LineConfig) => dispatch({ type: 'ADD_LINE', payload: config });
  const updateLine = (id: string, config: Partial<LineConfig>) => dispatch({ type: 'UPDATE_LINE', payload: { id, config } });
  const removeLine = (id: string) => dispatch({ type: 'REMOVE_LINE', payload: id });
  const reorderLines = (startIndex: number, endIndex: number) => dispatch({ type: 'REORDER_LINES', payload: { startIndex, endIndex } });
  
  const clearError = () => dispatch({ type: 'SET_ERROR', payload: null });

  const value: AppContextType = {
    ...state,
    isStale,
    addMedia,
    removeMedia,
    reorderMedia,
    addAnnouncement,
    removeAnnouncement,
    toggleSettings,
    updateLayout,
    updateConnectionConfig,
    addLine,
    updateLine,
    removeLine,
    reorderLines,
    updateLineConfig: (id, target) => console.log('Legacy update called', id, target),
    clearError
  };

  return (
    <MachineContext.Provider value={value}>
      {children}
    </MachineContext.Provider>
  );
};

export const useMachineContext = () => {
  const context = useContext(MachineContext);
  if (!context) {
    throw new Error('useMachineContext must be used within a MachineProvider');
  }
  return context;
};