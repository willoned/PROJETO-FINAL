import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { 
  LayoutContextType, LayoutSettings, LineConfig, ConnectionSettings, 
  MediaItem, Announcement, FloatingWindowConfig 
} from '../types';
import { LINE_CONFIGS as INITIAL_LINES } from '../constants';

const DEFAULT_MEDIA: MediaItem[] = [
    { id: '1', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?auto=format&fit=crop&q=80&w=2070', duration: 15, name: 'Happy Hour - Sexta' },
];
const BANNER_MEDIA: MediaItem[] = [
    { id: 'b1', type: 'IMAGE', url: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?auto=format&fit=crop&q=80&w=2000', duration: 20, name: 'Banner Institucional' }
];

const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';

interface LayoutState {
  lineConfigs: LineConfig[];
  playlists: Record<string, MediaItem[]>;
  announcements: Announcement[];
  showSettings: boolean;
  layout: LayoutSettings;
  connectionConfig: ConnectionSettings;
  isEditing: boolean;
  isLockedByOther: boolean;
  lockedBy: string | null;
}

const initialState: LayoutState = {
  lineConfigs: INITIAL_LINES,
  playlists: { 'floating': DEFAULT_MEDIA, 'banner': BANNER_MEDIA },
  announcements: [],
  showSettings: false,
  layout: {
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
    floatingWindows: [{ id: 'floating', name: 'Principal', x: 800, y: 350, w: 400, h: 300, visible: true }],
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
    partyEffect: 'BUBBLES'
  },
  connectionConfig: {
    protocol: isSecure ? 'wss' : 'ws',
    host: 'localhost',
    port: '1880',
    path: '/ws/brewery-data',
    autoConnect: true
  },
  isEditing: false,
  isLockedByOther: false,
  lockedBy: null
};

type Action = 
  | { type: 'ADD_MEDIA'; payload: { key: string; item: MediaItem } }
  | { type: 'REMOVE_MEDIA'; payload: { key: string; id: string } }
  | { type: 'UPDATE_MEDIA'; payload: { key: string; id: string; data: Partial<MediaItem> } }
  | { type: 'REORDER_MEDIA'; payload: { key: string; startIndex: number; endIndex: number } }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'REMOVE_ANNOUNCEMENT'; payload: string }
  | { type: 'TOGGLE_SETTINGS'; payload?: boolean }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<LayoutSettings> }
  | { type: 'UPDATE_CONNECTION_CONFIG'; payload: Partial<ConnectionSettings> }
  | { type: 'ADD_LINE'; payload: LineConfig }
  | { type: 'UPDATE_LINE'; payload: { id: string; config: Partial<LineConfig> } }
  | { type: 'REMOVE_LINE'; payload: string }
  | { type: 'REORDER_LINES'; payload: { startIndex: number; endIndex: number } }
  | { type: 'ADD_WINDOW'; payload: { name: string } }
  | { type: 'REMOVE_WINDOW'; payload: string }
  | { type: 'UPDATE_WINDOW'; payload: { id: string; config: Partial<FloatingWindowConfig> } }
  | { type: 'RESET_WINDOWS_DIMENSIONS' }
  | { type: 'FULL_STATE_SYNC'; payload: any }
  | { type: 'LOCK_STATUS_CHANGE'; payload: { isLocked: boolean; user: string | null } }
  | { type: 'SET_EDITING_MODE'; payload: boolean };

