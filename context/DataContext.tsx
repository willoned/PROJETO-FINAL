import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { DataContextType, MachineData, NodeRedPayload, LineConfig } from '../types';
import { nodeRedService } from '../services/nodeRedService';
import { APP_CONFIG } from '../constants';
import { useLayoutContext } from './LayoutContext';

interface DataState {
  machines: Record<string, MachineData>;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  globalError: string | null;
  lastHeartbeat: number;
}

const initialState: DataState = {
  machines: {},
  connectionStatus: 'DISCONNECTED',
  globalError: null,
  lastHeartbeat: 0,
};

// Helper to normalize data based on Config
const normalizeData = (rawData: any, config: LineConfig, currentMachineState?: MachineData): MachineData | null => {
    const mapping = config.dataMapping;
    if (!mapping) return null;
    const values = rawData.payload || rawData; 
    const temperature = Number(values[mapping.temperatureKey]) || 0;
    
    // Manage Trend History (Max 20 points)
    const prevTrend = currentMachineState?.trend || [];
    const newTrendPoint = {
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: temperature 
    };
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

type Action = 
  | { type: 'UPDATE_RAW_DATA'; payload: { data: NodeRedPayload | NodeRedPayload[]; configs: LineConfig[] } }
  | { type: 'SET_CONNECTION'; payload: DataState['connectionStatus'] }
  | { type: 'SET_ERROR'; payload: string | null };

function dataReducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case 'UPDATE_RAW_DATA': {
      const { data, configs } = action.payload;
      const incoming = Array.isArray(data) ? data : [data];
      const newMachines = { ...state.machines };
      let updatedAny = false;

      incoming.forEach(msg => {
          const matchId = msg.id || msg.topic; 
          const config = configs.find(l => l.id === matchId || l.nodeRedTopic === matchId);
          if (config) {
              const normalized = normalizeData(msg, config, newMachines[config.id]);
              if (normalized) {
                  newMachines[config.id] = normalized;
                  updatedAny = true;
              }
          }
      });

      if (!updatedAny) return state;
      return { ...state, machines: newMachines, lastHeartbeat: Date.now(), globalError: null };
    }
    case 'SET_CONNECTION': return { ...state, connectionStatus: action.payload };
    case 'SET_ERROR': return { ...state, globalError: action.payload };
    default: return state;
  }
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const [isStale, setIsStale] = useState(false);
  
  // NOTE: We access LayoutContext via hook at component level if needed, 
  // but DataContext usually initializes BEFORE Layout data is fully ready.
  // We need lineConfigs to map data. To avoid circular dependencies, 
  // we will pass lineConfigs into the dispatch from a separate effect in App.tsx 
  // OR we accept that DataContext uses the constant INITIAL_LINES until updated.
  // However, here we import useLayoutContext. 
  const { connectionConfig, lineConfigs } = useLayoutContext();

  // Connection Logic
  useEffect(() => {
    let wsUrl = APP_CONFIG.WS_URL;
    if (connectionConfig.host) {
        wsUrl = `${connectionConfig.protocol}://${connectionConfig.host}:${connectionConfig.port}${connectionConfig.path}`;
    }

    const cleanup = nodeRedService.connect(
      (data) => dispatch({ type: 'UPDATE_RAW_DATA', payload: { data, configs: lineConfigs } }),
      (status) => dispatch({ type: 'SET_CONNECTION', payload: status }),
      (errorMsg) => dispatch({ type: 'SET_ERROR', payload: errorMsg })
    );
    
    nodeRedService.updateConnectionConfig(wsUrl);
    return cleanup;
  }, [connectionConfig, lineConfigs]);

  // Watchdog
  useEffect(() => {
    const timer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - state.lastHeartbeat;
      const stale = timeSinceLastHeartbeat > APP_CONFIG.WATCHDOG_TIMEOUT && state.lastHeartbeat > 0;
      setIsStale(stale);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.lastHeartbeat]);

  const clearError = () => dispatch({ type: 'SET_ERROR', payload: null });
  const setError = (msg: string) => {
      dispatch({ type: 'SET_ERROR', payload: msg });
      // Auto clear after 10s for locks
      setTimeout(() => clearError(), 10000);
  };

  const value: DataContextType = {
    ...state,
    isStale,
    clearError,
    setError
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useDataContext must be used within DataProvider');
  return context;
};