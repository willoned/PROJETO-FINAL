import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { AppState, AppContextType, MachineData, MediaItem, Announcement, LayoutSettings, LineConfig, ConnectionSettings, FloatingWindowConfig } from '../types';
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

// Determine secure protocol based on current page
// NOTE: In Electron (file://), we allow insecure connections for local network devices
const isSecure = typeof window !== 'undefined' && 
                 window.location.protocol === 'https:';

const STORAGE_KEY = 'IV_PRO_CONFIG_V1';

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
        topMediaBorderWidth: 1, // Default border width
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
    // UPDATED: Floating Windows Array (default has one)
    floatingWindows: [
        { id: 'floating', name: 'Principal', x: 800, y: 350, w: 400, h: 300 }
    ],
    widgetSize: 'NORMAL',
    showMediaPanel: true,
    showTicker: true,
    tickerHeight: 60, // Default height
    tickerFontSize: 18, // NEW: Default font size
    mediaFit: 'COVER',
    tickerSpeed: 30,
    isPartyMode: false,
    partyMessage: 'FESTA DA CERVEJA! 🍻',
    partyEffect: 'BUBBLES'
  },
  connectionConfig: {
    // If on HTTPS, default WSS. If Electron (file:) or HTTP, default WS.
    protocol: isSecure ? 'wss' : 'ws',
    host: 'localhost',
    port: '1880',
    path: '/ws/brewery-data',
    autoConnect: true
  }
};

// --- PERSISTENCE HELPER FUNCTIONS ---

/**
 * Loads state from localStorage and merges with default initialState.
 * Handles migration/schema changes gracefully by using spread syntax.
 */
const loadState = (defaultState: AppState): AppState => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return defaultState;

        const parsed = JSON.parse(stored);

        // MIGRATION LOGIC: Check if layout has 'mediaWindow' (old) instead of 'floatingWindows' (new)
        if (parsed.layout && parsed.layout.mediaWindow && !parsed.layout.floatingWindows) {
            console.log("Migrating single mediaWindow to floatingWindows array...");
            parsed.layout.floatingWindows = [{
                id: 'floating',
                name: 'Principal',
                x: parsed.layout.mediaWindow.x,
                y: parsed.layout.mediaWindow.y,
                w: parsed.layout.mediaWindow.w,
                h: parsed.layout.mediaWindow.h
            }];
            delete parsed.layout.mediaWindow;
        }

        // Merge strategies:
        return {
            ...defaultState,
            ...parsed,
            machines: {},
            connectionStatus: 'DISCONNECTED',
            globalError: null,
            lastHeartbeat: 0,
            showSettings: false,
            layout: { ...defaultState.layout, ...parsed.layout }, 
            connectionConfig: { ...defaultState.connectionConfig, ...parsed.connectionConfig }
        };
    } catch (error) {
        console.error("Failed to load persistence state, using defaults:", error);
        return defaultState;
    }
};

/**
 * Sanitizes the state before saving to prevent storage bloat and
 * remove volatile real-time data.
 */
const sanitizeStateForStorage = (state: AppState) => {
    return {
        lineConfigs: state.lineConfigs,
        playlists: state.playlists,
        // Limit announcements history to last 50 to prevent infinite growth
        announcements: state.announcements.slice(-50), 
        layout: state.layout,
        connectionConfig: state.connectionConfig
    };
};

