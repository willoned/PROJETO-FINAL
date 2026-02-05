import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { AppState, AppContextType, MachineData, MediaItem, Announcement, LayoutSettings, LineConfig, ConnectionSettings } from '../types';
import { nodeRedService } from '../services/mockNodeRedService';
import { APP_CONFIG, LINE_CONFIGS as INITIAL_LINES } from '../constants';

const initialState: AppState = {
  lineConfigs: INITIAL_LINES, // Start with default constants
  machines: {},
  connectionStatus: 'DISCONNECTED',
  lastHeartbeat: 0,
  mediaPlaylist: [
    { id: '1', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?auto=format&fit=crop&q=80&w=2070', duration: 15, name: 'Happy Hour - Sexta' },
    { id: '2', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&q=80&w=2070', duration: 15, name: 'Controle de Qualidade' }
  ],
  announcements: [
    { id: '1', message: '🍺 Degustação da nova IPA às 16h no laboratório.', type: 'INFO', isActive: true },
    { id: '2', message: '⚠️ Temperatura do Fermentador 02 acima do ideal.', type: 'WARNING', isActive: true }
  ],
  showSettings: false,
  layout: {
    mediaPanelSize: 35, // Default 35%
    widgetSize: 'NORMAL',
    showMediaPanel: true,
    showTicker: true,
    splitDirection: 'HORIZONTAL', // Default side-by-side
    panelOrder: 'MEDIA_FIRST', // Default media on left/top
    mediaFit: 'COVER', // Default fit mode
    tickerSpeed: 30, // Default speed
    isPartyMode: false,
    partyMessage: 'FESTA DA CERVEJA! 🍻',
    partyEffect: 'BUBBLES' // Default effect
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
  | { type: 'UPDATE_DATA'; payload: MachineData[] }
  | { type: 'SET_CONNECTION'; payload: AppState['connectionStatus'] }
  | { type: 'ADD_MEDIA'; payload: MediaItem }
  | { type: 'REMOVE_MEDIA'; payload: string }
  | { type: 'REORDER_MEDIA'; payload: { startIndex: number; endIndex: number } }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'REMOVE_ANNOUNCEMENT'; payload: string }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<LayoutSettings> }
  | { type: 'UPDATE_CONNECTION_CONFIG'; payload: Partial<ConnectionSettings> }
  | { type: 'ADD_LINE'; payload: LineConfig }
  | { type: 'UPDATE_LINE'; payload: { id: string; config: Partial<LineConfig> } }
  | { type: 'REMOVE_LINE'; payload: string }
  | { type: 'REORDER_LINES'; payload: { startIndex: number; endIndex: number } };

// Reducer for high-frequency updates
function machineReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_DATA': {
      const newMachines = { ...state.machines };
      action.payload.forEach(data => {
        newMachines[data.lineId] = data;
      });
      return {
        ...state,
        machines: newMachines,
        lastHeartbeat: Date.now(),
      };
    }
    case 'SET_CONNECTION':
      return { ...state, connectionStatus: action.payload };
    case 'ADD_MEDIA':
      return { ...state, mediaPlaylist: [...state.mediaPlaylist, action.payload] };
    case 'REMOVE_MEDIA':
      return { ...state, mediaPlaylist: state.mediaPlaylist.filter(i => i.id !== action.payload) };
    case 'REORDER_MEDIA': {
      const result = Array.from(state.mediaPlaylist);
      const [removed] = result.splice(action.payload.startIndex, 1);
      result.splice(action.payload.endIndex, 0, removed);
      return { ...state, mediaPlaylist: result };
    }
    case 'ADD_ANNOUNCEMENT':
      return { ...state, announcements: [...state.announcements, action.payload] };
    case 'REMOVE_ANNOUNCEMENT':
      return { ...state, announcements: state.announcements.filter(i => i.id !== action.payload) };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'UPDATE_LAYOUT':
      return { ...state, layout: { ...state.layout, ...action.payload } };
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

  // 1. Connection Logic
  useEffect(() => {
    const cleanup = nodeRedService.connect(
      (data) => dispatch({ type: 'UPDATE_DATA', payload: data }),
      (status) => dispatch({ type: 'SET_CONNECTION', payload: status as any })
    );
    return cleanup;
  }, []);

  // 2. Watchdog Logic (Data Freshness)
  useEffect(() => {
    const timer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - state.lastHeartbeat;
      const stale = timeSinceLastHeartbeat > APP_CONFIG.WATCHDOG_TIMEOUT && state.lastHeartbeat > 0;
      setIsStale(prev => prev !== stale ? stale : prev);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.lastHeartbeat]);

  const addMedia = (item: MediaItem) => dispatch({ type: 'ADD_MEDIA', payload: item });
  const removeMedia = (id: string) => dispatch({ type: 'REMOVE_MEDIA', payload: id });
  const reorderMedia = (startIndex: number, endIndex: number) => dispatch({ type: 'REORDER_MEDIA', payload: { startIndex, endIndex } });
  
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
    updateLineConfig: (id, target) => console.log('Legacy update called', id, target)
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