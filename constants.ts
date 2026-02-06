import { LineConfig, DataMapping } from './types';

// Default display settings
const DEFAULT_DISPLAY = {
  showVolume: false,
  showPB: false,
  showHourly: false,
  showTemp: false,
  showTrend: false,
  showBarChart: false
};

// Default Mapping (De/Para)
const DEFAULT_MAPPING: DataMapping = {
  productionKey: 'count',    // JSON key for production volume
  speedKey: 'rate_h',        // JSON key for hourly speed
  temperatureKey: 'temp_c',  // JSON key for temperature
  rejectKey: 'rejects',      // JSON key for rejects
  statusKey: 'status',       // JSON key for status string/code
  efficiencyKey: 'oee'       // JSON key for efficiency
};

// ==========================================
// SCALABILITY CONFIGURATION
// ==========================================
export const LINE_CONFIGS: LineConfig[] = [
  { 
    id: 'TNK-01', 
    name: 'Fermentador IPA', 
    targetPerHour: 1000, 
    nodeRedTopic: 'brewery/tanks/01',
    display: { ...DEFAULT_DISPLAY, showTemp: true, showTrend: true },
    dataMapping: DEFAULT_MAPPING,
    x: 40, y: 40, w: 280, h: 220,
    productionUnit: 'L',
    timeBasis: 'HOUR'
  },
  { 
    id: 'TNK-02', 
    name: 'Fermentador Lager', 
    targetPerHour: 1000, 
    nodeRedTopic: 'brewery/tanks/02',
    display: { ...DEFAULT_DISPLAY, showTemp: true },
    dataMapping: DEFAULT_MAPPING,
    x: 340, y: 40, w: 280, h: 220,
    productionUnit: 'HL',
    timeBasis: 'DAY'
  },
  { 
    id: 'ENV-LAT', 
    name: 'Linha Envase (Latas)', 
    targetPerHour: 5000, 
    nodeRedTopic: 'brewery/filling/cans',
    display: { ...DEFAULT_DISPLAY, showVolume: true, showHourly: true, showPB: true },
    dataMapping: { 
        ...DEFAULT_MAPPING, 
        // Example of custom mapping for this specific line
        speedKey: 'cpm' // Cans per minute key
    },
    x: 40, y: 280, w: 580, h: 180,
    productionUnit: 'UN',
    timeBasis: 'MINUTE'
  },
  { 
    id: 'ENV-BAR', 
    name: 'Linha Barris (Kegs)', 
    targetPerHour: 150, 
    nodeRedTopic: 'brewery/filling/kegs',
    display: { ...DEFAULT_DISPLAY, showVolume: true, showPB: true },
    dataMapping: DEFAULT_MAPPING,
    x: 40, y: 480, w: 300, h: 180,
    productionUnit: 'UN',
    timeBasis: 'HOUR'
  },
];

export const APP_CONFIG = {
  // Connection Watchdog in ms. If no data for X ms, show warning.
  WATCHDOG_TIMEOUT: 10000, 
  // Node-RED WebSocket URL (Uses Env Var or default local)
  // To set in dev: create .env file with VITE_WS_URL=ws://192.168.1.50:1880/ws
  WS_URL: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:1880/ws/brewery-data', 
};

export const STATUS_COLORS: Record<string, string> = {
  RUNNING: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  STOPPED: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  ALARM: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  MAINTENANCE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};
