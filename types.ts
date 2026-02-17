
export interface DisplayConfig {
  showVolume: boolean;
  showPB: boolean;
  showHourly: boolean;
  showTemp: boolean;
  showTrend: boolean;
  showBarChart: boolean;
}

export interface DataMapping {
  productionKey: string;
  speedKey: string;
  temperatureKey: string;
  rejectKey: string;
  statusKey: string;
  efficiencyKey: string;
}

export interface NodeRedPayload {
  id?: string;
  topic?: string;
  payload: {
    [key: string]: string | number | boolean | undefined;
  } | number | string;
  timestamp?: number;
}

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
  efficiency: number; 
  lastUpdated: number; 
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
  visible: boolean;
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
  partyColor?: string;
  customPartyImage?: string;
  customPartyRemoveBg?: boolean;
}

export interface ConnectionSettings {
  protocol: 'ws' | 'wss';
  host: string;
  port: string;
  path: string;
  autoConnect: boolean;
}

export interface MachineContextType {
  // State
  machines: Record<string, MachineData>;
  lineConfigs: LineConfig[];
  layout: LayoutSettings;
  connectionConfig: ConnectionSettings;
  playlists: Record<string, MediaItem[]>;
  announcements: Announcement[];
  
  // UI State
  showSettings: boolean;
  isEditing: boolean;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  
  // Actions
  toggleSettings: () => void;
  setEditing: (editing: boolean) => void;
  updateLayout: (settings: Partial<LayoutSettings>) => void;
  updateConnectionConfig: (settings: Partial<ConnectionSettings>) => void;
  
  addLine: (config: LineConfig) => void;
  updateLine: (id: string, config: Partial<LineConfig>) => void;
  removeLine: (id: string) => void;
  
  addMedia: (playlistKey: string, item: MediaItem) => void;
  removeMedia: (playlistKey: string, id: string) => void;
  updateMedia: (playlistKey: string, id: string, data: Partial<MediaItem>) => void;
  reorderMedia: (playlistKey: string, startIndex: number, endIndex: number) => void;
  
  addAnnouncement: (item: Announcement) => void;
  removeAnnouncement: (id: string) => void;

  addWindow: (name: string) => void;
  updateWindow: (id: string, config: Partial<FloatingWindowConfig>) => void;
  removeWindow: (id: string) => void;
}

export type UserRole = 'ADMIN' | 'CREATOR';
export type PermissionTab = 'LINES' | 'API' | 'LAYOUT' | 'MEDIA' | 'ALERTS' | 'PARTY' | 'HEADER';

export interface User {
  username: string;
  password?: string; // Only used for internal storage, not exposed ideally
  role: UserRole;
  permissions: PermissionTab[]; // Which tabs can they see?
}

export interface AuthContextType {
  user: User | null;
  usersList: User[];
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  createUser: (user: User) => void;
  deleteUser: (username: string) => void;
  isAuthenticated: boolean;
}

export interface LayoutContextType {
  lineConfigs: LineConfig[];
  playlists: Record<string, MediaItem[]>;
  announcements: Announcement[];
  showSettings: boolean;
  layout: LayoutSettings;
  connectionConfig: ConnectionSettings;
  isEditing: boolean;
  isLockedByOther: boolean;
  lockedBy: string | null;

  addMedia: (key: string, item: MediaItem) => void;
  removeMedia: (key: string, id: string) => void;
  updateMedia: (key: string, id: string, data: Partial<MediaItem>) => void;
  reorderMedia: (key: string, startIndex: number, endIndex: number) => void;

  addAnnouncement: (item: Announcement) => void;
  removeAnnouncement: (id: string) => void;

  toggleSettings: () => void;
  requestLock: () => void;
  releaseLock: () => void;
  saveLayout: () => void;

  updateLayout: (settings: Partial<LayoutSettings>) => void;
  updateConnectionConfig: (settings: Partial<ConnectionSettings>) => void;

  addWindow: (name: string) => void;
  updateWindow: (id: string, config: Partial<FloatingWindowConfig>) => void;
  removeWindow: (id: string) => void;
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
  setError: (msg: string) => void;
}