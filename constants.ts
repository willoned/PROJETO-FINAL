import { LineConfig } from './types';

// Default display settings: Clean (only nomenclature) as requested
const DEFAULT_DISPLAY = {
  showVolume: false,
  showPB: false,
  showHourly: false,
  showTemp: false,
  showTrend: false
};

const DEFAULT_MAPPING = {
  volumeKey: 'count',
  pbKey: 'oee',
  hourlyKey: 'rate_h',
  tempKey: 'temp_c'
};

// ==========================================
// SCALABILITY CONFIGURATION
// Now with Absolute Positioning (x, y, w, h in pixels)
// ==========================================
export const LINE_CONFIGS: LineConfig[] = [
  { 
    id: 'TNK-01', 
    name: 'Fermentador IPA', 
    targetPerHour: 1000, 
    nodeRedTopic: 'brewery/tanks/01',
    display: { ...DEFAULT_DISPLAY, showTemp: true, showTrend: true },
    dataMapping: DEFAULT_MAPPING,
    x: 40, y: 40, w: 280, h: 220
  },
  { 
    id: 'TNK-02', 
    name: 'Fermentador Lager', 
    targetPerHour: 1000, 
    nodeRedTopic: 'brewery/tanks/02',
    display: { ...DEFAULT_DISPLAY, showTemp: true },
    dataMapping: DEFAULT_MAPPING,
    x: 340, y: 40, w: 280, h: 220
  },
  { 
    id: 'ENV-LAT', 
    name: 'Linha Envase (Latas)', 
    targetPerHour: 5000, 
    nodeRedTopic: 'brewery/filling/cans',
    display: { ...DEFAULT_DISPLAY, showVolume: true, showHourly: true, showPB: true },
    dataMapping: DEFAULT_MAPPING,
    x: 40, y: 280, w: 580, h: 180
  },
  { 
    id: 'ENV-BAR', 
    name: 'Linha Barris (Kegs)', 
    targetPerHour: 150, 
    nodeRedTopic: 'brewery/filling/kegs',
    display: { ...DEFAULT_DISPLAY, showVolume: true, showPB: true },
    dataMapping: DEFAULT_MAPPING,
    x: 40, y: 480, w: 300, h: 180
  },
];

export const APP_CONFIG = {
  // Connection Watchdog in ms. If no data for X ms, show warning.
  WATCHDOG_TIMEOUT: 10000, 
  // How often the graph updates
  REFRESH_RATE: 2000,
  // Node-RED WebSocket URL (Use env var in production)
  WS_URL: 'ws://localhost:1880/ws/brewery-data', 
};

export const STATUS_COLORS = {
  RUNNING: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  STOPPED: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  ALARM: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  MAINTENANCE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};