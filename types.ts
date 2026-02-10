
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
// Configures which key in the incoming JSON corresponds to which internal field
export interface DataMapping {
  productionKey: string;   // Maps to productionCount
  speedKey: string;        // Maps to currentHourlyRate
  temperatureKey: string;  // Maps to temperature
  rejectKey: string;       // Maps to rejectCount
  statusKey: string;       // Maps to status ('RUNNING' | 'STOPPED' | etc)
  efficiencyKey: string;   // Maps to efficiency
}

// Defines the configuration for a production line (static data)
export interface LineConfig {
  id: string;
  name: string;
  image?: string; // NEW: Machine Image URL (Base64 or Link)
  
  // Measurement Configuration
  productionUnit?: string; // NEW: L, ML, HL, KG, UN
  timeBasis?: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH'; // NEW: Time basis for rate
  
  // Data configuration
  targetPerHour: number;
  nodeRedTopic: string; // The topic/id to match in the WebSocket payload
  dataMapping: DataMapping; 
  // Visual configuration (Absolute Positioning)
  x: number;
  y: number;
  w: number;
  h: number;
  display: DisplayConfig;
}

// Defines the real-time status of a machine
export type MachineStatus = 'RUNNING' | 'STOPPED' | 'ALARM' | 'MAINTENANCE';

// Defines a single point in the trend graph
export interface TrendPoint {
  time: string; // HH:mm
  value: number;
}

// Defines the dynamic data payload (Standardized for UI)
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

// Media Types for the left panel
export type MediaType = 'IMAGE' | 'VIDEO' | 'HTML';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  duration: number; // in seconds (for images)
  name: string;
}

// Announcement Types
export type AnnouncementType = 'INFO' | 'WARNING' | 'CRITICAL' | 'ATTENTION';

export interface Announcement {
  id: string;
  message: string;
  type: AnnouncementType;
  displayMode?: 'TICKER' | 'OVERLAY'; // NEW: Control if it's a footer ticker or a big central popup
  isActive: boolean;
  schedule?: {
    start?: string; // ISO String
    end?: string;   // ISO String
  };
}

// Layout Configuration Types
export type WidgetSize = 'COMPACT' | 'NORMAL' | 'LARGE'; // Legacy type kept for compatibility if needed, but UI uses W/H
export type MediaFitMode = 'CONTAIN' | 'COVER';
// UPDATED: Added new party effects
export type PartyEffect = 
  | 'GLOW' 
  | 'CONFETTI' 
  | 'BUBBLES' 
  | 'DISCO' 
  | 'WORLDCUP' 
  | 'OLYMPICS' 
  | 'BIRTHDAY' 
  | 'BONUS' 
  | 'GOAL'
  | 'CUSTOM'; // NEW: Custom image mode

// New interface for floating windows configuration
export interface FloatingWindowConfig {
  id: string; // Unique ID (used for playlist key)
  name: string; // Display name
  x: number;
  y: number;
  w: number;
  h: number;
}

// NEW: Header Customization Settings
export interface HeaderSettings {
  title: string;
  subtitle: string;
  textColor: string;
  backgroundColor: string;
  showTopMedia: boolean;
  topMediaHeight: number; // Height in pixels
  topMediaBorderWidth: number; // NEW: Border thickness
  alignment: 'LEFT' | 'CENTER'; // NEW: Title alignment
}

// NEW: Floating Logo Widget Settings
export interface LogoWidgetSettings {
  show: boolean;
  url?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayoutSettings {
  header: HeaderSettings; // NEW: Header config
  logoWidget: LogoWidgetSettings; // NEW: Floating Logo
  floatingWindows: FloatingWindowConfig[]; // UPDATED: Multiple windows support
  widgetSize: WidgetSize; // Global default
  showMediaPanel: boolean; // Controls if ANY floating window is shown (Global toggle)
  showTicker: boolean;
  tickerHeight: number; // NEW: Adjustable ticker height
  tickerFontSize: number; // NEW: Adjustable ticker font size
  mediaFit: MediaFitMode; 
  tickerSpeed: number;
  isPartyMode: boolean; // NEW: Party Mode Toggle
  partyMessage?: string; // NEW: Custom party message
  partyEffect: PartyEffect; // NEW: Specific visual effect
  customPartyImage?: string; // NEW: Base64 for custom party particle
}

// Connection Settings (MQTT/WebSocket)
export interface ConnectionSettings {
  protocol: 'ws' | 'wss';
  host: string;
  port: string;
  path: string; // e.g., /mqtt or /ws/brewery-data
  username?: string;
  password?: string;
  autoConnect: boolean;
}

// Global State Shape
export interface AppState {
  lineConfigs: LineConfig[]; 
  machines: Record<string, MachineData>;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  globalError: string | null; // NEW: Global error message for UI display
  lastHeartbeat: number;
  // UPDATED: Support multiple playlists
  playlists: Record<string, MediaItem[]>; 
  announcements: Announcement[];
  showSettings: boolean;
  layout: LayoutSettings;
  connectionConfig: ConnectionSettings; 
}

export interface AppContextType extends AppState {
  isStale: boolean;
  // UPDATED Actions to accept playlistKey
  addMedia: (playlistKey: string, item: MediaItem) => void;
  removeMedia: (playlistKey: string, id: string) => void;
  updateMedia: (playlistKey: string, id: string, data: Partial<MediaItem>) => void; // NEW: Update duration/props
  reorderMedia: (playlistKey: string, startIndex: number, endIndex: number) => void;
  
  addAnnouncement: (item: Announcement) => void;
  removeAnnouncement: (id: string) => void;
  toggleSettings: () => void;
  updateLayout: (settings: Partial<LayoutSettings>) => void;
  updateConnectionConfig: (settings: Partial<ConnectionSettings>) => void;
  
  // Window Management
  addWindow: (name: string) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, config: Partial<FloatingWindowConfig>) => void;

  // Line Management Actions
  addLine: (config: LineConfig) => void;
  updateLine: (id: string, config: Partial<LineConfig>) => void;
  removeLine: (id: string) => void;
  reorderLines: (startIndex: number, endIndex: number) => void;
  updateLineConfig: (id: string, target: number) => void; // Legacy support
  clearError: () => void; // NEW
}