// Actions
type Action = 
  | { type: 'UPDATE_RAW_DATA'; payload: any } 
  | { type: 'SET_CONNECTION'; payload: AppState['connectionStatus'] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MEDIA'; payload: { key: string; item: MediaItem } }
  | { type: 'REMOVE_MEDIA'; payload: { key: string; id: string } }
  | { type: 'UPDATE_MEDIA'; payload: { key: string; id: string; data: Partial<MediaItem> } }
  | { type: 'REORDER_MEDIA'; payload: { key: string; startIndex: number; endIndex: number } }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'REMOVE_ANNOUNCEMENT'; payload: string }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<LayoutSettings> }
  | { type: 'UPDATE_CONNECTION_CONFIG'; payload: Partial<ConnectionSettings> }
  | { type: 'ADD_LINE'; payload: LineConfig }
  | { type: 'UPDATE_LINE'; payload: { id: string; config: Partial<LineConfig> } }
  | { type: 'REMOVE_LINE'; payload: string }
  | { type: 'REORDER_LINES'; payload: { startIndex: number; endIndex: number } }
  // Window Actions
  | { type: 'ADD_WINDOW'; payload: { name: string } }
  | { type: 'REMOVE_WINDOW'; payload: string }
  | { type: 'UPDATE_WINDOW'; payload: { id: string; config: Partial<FloatingWindowConfig> } };

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
          // Identify line by ID or Topic match
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
    case 'UPDATE_MEDIA': {
      const { key, id, data } = action.payload;
      const currentList = state.playlists[key] || [];
      return {
          ...state,
          playlists: {
              ...state.playlists,
              [key]: currentList.map(item => item.id === id ? { ...item, ...data } : item)
          }
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
      if (action.payload.header) {
          newLayout.header = { ...state.layout.header, ...action.payload.header };
      }
      if (action.payload.logoWidget) {
          newLayout.logoWidget = { ...state.layout.logoWidget, ...action.payload.logoWidget };
      }
      return { ...state, layout: newLayout };
    case 'UPDATE_CONNECTION_CONFIG':
      return { ...state, connectionConfig: { ...state.connectionConfig, ...action.payload } };
    
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

    // WINDOW MANAGEMENT REDUCERS
    case 'ADD_WINDOW': {
        const newId = `window-${Date.now()}`;
        const newWindow: FloatingWindowConfig = {
            id: newId,
            name: action.payload.name,
            x: 100 + (state.layout.floatingWindows.length * 20), // Cascade position
            y: 100 + (state.layout.floatingWindows.length * 20),
            w: 400,
            h: 300
        };
        // Also initialize playlist for this window
        return {
            ...state,
            layout: { ...state.layout, floatingWindows: [...state.layout.floatingWindows, newWindow] },
            playlists: { ...state.playlists, [newId]: [] }
        };
    }
    case 'REMOVE_WINDOW': {
        return {
            ...state,
            layout: { 
                ...state.layout, 
                floatingWindows: state.layout.floatingWindows.filter(w => w.id !== action.payload) 
            }
            // Optional: Cleanup playlist, but keeping it is safer for undo
        };
    }
    case 'UPDATE_WINDOW': {
        return {
            ...state,
            layout: {
                ...state.layout,
                floatingWindows: state.layout.floatingWindows.map(w => 
                    w.id === action.payload.id ? { ...w, ...action.payload.config } : w
                )
            }
        };
    }

    default:
      return state;
  }
}

const MachineContext = createContext<AppContextType | undefined>(undefined);

export const MachineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use Lazy Initialization for State to load from LocalStorage
  const [state, dispatch] = useReducer(machineReducer, initialState, loadState);
  const [isStale, setIsStale] = useState(false);

  // 1. AUTO-SAVE & PERSISTENCE EFFECT
  useEffect(() => {
    const dataToSave = sanitizeStateForStorage(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [
    state.lineConfigs,
    state.playlists,
    state.announcements,
    state.layout,
    state.connectionConfig
  ]);

  // 2. Connection Logic (REAL NODE-RED SERVICE)
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

  // 3. Watchdog Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - state.lastHeartbeat;
      const stale = timeSinceLastHeartbeat > APP_CONFIG.WATCHDOG_TIMEOUT && state.lastHeartbeat > 0;
      setIsStale(prev => prev !== stale ? stale : prev);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.lastHeartbeat]);

  const addMedia = (playlistKey: string, item: MediaItem) => dispatch({ type: 'ADD_MEDIA', payload: { key: playlistKey, item } });
  const removeMedia = (playlistKey: string, id: string) => dispatch({ type: 'REMOVE_MEDIA', payload: { key: playlistKey, id } });
  const updateMedia = (playlistKey: string, id: string, data: Partial<MediaItem>) => dispatch({ type: 'UPDATE_MEDIA', payload: { key: playlistKey, id, data } });
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
  
  // Window Actions
  const addWindow = (name: string) => dispatch({ type: 'ADD_WINDOW', payload: { name } });
  const removeWindow = (id: string) => dispatch({ type: 'REMOVE_WINDOW', payload: id });
  const updateWindow = (id: string, config: Partial<FloatingWindowConfig>) => dispatch({ type: 'UPDATE_WINDOW', payload: { id, config } });

  const clearError = () => dispatch({ type: 'SET_ERROR', payload: null });

  const value: AppContextType = {
    ...state,
    isStale,
    addMedia,
    removeMedia,
    updateMedia,
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
    addWindow,
    removeWindow,
    updateWindow,
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