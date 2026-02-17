import { LineConfig, DataMapping } from './types';

const DEFAULT_DISPLAY = {
  showVolume: false,
  showPB: false,
  showHourly: false,
  showTemp: false,
  showTrend: false,
  showBarChart: false
};

const DEFAULT_MAPPING: DataMapping = {
  productionKey: 'count',
  speedKey: 'rate_h',
  temperatureKey: 'temp_c',
  rejectKey: 'rejects',
  statusKey: 'status',
  efficiencyKey: 'oee'
};

export const LINE_CONFIGS: LineConfig[] = [
  { 
    id: 'TNK-01', 
    name: 'Fermentador IPA', 
    targetPerHour: 1000, 
    nodeRedTopic: 'brewery/tanks/01',
    display: { ...DEFAULT_DISPLAY, showTemp: true, showTrend: true },
    dataMapping: DEFAULT_MAPPING,
    x: 40, y: 140, w: 280, h: 220,
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
    x: 340, y: 140, w: 280, h: 220,
    productionUnit: 'HL',
    timeBasis: 'DAY'
  },
];

export const APP_CONFIG = {
  WATCHDOG_TIMEOUT: 10000, 
  WS_URL: 'ws://localhost:1880/ws/brewery-data', 
};

export const STATUS_COLORS: Record<string, string> = {
  RUNNING: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  STOPPED: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  ALARM: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  MAINTENANCE: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};