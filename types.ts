// Visual preferences for what data to show on the card
export interface DisplayConfig {
  showVolume: boolean;  // Production Count
  showPB: boolean;      // PB (Efficiency/OEE or Gross Production)
  showHourly: boolean;  // Current Hourly Rate
  showTemp: boolean;    // Temperature
  showTrend: boolean;   // The bottom chart
}

// Data Mapping for Node-RED bridge
export interface DataMapping {
  volumeKey: string;
  pbKey: string;
  hourlyKey: string;
  tempKey: string;
}

// Defines the configuration for a production line (static data)
export interface LineConfig {
  id: string;
  name: string;
  // Data configuration
  targetPerHour: number;
  nodeRedTopic: string;
  dataMapping?: DataMapping; 
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

// Defines the dynamic data payload (from Node-RED)
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
export type MediaType = 'IMAGE' | 'VIDEO';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  duration: number; // in seconds (for images)
  name: string;
}

// Announcement Types
export type AnnouncementType = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Announcement {
  id: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
}

// Layout Configuration Types
export type WidgetSize = 'COMPACT' | 'NORMAL' | 'LARGE'; // Legacy type kept for compatibility if needed, but UI uses W/H
export type SplitDirection = 'HORIZONTAL' | 'VERTICAL'; 
export type PanelOrder = 'MEDIA_FIRST' | 'DASHBOARD_FIRST';
export type MediaFitMode = 'CONTAIN' | 'COVER';
export type PartyEffect = 'GLOW' | 'CONFETTI' | 'BUBBLES' | 'DISCO';

export interface LayoutSettings {
  mediaPanelSize: number; 
  splitDirection: SplitDirection;
  panelOrder: PanelOrder;
  widgetSize: WidgetSize; // Global default
  showMediaPanel: boolean;
  showTicker: boolean;
  mediaFit: MediaFitMode; 
  tickerSpeed: number;
  isPartyMode: boolean; // NEW: Party Mode Toggle
  partyMessage?: string; // NEW: Custom party message
  partyEffect: PartyEffect; // NEW: Specific visual effect
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
  lastHeartbeat: number;
  mediaPlaylist: MediaItem[];
  announcements: Announcement[];
  showSettings: boolean;
  layout: LayoutSettings;
  connectionConfig: ConnectionSettings; // NEW: Global Connection Config
}

export interface AppContextType extends AppState {
  isStale: boolean;
  addMedia: (item: MediaItem) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (startIndex: number, endIndex: number) => void; // NEW
  addAnnouncement: (item: Announcement) => void;
  removeAnnouncement: (id: string) => void;
  toggleSettings: () => void;
  updateLayout: (settings: Partial<LayoutSettings>) => void;
  updateConnectionConfig: (settings: Partial<ConnectionSettings>) => void;
  // Line Management Actions
  addLine: (config: LineConfig) => void;
  updateLine: (id: string, config: Partial<LineConfig>) => void;
  removeLine: (id: string) => void;
  reorderLines: (startIndex: number, endIndex: number) => void;
  updateLineConfig: (id: string, target: number) => void; // Legacy support
}