function layoutReducer(state: LayoutState, action: Action): LayoutState {
    switch (action.type) {
        case 'ADD_MEDIA': return { ...state, playlists: { ...state.playlists, [action.payload.key]: [...(state.playlists[action.payload.key] || []), action.payload.item] } };
        case 'REMOVE_MEDIA': return { ...state, playlists: { ...state.playlists, [action.payload.key]: (state.playlists[action.payload.key] || []).filter(i => i.id !== action.payload.id) } };
        case 'UPDATE_MEDIA': return { ...state, playlists: { ...state.playlists, [action.payload.key]: (state.playlists[action.payload.key] || []).map(i => i.id === action.payload.id ? {...i, ...action.payload.data} : i) } };
        case 'REORDER_MEDIA': {
            const list = Array.from(state.playlists[action.payload.key] || []);
            const [rem] = list.splice(action.payload.startIndex, 1);
            list.splice(action.payload.endIndex, 0, rem);
            return { ...state, playlists: { ...state.playlists, [action.payload.key]: list } };
        }
        case 'ADD_ANNOUNCEMENT': return { ...state, announcements: [...state.announcements, action.payload] };
        case 'REMOVE_ANNOUNCEMENT': return { ...state, announcements: state.announcements.filter(i => i.id !== action.payload) };
        case 'TOGGLE_SETTINGS': return { ...state, showSettings: action.payload !== undefined ? action.payload : !state.showSettings };
        case 'UPDATE_LAYOUT': {
            const newLayout = { ...state.layout, ...action.payload };
            if(action.payload.header) newLayout.header = { ...state.layout.header, ...action.payload.header };
            if(action.payload.logoWidget) newLayout.logoWidget = { ...state.layout.logoWidget, ...action.payload.logoWidget };
            return { ...state, layout: newLayout };
        }
        case 'UPDATE_CONNECTION_CONFIG': return { ...state, connectionConfig: { ...state.connectionConfig, ...action.payload } };
        case 'ADD_LINE': return { ...state, lineConfigs: [...state.lineConfigs, action.payload] };
        case 'REMOVE_LINE': return { ...state, lineConfigs: state.lineConfigs.filter(l => l.id !== action.payload) };
        case 'UPDATE_LINE': return { ...state, lineConfigs: state.lineConfigs.map(l => l.id === action.payload.id ? { ...l, ...action.payload.config } : l) };
        case 'REORDER_LINES': {
             const result = Array.from(state.lineConfigs);
             const [removed] = result.splice(action.payload.startIndex, 1);
             result.splice(action.payload.endIndex, 0, removed);
             return { ...state, lineConfigs: result };
        }
        case 'ADD_WINDOW': {
             const newId = `window-${Date.now()}`;
             return { ...state, layout: { ...state.layout, floatingWindows: [...state.layout.floatingWindows, { id: newId, name: action.payload.name, x: 100, y: 100, w: 400, h: 300, visible: true }] }, playlists: { ...state.playlists, [newId]: [] } };
        }
        case 'REMOVE_WINDOW': return { ...state, layout: { ...state.layout, floatingWindows: state.layout.floatingWindows.filter(w => w.id !== action.payload) } };
        case 'UPDATE_WINDOW': return { ...state, layout: { ...state.layout, floatingWindows: state.layout.floatingWindows.map(w => w.id === action.payload.id ? { ...w, ...action.payload.config } : w) } };
        case 'RESET_WINDOWS_DIMENSIONS': return { ...state, layout: { ...state.layout, floatingWindows: state.layout.floatingWindows.map(w => ({ ...w, w: 200, h: 200 })) } };
        case 'FULL_STATE_SYNC': return { ...state, ...action.payload, layout: { ...state.layout, ...action.payload.layout } };
        case 'LOCK_STATUS_CHANGE': return { ...state, isLockedByOther: action.payload.isLocked, lockedBy: action.payload.user, showSettings: action.payload.isLocked ? false : state.showSettings, isEditing: action.payload.isLocked ? false : state.isEditing };
        case 'SET_EDITING_MODE': return { ...state, isEditing: action.payload, showSettings: action.payload };
        default: return state;
    }
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(layoutReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Generate a random session user ID for this browser tab
  const [sessionUser] = useState(() => 'User_' + Math.floor(Math.random() * 10000));
  
  const triggerError = (msg: string) => {
      window.dispatchEvent(new CustomEvent('IV_GLOBAL_ERROR', { detail: msg }));
  };

  useEffect(() => {
    fetch('/api/layout')
        .then(res => res.ok ? res.json() : null)
        .then(data => data && dispatch({ type: 'FULL_STATE_SYNC', payload: data }))
        .catch(() => {});
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/system-ws`; 
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
            case 'LOCK_STATUS':
                if (msg.user !== sessionUser) {
                    dispatch({ type: 'LOCK_STATUS_CHANGE', payload: { isLocked: msg.isLocked, user: msg.user } });
                }
                break;
            case 'LOCK_GRANTED':
                dispatch({ type: 'SET_EDITING_MODE', payload: true });
                break;
            case 'LOCK_DENIED':
                triggerError(`Usuário ${msg.user} está editando agora. Aguarde.`);
                break;
            case 'LAYOUT_UPDATED':
                dispatch({ type: 'FULL_STATE_SYNC', payload: msg.payload });
                break;
        }
    };

    return () => { if(ws.readyState === 1) ws.close(); };
  }, [sessionUser]);

  const requestLock = () => wsRef.current?.send(JSON.stringify({ type: 'REQUEST_LOCK', user: sessionUser }));
  const releaseLock = () => { dispatch({ type: 'SET_EDITING_MODE', payload: false }); wsRef.current?.send(JSON.stringify({ type: 'RELEASE_LOCK' })); };
  const saveLayout = () => {
      const { isEditing, isLockedByOther, lockedBy, ...payload } = state;
      wsRef.current?.send(JSON.stringify({ type: 'SAVE_LAYOUT', payload }));
  };

  const toggleSettings = () => state.showSettings ? releaseLock() : requestLock();

  const value: LayoutContextType = {
    ...state,
    addMedia: (key, item) => dispatch({ type: 'ADD_MEDIA', payload: { key, item } }),
    removeMedia: (key, id) => dispatch({ type: 'REMOVE_MEDIA', payload: { key, id } }),
    updateMedia: (key, id, data) => dispatch({ type: 'UPDATE_MEDIA', payload: { key, id, data } }),
    reorderMedia: (key, start, end) => dispatch({ type: 'REORDER_MEDIA', payload: { key, startIndex: start, endIndex: end } }),
    addAnnouncement: (item) => dispatch({ type: 'ADD_ANNOUNCEMENT', payload: item }),
    removeAnnouncement: (id) => dispatch({ type: 'REMOVE_ANNOUNCEMENT', payload: id }),
    toggleSettings, requestLock, releaseLock, saveLayout,
    updateLayout: (s) => dispatch({ type: 'UPDATE_LAYOUT', payload: s }),
    updateConnectionConfig: (s) => dispatch({ type: 'UPDATE_CONNECTION_CONFIG', payload: s }),
    addWindow: (name) => dispatch({ type: 'ADD_WINDOW', payload: { name } }),
    removeWindow: (id) => dispatch({ type: 'REMOVE_WINDOW', payload: id }),
    updateWindow: (id, config) => dispatch({ type: 'UPDATE_WINDOW', payload: { id, config } }),
    resetWindowDimensions: () => dispatch({ type: 'RESET_WINDOWS_DIMENSIONS' }),
    addLine: (c) => dispatch({ type: 'ADD_LINE', payload: c }),
    updateLine: (id, c) => dispatch({ type: 'UPDATE_LINE', payload: { id, config: c } }),
    removeLine: (id) => dispatch({ type: 'REMOVE_LINE', payload: id }),
    reorderLines: (s, e) => dispatch({ type: 'REORDER_LINES', payload: { startIndex: s, endIndex: e } }),
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error('useLayoutContext must be used within LayoutProvider');
  return context;
};