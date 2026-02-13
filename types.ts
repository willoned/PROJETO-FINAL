// Visual preferences for what data to show on the card
export interface DisplayConfig {
  showVolume: boolean;  // Production Count
  showPB: boolean;      // PB (Efficiency/OEE or Gross Production)
  showHourly: boolean;  // Current Hourly Rate
  showTemp: boolean;    // Temperature
  showTrend: boolean;   // The bottom chart (Area)
  showBarChart: boolean; // NEW: The bottom chart (Bar)
}

// Data Mapping for Node-RED bridge
export interface DataMapping {
  productionKey: string;   // Maps to productionCount
  speedKey: string;        // Maps to currentHourlyRate
  temperatureKey: string;  // Maps to temperature
  rejectKey: string;       // Maps to rejectCount
  statusKey: string;       // Maps to status ('RUNNING' | 'STOPPED' | etc)
  efficiencyKey: string;   // Maps to efficiency
}

// STRICT INTERFACE FOR RAW NODE-RED DATA
export interface NodeRedPayload {
  id?: string;
  topic?: string;
  payload: {
    [key: string]: string | number | boolean | undefined;
    // Common keys expected based on mapping, but dynamic
    count?: number;
    rate_h?: number;
    temp_c?: number;
    rejects?: number;
    status?: string;
    oee?: number;
  } | number | string; // Payload can sometimes be primitive
  timestamp?: number;
}

// Defines the configuration for a production line (static data)
export interface LineConfig {
  id: string;
  name: string;
  image?: string;
  productionUnit?: string;
  timeBasis?: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  targetPerHour: number;
  nodeRedTopic: string;
  dataMapping: DataMapping; 
  x: number;
  y: number;
  w: number;
  h: number;
  display: DisplayConfig;
}

export type MachineStatus = 'RUNNING' | 'STOPPED' | 'ALARM' | 'MAINTENANCE';

export interface TrendPoint {
  time: string;
  value: number;
}

export interface MachineData {
  lineId: string;
  status: MachineStatus;
  productionCount: number;
  currentHourlyRate: number; 
  rejectCount: number;
  temperature: number;
  lastUpdated: number; 
  efficiency: number; 
  trend: TrendPoint[];
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'HTML';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  duration: number;
  name: string;
}

export type AnnouncementType = 'INFO' | 'WARNING' | 'CRITICAL' | 'ATTENTION';

export interface Announcement {
  id: string;
  message: string;
  type: AnnouncementType;
  displayMode?: 'TICKER' | 'OVERLAY';
  isActive: boolean;
  schedule?: {
    start?: string;
    end?: string;
  };
}

export type WidgetSize = 'COMPACT' | 'NORMAL' | 'LARGE';
export type MediaFitMode = 'CONTAIN' | 'COVER';

export type PartyEffect = 
  | 'GLOW' | 'CONFETTI' | 'BUBBLES' | 'DISCO' | 'WORLDCUP' 
  | 'OLYMPICS' | 'BIRTHDAY' | 'BONUS' | 'GOAL' | 'CUSTOM';

export interface FloatingWindowConfig {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HeaderSettings {
  title: string;
  subtitle: string;
  textColor: string;
  backgroundColor: string;
  showTopMedia: boolean;
  topMediaHeight: number;
  topMediaBorderWidth: number;
  alignment: 'LEFT' | 'CENTER';
}

export interface LogoWidgetSettings {
  show: boolean;
  url?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutSettings {
  header: HeaderSettings;
  logoWidget: LogoWidgetSettings;
  floatingWindows: FloatingWindowConfig[];
  areWindowsLocked: boolean;
  widgetSize: WidgetSize;
  showMediaPanel: boolean;
  showTicker: boolean;
  tickerHeight: number;
  tickerFontSize: number;
  mediaFit: MediaFitMode; 
  tickerSpeed: number;
  isPartyMode: boolean;
  partyMessage?: string;
  partyEffect: PartyEffect;
  customPartyImage?: string;
}

export interface ConnectionSettings {
  protocol: 'ws' | 'wss';
  host: string;
  port: string;
  path: string;
  username?: string;
  password?: string;
  autoConnect: boolean;
}

// --- AUTH TYPES ---
export type UserRole = 'ADMIN' | 'OPERATOR';

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// CONTEXT INTERFACES (SPLIT)

export interface LayoutContextType {
  lineConfigs: LineConfig[];
  playlists: Record<string, MediaItem[]>;
  announcements: Announcement[];
  showSettings: boolean;
  layout: LayoutSettings;
  connectionConfig: ConnectionSettings;
  
  // Actions
  addMedia: (playlistKey: string, item: MediaItem) => void;
  removeMedia: (playlistKey: string, id: string) => void;
  updateMedia: (playlistKey: string, id: string, data: Partial<MediaItem>) => void;
  reorderMedia: (playlistKey: string, startIndex: number, endIndex: number) => void;
  addAnnouncement: (item: Announcement) => void;
  removeAnnouncement: (id: string) => void;
  toggleSettings: () => void;
  updateLayout: (settings: Partial<LayoutSettings>) => void;
  updateConnectionConfig: (settings: Partial<ConnectionSettings>) => void;
  addWindow: (name: string) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, config: Partial<FloatingWindowConfig>) => void;
  resetWindowDimensions: () => void;
  addLine: (config: LineConfig) => void;
  updateLine: (id: string, config: Partial<LineConfig>) => void;
  removeLine: (id: string) => void;
  reorderLines: (startIndex: number, endIndex: number) => void;
}

export interface DataContextType {
  machines: Record<string, MachineData>;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  globalError: string | null;
  lastHeartbeat: number;
  isStale: boolean;
  clearError: () => void;
}