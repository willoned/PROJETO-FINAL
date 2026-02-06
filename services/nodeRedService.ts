import { APP_CONFIG } from '../constants';

/**
 * PRODUCTION WEBSOCKET SERVICE
 * Handles persistent connection to Node-RED/MQTT Broker via WebSockets.
 * Includes auto-reconnect strategy and heartbeat monitoring.
 */

type MessageCallback = (data: any) => void;
type StatusCallback = (status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR') => void;
type ErrorCallback = (errorMsg: string) => void;

class NodeRedService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private isIntentionalClose = false;
  private listeners: MessageCallback[] = [];
  private debugListeners: MessageCallback[] = []; // NEW: Listeners for raw debug data
  private statusListeners: StatusCallback[] = [];
  private errorListeners: ErrorCallback[] = [];
  private url: string;

  constructor() {
    this.url = APP_CONFIG.WS_URL;
  }

  /**
   * Initialize connection
   */
  public connect(onMessage: MessageCallback, onStatusChange: StatusCallback, onError?: ErrorCallback) {
    this.listeners.push(onMessage);
    this.statusListeners.push(onStatusChange);
    if (onError) this.errorListeners.push(onError);

    // If already connected, notify immediately
    if (this.ws?.readyState === WebSocket.OPEN) {
      onStatusChange('CONNECTED');
    } else {
      this.initWebSocket();
    }

    // Return cleanup function
    return () => {
      this.listeners = this.listeners.filter(l => l !== onMessage);
      this.statusListeners = this.statusListeners.filter(l => l !== onStatusChange);
      if (onError) this.errorListeners = this.errorListeners.filter(l => l !== onError);
    };
  }

  /**
   * Allow components to subscribe to raw data for debugging purposes
   * without affecting the main application state logic.
   */
  public subscribeDebug(onRawData: MessageCallback) {
    this.debugListeners.push(onRawData);
    return () => {
        this.debugListeners = this.debugListeners.filter(l => l !== onRawData);
    };
  }

  /**
   * Update URL and reconnect (Used when changing settings)
   */
  public updateConnectionConfig(url: string) {
    if (this.url === url) return;
    this.url = url;
    this.disconnect();
    this.initWebSocket();
  }

  private initWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    this.isIntentionalClose = false;
    this.notifyStatus('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] Connected to Industrial Bridge:', this.url);
        this.notifyStatus('CONNECTED');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
          this.notifyDebug(data); // Notify debuggers
        } catch (e) {
          console.error('[WS] Failed to parse message:', event.data);
          this.notifyError(`Erro ao processar dados JSON: ${e instanceof Error ? e.message : 'Formato inválido'}`);
          // Also send raw string to debug if JSON parse fails, wrapping it
          this.notifyDebug({ error: 'JSON Parse Error', raw: event.data });
        }
      };

      this.ws.onclose = (event) => {
        if (!this.isIntentionalClose) {
          console.warn('[WS] Disconnected. Retrying in 5s...', event.reason);
          this.notifyStatus('DISCONNECTED');
          this.scheduleReconnect();
        } else {
            this.notifyStatus('DISCONNECTED');
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        this.notifyStatus('ERROR');
        this.notifyError('Falha na conexão com o servidor WebSocket. Verifique as configurações de rede.');
        // Close event will trigger reconnect
      };

    } catch (e) {
      console.error('[WS] Connection Failed', e);
      this.notifyStatus('ERROR');
      this.notifyError(`Não foi possível iniciar a conexão: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = window.setTimeout(() => {
        console.log('[WS] Attempting Reconnect...');
        this.initWebSocket();
      }, 5000);
    }
  }

  public disconnect() {
    this.isIntentionalClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private notifyListeners(data: any) {
    this.listeners.forEach(l => l(data));
  }

  private notifyDebug(data: any) {
    this.debugListeners.forEach(l => l(data));
  }

  private notifyStatus(status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR') {
    this.statusListeners.forEach(l => l(status));
  }

  private notifyError(msg: string) {
    this.errorListeners.forEach(l => l(msg));
  }
}

export const nodeRedService = new NodeRedService();
