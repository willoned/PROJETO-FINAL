import { APP_CONFIG } from '../constants';
import { NodeRedPayload } from '../types';

/**
 * PRODUCTION WEBSOCKET SERVICE
 */

type MessageCallback = (data: NodeRedPayload | NodeRedPayload[]) => void;
type StatusCallback = (status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR') => void;
type ErrorCallback = (errorMsg: string) => void;

class NodeRedService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private isIntentionalClose = false;
  private listeners: MessageCallback[] = [];
  private debugListeners: ((data: any) => void)[] = [];
  private statusListeners: StatusCallback[] = [];
  private errorListeners: ErrorCallback[] = [];
  private url: string;

  constructor() {
    this.url = APP_CONFIG.WS_URL;
  }

  public connect(onMessage: MessageCallback, onStatusChange: StatusCallback, onError?: ErrorCallback) {
    this.listeners.push(onMessage);
    this.statusListeners.push(onStatusChange);
    if (onError) this.errorListeners.push(onError);

    if (this.ws?.readyState === WebSocket.OPEN) {
      onStatusChange('CONNECTED');
    } else {
      this.initWebSocket();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== onMessage);
      this.statusListeners = this.statusListeners.filter(l => l !== onStatusChange);
      if (onError) this.errorListeners = this.errorListeners.filter(l => l !== onError);
    };
  }

  public subscribeDebug(onRawData: (data: any) => void) {
    this.debugListeners.push(onRawData);
    return () => {
        this.debugListeners = this.debugListeners.filter(l => l !== onRawData);
    };
  }

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
        console.log('[WS] Connected to Industrial Bridge');
        this.notifyStatus('CONNECTED');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          // Cast raw to typed payload (Runtime validation could be added here for extra safety)
          const data: NodeRedPayload | NodeRedPayload[] = raw;
          
          this.notifyListeners(data);
          this.notifyDebug(data);
        } catch (e) {
          console.error('[WS] Parse error');
          this.notifyDebug({ error: 'JSON Parse Error', raw: event.data });
        }
      };

      this.ws.onclose = (event) => {
        if (!this.isIntentionalClose) {
          this.notifyStatus('DISCONNECTED');
          this.scheduleReconnect();
        } else {
            this.notifyStatus('DISCONNECTED');
        }
      };

      this.ws.onerror = () => {
        this.notifyStatus('ERROR');
        this.notifyError('Falha na conexão com o servidor WebSocket.');
      };

    } catch (e) {
      this.notifyStatus('ERROR');
      this.notifyError(`Exception: ${e instanceof Error ? e.message : 'Unknown'}`);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = window.setTimeout(() => {
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

  private notifyListeners(data: NodeRedPayload | NodeRedPayload[]) {
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